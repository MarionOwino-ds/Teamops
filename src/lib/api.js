const TOKEN_KEY = 'teamops-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    // non-JSON response
  }

  if (!response.ok) {
    const error = new Error(data?.error || `Request failed with status ${response.status}`)
    error.status = response.status
    throw error
  }
  return data
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  updateProfile: (payload) => request('/auth/me', { method: 'PATCH', body: payload }),

  // Workspaces
  listWorkspaces: () => request('/workspaces'),
  createWorkspace: (payload) => request('/workspaces', { method: 'POST', body: payload }),
  getWorkspace: (workspaceId) => request(`/workspaces/${workspaceId}`),
  updateWorkspace: (workspaceId, payload) => request(`/workspaces/${workspaceId}`, { method: 'PATCH', body: payload }),
  deleteWorkspace: (workspaceId) => request(`/workspaces/${workspaceId}`, { method: 'DELETE' }),
  listMembers: (workspaceId) => request(`/workspaces/${workspaceId}/members`),
  addMember: (workspaceId, payload) => request(`/workspaces/${workspaceId}/members`, { method: 'POST', body: payload }),
  updateMemberRole: (workspaceId, userId, payload) => request(`/workspaces/${workspaceId}/members/${userId}`, { method: 'PATCH', body: payload }),
  removeMember: (workspaceId, userId) => request(`/workspaces/${workspaceId}/members/${userId}`, { method: 'DELETE' }),

  // Projects
  listProjects: (workspaceId) => request(`/workspaces/${workspaceId}/projects`),
  createProject: (workspaceId, payload) => request(`/workspaces/${workspaceId}/projects`, { method: 'POST', body: payload }),
  updateProject: (workspaceId, projectId, payload) => request(`/workspaces/${workspaceId}/projects/${projectId}`, { method: 'PATCH', body: payload }),
  deleteProject: (workspaceId, projectId) => request(`/workspaces/${workspaceId}/projects/${projectId}`, { method: 'DELETE' }),

  // Tasks
  listTasks: (workspaceId, projectId) => request(`/workspaces/${workspaceId}/tasks${projectId ? `?projectId=${projectId}` : ''}`),
  createTask: (workspaceId, payload) => request(`/workspaces/${workspaceId}/tasks`, { method: 'POST', body: payload }),
  updateTask: (workspaceId, taskId, payload) => request(`/workspaces/${workspaceId}/tasks/${taskId}`, { method: 'PATCH', body: payload }),
  deleteTask: (workspaceId, taskId) => request(`/workspaces/${workspaceId}/tasks/${taskId}`, { method: 'DELETE' }),

  // Records
  listRecords: (workspaceId, page) => request(`/workspaces/${workspaceId}/records${page ? `?page=${encodeURIComponent(page)}` : ''}`),
  createRecord: (workspaceId, payload) => request(`/workspaces/${workspaceId}/records`, { method: 'POST', body: payload }),
  deleteRecord: (workspaceId, recordId) => request(`/workspaces/${workspaceId}/records/${recordId}`, { method: 'DELETE' }),
}