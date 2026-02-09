import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI, inputsAPI } from '../services/api';
import './ViewListInfo.css';

const ViewListInfo = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await groupsAPI.getAll();
      setGroups(res.data);
    } catch (error) {
      console.error('Error loading groups:', error);
      alert('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleDetails = async (group) => {
    try {
      setSelectedGroup(group);
      const inputsRes = await inputsAPI.getByGroupId(group.Id);
      setGroupDetails(inputsRes.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading group details:', error);
      alert('Failed to load group details');
    }
  };

  const handleEdit = (groupId) => {
    navigate(`/multiBox?id=${groupId}`);
  };

  const handleDelete = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This will also delete all associated inputs.')) {
      return;
    }

    try {
      setDeleting(groupId);
      await groupsAPI.delete(groupId);
      await loadGroups();
      alert('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="view-list-container">
      <div className="view-list-header">
        <h1>All Groups</h1>
        <button 
          className="nav-button"
          onClick={() => navigate('/multiBox')}
        >
          Create New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <p>No groups found. Create your first group!</p>
          <button 
            className="nav-button"
            onClick={() => navigate('/multiBox')}
          >
            Create Group
          </button>
        </div>
      ) : (
        <table className="groups-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Group Name</th>
              <th>Created At</th>
              <th>Modified At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.Id}>
                <td>{group.Id}</td>
                <td>{group.groupName}</td>
                <td>{formatDate(group.createdAt)}</td>
                <td>{formatDate(group.modifiedAt)}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="icon-button details-button"
                      onClick={() => handleDetails(group)}
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button
                      className="icon-button edit-button"
                      onClick={() => handleEdit(group.Id)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-button delete-button"
                      onClick={() => handleDelete(group.Id)}
                      disabled={deleting === group.Id}
                      title="Delete"
                    >
                      {deleting === group.Id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showDetailsModal && selectedGroup && groupDetails && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Group Details: {selectedGroup.groupName}</h2>
              <button 
                className="close-button"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Group Information</h3>
                <p><strong>ID:</strong> {selectedGroup.Id}</p>
                <p><strong>Group Name:</strong> {selectedGroup.groupName}</p>
                <p><strong>Created At:</strong> {formatDate(selectedGroup.createdAt)}</p>
                <p><strong>Modified At:</strong> {formatDate(selectedGroup.modifiedAt)}</p>
              </div>

              <div className="detail-section">
                <h3>Inputs ({groupDetails.filter(i => !i.isDeleted).length} active, {groupDetails.filter(i => i.isDeleted).length} deleted)</h3>
                {groupDetails.length === 0 ? (
                  <p>No inputs found.</p>
                ) : (
                  <table className="details-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Order</th>
                        <th>Selected</th>
                        <th>Deleted</th>
                        <th>Created At</th>
                        <th>Modified At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupDetails
                        .sort((a, b) => (a.orderNum || 0) - (b.orderNum || 0))
                        .map((input) => (
                          <tr key={input.Id} className={input.isDeleted ? 'deleted-row' : ''}>
                            <td>{input.Id}</td>
                            <td>{input.Name}</td>
                            <td>{input.orderNum}</td>
                            <td>{input.isSelected ? '✓' : '✗'}</td>
                            <td>{input.isDeleted ? '✓' : '✗'}</td>
                            <td>{formatDate(input.createdAt)}</td>
                            <td>{formatDate(input.modifiedAt)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="nav-button"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedGroup.Id);
                }}
              >
                Edit Group
              </button>
              <button 
                className="close-button-secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewListInfo;
