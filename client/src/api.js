import axios from "axios";

// Use environment variable or fallback to localhost
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:4000";

// Check if we're in GitHub Pages (no backend available)
const isGitHubPages = window.location.hostname.includes('github.io');

const api = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Mock backend for GitHub Pages
if (isGitHubPages) {
  const mockBackend = {
    dogs: JSON.parse(localStorage.getItem('pawsocial_dogs') || '[]'),
    
    saveDogs() {
      localStorage.setItem('pawsocial_dogs', JSON.stringify(this.dogs));
    },
    
    createDog(data) {
      const newDog = {
        _id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString()
      };
      this.dogs.push(newDog);
      this.saveDogs();
      return newDog;
    },
    
    getAllDogs() {
      return this.dogs;
    }
  };
  
  // Intercept API calls and use localStorage instead
  api.interceptors.request.use(
    async config => {
      console.log(`Mock API: ${config.method?.toUpperCase()} ${config.url}`);
      
      // Handle POST /dogs/create
      if (config.method === 'post' && config.url === '/dogs/create') {
        const newDog = mockBackend.createDog(config.data);
        return Promise.reject({
          isMock: true,
          response: { data: newDog, status: 201 }
        });
      }
      
      // Handle GET /dogs (all dogs)
      if (config.method === 'get' && (config.url === '/dogs' || config.url === '/dogs/all')) {
        const dogs = mockBackend.getAllDogs();
        return Promise.reject({
          isMock: true,
          response: { data: dogs, status: 200 }
        });
      }
      
      // Handle GET /dogs/mine
      if (config.method === 'get' && config.url === '/dogs/mine') {
        const dogs = mockBackend.getAllDogs();
        return Promise.reject({
          isMock: true,
          response: { data: dogs, status: 200 }
        });
      }
      
      return config;
    },
    error => Promise.reject(error)
  );
  
  // Handle mock responses
  api.interceptors.response.use(
    response => response,
    error => {
      if (error.isMock) {
        return Promise.resolve(error.response);
      }
      return Promise.reject(error);
    }
  );
}

// Add request interceptor for debugging (only for real backend)
if (!isGitHubPages) {
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

  // Add response interceptor for better error handling (only for real backend)
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
        console.error('Make sure the backend is running on http://localhost:4000');
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
}

export default api;
