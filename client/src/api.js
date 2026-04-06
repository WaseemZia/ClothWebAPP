const baseURL = 'http://localhost:5034/api';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const api = {
  get: async (url) => {
    const res = await fetch(baseURL + url, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Network error");
    return { data: await res.json() };
  },
  post: async (url, data) => {
    const res = await fetch(baseURL + url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw { response: { data: errorText } };
    }
    const text = await res.text();
    return { data: text ? JSON.parse(text) : null };
  },
  put: async (url, data) => {
    const res = await fetch(baseURL + url, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Network error");
    const text = await res.text();
    return { data: text ? JSON.parse(text) : null };
  },
  delete: async (url) => {
    const res = await fetch(baseURL + url, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Network error");
    const text = await res.text();
    return { data: text ? JSON.parse(text) : null };
  }
};

export default api;
