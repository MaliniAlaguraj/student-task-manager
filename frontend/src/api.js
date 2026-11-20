export const CATEGORIES = ['Classroom','Projector','Wi-Fi','Drinking Water','Laboratory Equipment','Washroom','Hostel','Electrical','Other'];
export const STATUSES = ['Pending', 'In Progress', 'Resolved'];
export const DEPARTMENTS = ['Computer Science','Information Technology','Electronics','Electrical','Mechanical','Civil','Business Administration','Other'];

async function request(path, options = {}) {
  const token = localStorage.getItem('adminToken');
  const res = await fetch('/api' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Is the backend running?');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  submit: (body) => request('/complaints', { method: 'POST', body: JSON.stringify(body) }),
  byRegister: (reg) => request('/complaints?registerNo=' + encodeURIComponent(reg)),
  byId: (id) => request('/complaints/' + encodeURIComponent(id)),
  login: (body) => request('/admin/login', { method: 'POST', body: JSON.stringify(body) }),
  all: () => request('/admin/complaints'),
  stats: () => request('/admin/stats'),
  setStatus: (id, status) => request(`/admin/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const fmt = (iso) => new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
