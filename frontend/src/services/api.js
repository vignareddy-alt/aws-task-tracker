// One shared Axios instance for the whole app.
// The API base URL comes from VITE_API_URL (see .env.example), so no
// component ever hardcodes a server address.
import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Turns any Axios error into a readable message for the UI.
 * The backend always sends { success: false, message, errors? }.
 */
export function getErrorMessage(error) {
  if (axios.isCancel(error)) return null;

  if (error.response) {
    const { data, status } = error.response;
    if (data?.errors && typeof data.errors === 'object') {
      const details = Object.values(data.errors).join('. ');
      return `${data.message}: ${details}`;
    }
    return data?.message || `Request failed with status ${status}`;
  }

  if (error.code === 'ECONNABORTED') return 'The server took too long to respond.';
  if (error.request) return 'Cannot reach the server. Is the backend running?';
  return error.message || 'Unexpected error';
}

/** Field-level validation errors from a 400 response, e.g. { title: "..." }. */
export function getFieldErrors(error) {
  return error?.response?.status === 400 ? error.response.data?.errors || {} : {};
}

export default api;
