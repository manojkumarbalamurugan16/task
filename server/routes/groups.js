import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

// Get all groups
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM dbGroup ORDER BY modifiedAt DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM dbGroup WHERE Id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Search groups by name (for suggestions)
router.get('/search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const [rows] = await pool.execute(
      'SELECT groupName FROM dbGroup WHERE groupName LIKE ? AND groupName != ? LIMIT 5',
      [`%${name}%`, name]
    );
    res.json(rows.map(row => row.groupName));
  } catch (error) {
    console.error('Error searching groups:', error);
    res.status(500).json({ error: 'Failed to search groups' });
  }
});

// Check if group name exists
router.get('/check/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const [rows] = await pool.execute(
      'SELECT Id FROM dbGroup WHERE groupName = ?',
      [name]
    );
    res.json({ exists: rows.length > 0, id: rows.length > 0 ? rows[0].Id : null });
  } catch (error) {
    console.error('Error checking group name:', error);
    res.status(500).json({ error: 'Failed to check group name' });
  }
});

// Create group
router.post('/', async (req, res) => {
  try {
    const { groupName } = req.body;
    
    if (!groupName || groupName.trim() === '') {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Check if group name already exists
    const [existing] = await pool.execute(
      'SELECT Id FROM dbGroup WHERE groupName = ?',
      [groupName.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Group name already exists' });
    }

    const [result] = await pool.execute(
      'INSERT INTO dbGroup (groupName) VALUES (?)',
      [groupName.trim()]
    );

    res.status(201).json({ id: result.insertId, groupName: groupName.trim() });
  } catch (error) {
    console.error('Error creating group:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Group name already exists' });
    }
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Update group
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { groupName } = req.body;

    if (!groupName || groupName.trim() === '') {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Check if new name already exists (excluding current group)
    const [existing] = await pool.execute(
      'SELECT Id FROM dbGroup WHERE groupName = ? AND Id != ?',
      [groupName.trim(), id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Group name already exists' });
    }

    const [result] = await pool.execute(
      'UPDATE dbGroup SET groupName = ? WHERE Id = ?',
      [groupName.trim(), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ id, groupName: groupName.trim() });
  } catch (error) {
    console.error('Error updating group:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Group name already exists' });
    }
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete group (soft delete by deleting all inputs)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First soft delete all inputs
    await pool.execute(
      'UPDATE dbInputs SET isDeleted = TRUE WHERE groupID = ?',
      [id]
    );

    // Then delete the group
    const [result] = await pool.execute(
      'DELETE FROM dbGroup WHERE Id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

export default router;
