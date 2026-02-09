import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { groupsAPI, inputsAPI } from '../services/api';
import './MultiBox.css';

const MultiBox = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const groupId = searchParams.get('id');
  const isEditMode = !!groupId;

  const [groupName, setGroupName] = useState('');
  const [originalGroupName, setOriginalGroupName] = useState('');
  const [groupNameSuggestions, setGroupNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [textBoxes, setTextBoxes] = useState([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const suggestionTimeoutRef = useRef(null);
  const groupNameInputRef = useRef(null);

  const loadGroupData = useCallback(async () => {
    try {
      setLoading(true);
      const groupRes = await groupsAPI.getById(groupId);
      setGroupName(groupRes.data.groupName);
      setOriginalGroupName(groupRes.data.groupName);

      const inputsRes = await inputsAPI.getByGroupId(groupId);
      const inputs = inputsRes.data.filter(input => !input.isDeleted);
      setTextBoxes(inputs.map(input => ({
        id: input.Id,
        name: input.Name,
        isSelected: input.isSelected,
        orderNum: input.orderNum || 0,
      })));

      updateCounts(inputs);
    } catch (error) {
      console.error('Error loading group data:', error);
      alert('Failed to load group data');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Load data if in edit mode
  useEffect(() => {
    if (isEditMode && groupId) {
      loadGroupData();
    }
  }, [groupId, isEditMode, loadGroupData]);

  const updateCounts = (boxes) => {
    const selected = boxes.filter(b => b.isSelected && !b.isDeleted).length;
    const total = boxes.filter(b => !b.isDeleted).length;
    setSelectedCount(selected);
    setTotalCount(total);
  };

  const handleGroupNameChange = async (value) => {
    setGroupName(value);
    
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    if (value.trim().length > 0) {
      suggestionTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await groupsAPI.search(value);
          setGroupNameSuggestions(res.data);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      }, 300);
    } else {
      setGroupNameSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setGroupName(suggestion);
    setShowSuggestions(false);
    groupNameInputRef.current?.focus();
  };

  const handleAddTextBox = () => {
    if (inputValue.trim() === '') return;

    const newBox = {
      id: null, // Will be assigned by backend
      name: inputValue.trim(),
      isSelected: false,
      orderNum: textBoxes.length,
    };

    setTextBoxes([...textBoxes, newBox]);
    setInputValue('');
    setTotalCount(totalCount + 1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTextBox();
    }
  };

  const handleCopy = (index) => {
    const boxToCopy = textBoxes[index];
    const newBox = {
      id: null,
      name: boxToCopy.name,
      isSelected: boxToCopy.isSelected,
      orderNum: index + 1,
    };

    const newTextBoxes = [...textBoxes];
    newTextBoxes.splice(index + 1, 0, newBox);
    
    // Update order numbers
    newTextBoxes.forEach((box, idx) => {
      box.orderNum = idx;
    });

    setTextBoxes(newTextBoxes);
    setTotalCount(totalCount + 1);
    if (boxToCopy.isSelected) {
      setSelectedCount(selectedCount + 1);
    }
  };

  const handleToggleSelection = (index) => {
    const newTextBoxes = [...textBoxes];
    newTextBoxes[index].isSelected = !newTextBoxes[index].isSelected;
    setTextBoxes(newTextBoxes);
    
    const selected = newTextBoxes.filter(b => b.isSelected).length;
    setSelectedCount(selected);
  };

  const handleDelete = (index) => {
    const newTextBoxes = textBoxes.filter((_, i) => i !== index);
    
    // Update order numbers
    newTextBoxes.forEach((box, idx) => {
      box.orderNum = idx;
    });

    setTextBoxes(newTextBoxes);
    
    if (textBoxes[index].isSelected) {
      setSelectedCount(selectedCount - 1);
    }
    setTotalCount(totalCount - 1);
  };

  const getFraction = () => {
    if (totalCount === 0) return '';
    const fractionMap = {
      1: { 1: '1/1' },
      2: { 1: '½', 2: '2/2' },
      3: { 1: '⅓', 2: '⅔', 3: '3/3' },
      4: { 1: '¼', 2: '½', 3: '¾', 4: '4/4' },
      5: { 1: '⅕', 2: '⅖', 3: '⅗', 4: '⅘', 5: '5/5' },
    };

    if (totalCount <= 5 && fractionMap[totalCount]) {
      return fractionMap[totalCount][selectedCount] || `${selectedCount}/${totalCount}`;
    }
    return `${selectedCount}/${totalCount}`;
  };

  const handleSave = async () => {
    if (groupName.trim() === '') {
      alert('Please enter a group name');
      return;
    }

    if (textBoxes.length === 0) {
      alert('Please add at least one input');
      return;
    }

    try {
      setSaving(true);

      // Check if group name already exists (if not in edit mode or name changed)
      if (!isEditMode || groupName !== originalGroupName) {
        const checkRes = await groupsAPI.check(groupName);
        if (checkRes.data.exists && (!isEditMode || checkRes.data.id !== parseInt(groupId))) {
          alert('Group name already exists. Please choose a different name.');
          setSaving(false);
          return;
        }
      }

      let currentGroupId = groupId;

      // Create or update group
      if (isEditMode) {
        await groupsAPI.update(groupId, groupName);
        currentGroupId = groupId;
      } else {
        const groupRes = await groupsAPI.create(groupName);
        currentGroupId = groupRes.data.id;
      }

      // Prepare inputs data
      const inputsData = textBoxes.map((box, index) => ({
        id: box.id || null,
        Name: box.name,
        isSelected: box.isSelected,
        isDeleted: false,
        orderNum: index,
      }));

      // Bulk save inputs
      await inputsAPI.bulkSave(currentGroupId, inputsData);

      alert('Saved successfully!');
      
      // Navigate to view list or stay on edit page
      if (!isEditMode) {
        navigate('/viewListInfo');
      } else {
        // Reload data
        await loadGroupData();
      }
    } catch (error) {
      console.error('Error saving:', error);
      const errorMsg = error.response?.data?.error || 'Failed to save';
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="multi-box-container">
      <div className="header-section">
        <div className="fraction-display">{getFraction()}</div>
        <button 
          className="save-button" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="group-name-section">
        <label htmlFor="groupName">Group Name:</label>
        <div className="group-name-input-wrapper">
          <input
            ref={groupNameInputRef}
            id="groupName"
            type="text"
            value={groupName}
            onChange={(e) => handleGroupNameChange(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => {
              if (groupNameSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Enter group name"
            className="group-name-input"
          />
          {showSuggestions && groupNameSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {groupNameSuggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="suggestion-item"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="input-section">
        <div className="add-input-wrapper">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type name and click + to add"
            className="add-input"
          />
          <button 
            className="add-button" 
            onClick={handleAddTextBox}
            disabled={inputValue.trim() === ''}
          >
            +
          </button>
        </div>

        <div className="text-boxes-container">
          {textBoxes.map((box, index) => (
            <div key={box.id || `new-${index}`} className="text-box-item">
              <input
                type="text"
                value={box.name}
                readOnly
                className="text-box-input"
              />
              <div className="text-box-actions">
                <button
                  className="icon-button copy-button"
                  onClick={() => handleCopy(index)}
                  title="Copy"
                >
                  📋
                </button>
                <button
                  className={`icon-button selection-button ${box.isSelected ? 'selected' : ''}`}
                  onClick={() => handleToggleSelection(index)}
                  title="Toggle Selection"
                >
                  {box.isSelected ? '✓' : '○'}
                </button>
                <button
                  className="icon-button delete-button"
                  onClick={() => handleDelete(index)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="navigation-section">
        <button 
          className="nav-button"
          onClick={() => navigate('/viewListInfo')}
        >
          View All Groups
        </button>
      </div>
    </div>
  );
};

export default MultiBox;
