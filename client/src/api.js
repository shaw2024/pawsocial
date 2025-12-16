import axios from "axios";

// Use environment variable or fallback based on hostname
const baseURL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://pawsocial-api.onrender.com' 
    : 'http://localhost:4000');

const api = axios.create({
  baseURL: baseURL,
  timeout: 60000, // Increased to 60 seconds for large image uploads
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging
api.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('API Error: Request timeout');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('API Error: Network error - Cannot connect to backend server');
      console.error('Backend URL:', baseURL);
    } else if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('API Error: No response received from server');
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
