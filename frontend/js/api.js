// js/api.js - API helper functions
const API_BASE = '/api';

// Generic fetch wrapper
async function apiFetch(endpoint, options = {}) {
  const res = await fetch(API_BASE + endpoint, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// Auth APIs
const Auth = {
  login: (username, password) => apiFetch('/auth/login', { method: 'POST', body: { username, password } }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/auth/me')
};

// Student APIs
const Students = {
  getAll: (search = '') => apiFetch(`/students${search ? '?search=' + encodeURIComponent(search) : ''}`),
  getById: (id) => apiFetch(`/students/${id}`),
  create: (data) => apiFetch('/students', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/students/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiFetch(`/students/${id}`, { method: 'DELETE' })
};

// Subject APIs
const Subjects = {
  getAll: () => apiFetch('/subjects'),
  getById: (id) => apiFetch(`/subjects/${id}`),
  create: (data) => apiFetch('/subjects', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/subjects/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiFetch(`/subjects/${id}`, { method: 'DELETE' })
};

// Attendance APIs
const Attendance = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/attendance${qs ? '?' + qs : ''}`);
  },
  bulkSave: (date, records) => apiFetch('/attendance/bulk', { method: 'POST', body: { date, records } }),
  update: (id, status) => apiFetch(`/attendance/${id}`, { method: 'PUT', body: { status } }),
  stats: () => apiFetch('/attendance/stats')
};

// Marks APIs
const Marks = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/marks${qs ? '?' + qs : ''}`);
  },
  create: (data) => apiFetch('/marks', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/marks/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiFetch(`/marks/${id}`, { method: 'DELETE' }),
  getResult: (studentId, examType = 'Final') => apiFetch(`/marks/result/${studentId}?examType=${examType}`),
  dashboard: () => apiFetch('/marks/dashboard')
};
