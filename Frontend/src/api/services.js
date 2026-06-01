import api, { unwrap, unwrapPaged } from './axios';

const get = (url, params, config) => api.get(url, { params, ...config }).then(unwrapPaged);
const getOne = (url, config) => api.get(url, config).then(unwrap);
const post = (url, data, config) => api.post(url, data, config).then(unwrap);
const put = (url, data, config) => api.put(url, data, config).then(unwrap);
const del = (url, config) => api.delete(url, config).then(unwrap);

export const authApi = {
  login: (userName, password) => post('Auth/login', { userName, password }),
  register: (payload) => post('Auth/register', payload),
};

export const branchesApi = {
  list: (params, config) => get('/Branches', params, config),
  get: (id, config) => getOne(`/Branches/${id}`, config),
  create: (data) => post('/Branches', data),
  update: (id, data) => put(`/Branches/${id}`, data),
  remove: (id) => del(`/Branches/${id}`),
};

export const servicesApi = {
  list: (params, config) => get('/Services', params, config),
  get: (id, config) => getOne(`/Services/${id}`, config),
  create: (data) => post('/Services', data),
  update: (id, data) => put(`/Services/${id}`, data),
  remove: (id) => del(`/Services/${id}`),
};

export const countersApi = {
  list: (params, config) => get('/Counters', params, config),
  get: (id, config) => getOne(`/Counters/${id}`, config),
  create: (data) => post('/Counters', data),
  update: (id, data) => put(`/Counters/${id}`, data),
  remove: (id) => del(`/Counters/${id}`),
};

export const ticketsApi = {
  list: (params, config) => get('/Tickets', params, config),
  get: (id, config) => getOne(`/Tickets/${id}`, config),
  create: (data) => post('/Tickets', data),
  call: (id, counterId) => post(`/Tickets/${id}/call`, { counterId }),
  complete: (id, notes) => post(`/Tickets/${id}/complete`, { notes }),
  skip: (id, notes) => post(`/Tickets/${id}/skip`, { notes }),
  cancel: (id) => post(`/Tickets/${id}/cancel`),
};

export const usersApi = {
  list: (params, config) => get('/Users', params, config),
  get: (id, config) => getOne(`/Users/${id}`, config),
  create: (data) => post('/Users', data),
  update: (id, data) => put(`/Users/${id}`, data),
  remove: (id) => del(`/Users/${id}`),
  changePassword: (id, data) => post(`/Users/${id}/change-password`, data),
};

export const rolesApi = {
  list: (params, config) => get('/Roles', params, config),
};

export const reportsApi = {
  daily: (params, config) => api.get('/Reports/daily', { params, ...config }).then(unwrap),
  peakHours: (params, config) => api.get('/Reports/peak-hours', { params, ...config }).then(unwrap),
  staffPerformance: (params, config) =>
    api.get('/Reports/staff-performance', { params, ...config }).then(unwrap),
  queueStats: (branchId, config) =>
    api.get(`/Reports/queue-stats/${branchId}`, config).then(unwrap),
  branchStats: (config) => api.get('/Reports/branch-stats', config).then(unwrap),
};

export const queueLogsApi = {
  list: (params, config) => get('/QueueLogs', params, config),
};
