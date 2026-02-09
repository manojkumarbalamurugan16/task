import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

// Get all inputs for a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM dbInputs WHERE groupID = ? ORDER BY orderNum ASC, Id ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching inputs:', error);
    res.status(500).json({ error: 'Failed to fetch inputs' });
  }
});

// Get input by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM dbInputs WHERE Id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Input not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching input:', error);
    res.status(500).json({ error: 'Failed to fetch input' });
  }
});

// Create input
router.post('/', async (req, res) => {
  try {
    const { groupID, Name, isSelected, isDeleted, orderNum } = req.body;

    if (!groupID || !Name || Name.trim() === '') {
      return res.status(400).json({ error: 'Group ID and Name are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO dbInputs (groupID, Name, isSelected, isDeleted, orderNum) VALUES (?, ?, ?, ?, ?)',
      [groupID, Name.trim(), isSelected || false, isDeleted || false, orderNum || 0]
    );

    res.status(201).json({ 
      id: result.insertId, 
      groupID, 
      Name: Name.trim(), 
      isSelected: isSelected || false,
      isDeleted: isDeleted || false,
      orderNum: orderNum || 0
    });
  } catch (error) {
    console.error('Error creating input:', error);
    res.status(500).json({ error: 'Failed to create input' });
  }
});

// Update input
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, isSelected, isDeleted, orderNum } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (Name !== undefined) {
      updateFields.push('Name = ?');
      updateValues.push(Name.trim());
    }
    if (isSelected !== undefined) {
      updateFields.push('isSelected = ?');
      updateValues.push(isSelected);
    }
    if (isDeleted !== undefined) {
      updateFields.push('isDeleted = ?');
      updateValues.push(isDeleted);
    }
    if (orderNum !== undefined) {
      updateFields.push('orderNum = ?');
      updateValues.push(orderNum);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    const [result] = await pool.execute(
      `UPDATE dbInputs SET ${updateFields.join(', ')} WHERE Id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Input not found' });
    }

    res.json({ message: 'Input updated successfully' });
  } catch (error) {
    console.error('Error updating input:', error);
    res.status(500).json({ error: 'Failed to update input' });
  }
});

// Delete input (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'UPDATE dbInputs SET isDeleted = TRUE WHERE Id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Input not found' });
    }

    res.json({ message: 'Input deleted successfully' });
  } catch (error) {
    console.error('Error deleting input:', error);
    res.status(500).json({ error: 'Failed to delete input' });
  }
});

// Bulk save inputs for a group
router.post('/bulk', async (req, res) => {
  try {
    const { groupID, inputs } = req.body;

    if (!groupID || !Array.isArray(inputs)) {
      return res.status(400).json({ error: 'Group ID and inputs array are required' });
    }

    // Delete existing inputs for this group (or soft delete)
    // Actually, we'll update existing ones and create new ones
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get existing inputs
      const [existing] = await connection.execute(
        'SELECT Id FROM dbInputs WHERE groupID = ?',
        [groupID]
      );
      const existingIds = new Set(existing.map(row => row.Id));
      const incomingIds = new Set(inputs.filter(i => i.id).map(i => i.id));

      // Soft delete inputs that are no longer in the list
      const toDelete = Array.from(existingIds).filter(id => !incomingIds.has(id));
      if (toDelete.length > 0) {
        await connection.execute(
          `UPDATE dbInputs SET isDeleted = TRUE WHERE Id IN (${toDelete.map(() => '?').join(',')})`,
          toDelete
        );
      }

      // Update or insert inputs
      for (const input of inputs) {
        if (input.id && existingIds.has(input.id)) {
          // Update existing
          await connection.execute(
            'UPDATE dbInputs SET Name = ?, isSelected = ?, isDeleted = ?, orderNum = ? WHERE Id = ?',
            [input.Name.trim(), input.isSelected || false, input.isDeleted || false, input.orderNum || 0, input.id]
          );
        } else {
          // Insert new
          await connection.execute(
            'INSERT INTO dbInputs (groupID, Name, isSelected, isDeleted, orderNum) VALUES (?, ?, ?, ?, ?)',
            [groupID, input.Name.trim(), input.isSelected || false, input.isDeleted || false, input.orderNum || 0]
          );
        }
      }

      await connection.commit();
      res.json({ message: 'Inputs saved successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error bulk saving inputs:', error);
    res.status(500).json({ error: 'Failed to save inputs' });
  }
});

export default router;
