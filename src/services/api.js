import axios from 'axios';
import { API_BASE_URL } from '../config/api.js';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Groups API
export const groupsAPI = {
  getAll: () => api.get('/groups'),
  getById: (id) => api.get(`/groups/${id}`),
  search: (name) => api.get(`/groups/search/${encodeURIComponent(name)}`),
  check: (name) => api.get(`/groups/check/${encodeURIComponent(name)}`),
  create: (groupName) => api.post('/groups', { groupName }),
  update: (id, groupName) => api.put(`/groups/${id}`, { groupName }),
  delete: (id) => api.delete(`/groups/${id}`),
};

// Inputs API
export const inputsAPI = {
  getByGroupId: (groupId) => api.get(`/inputs/group/${groupId}`),
  getById: (id) => api.get(`/inputs/${id}`),
  create: (data) => api.post('/inputs', data),
  update: (id, data) => api.put(`/inputs/${id}`, data),
  delete: (id) => api.delete(`/inputs/${id}`),
  bulkSave: (groupId, inputs) => api.post('/inputs/bulk', { groupID: groupId, inputs }),
};

export default api;
