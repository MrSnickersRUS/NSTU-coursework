/**
 * Core API Service for NETI WASH
 */
class ApiService {
    constructor() {
        // Base URL for backend API. 
        // Since frontend server proxies /api to backend, we just use /api
        this.baseUrl = '/api';
    }

    /**
     * Get Auth Token from local storage
     */
    getToken() {
        return sessionStorage.getItem('token');
    }

    /**
     * Save Auth Token
     */
    setToken(token) {
        sessionStorage.setItem('token', token);
    }

    /**
     * Clear Auth Token (Logout)
     */
    logout() {
        sessionStorage.clear();
        localStorage.clear();

        // Clear history to prevent back button
        if (window.history && window.history.pushState) {
            window.history.pushState(null, '', 'index.html');
            window.history.pushState(null, '', 'index.html');
            window.history.back();
        }

        // Redirect with no-cache headers simulation
        window.location.replace('index.html');
    }

    /**
     * Get User Info
     */
    getUserInfo() {
        return JSON.parse(sessionStorage.getItem('user_info') || '{}');
    }

    /**
     * Generic fetch wrapper
     */
    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, config);

            // Handle 401 Unauthorized globally
            if (response.status === 401) {
                // Only redirect if not already on login page (user or admin)
                if (!window.location.href.includes('index.html') && !window.location.href.includes('admin_login.html')) {
                    this.logout();
                }
                throw new Error('Unauthorized');
            }

            const data = await response.json().catch(() => ({})); // Handle empty responses

            if (!response.ok) {
                throw new Error(data.message || data.error || `Error ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    }

    // Convenience methods
    get(endpoint) { return this.request(endpoint, 'GET'); }
    post(endpoint, body) { return this.request(endpoint, 'POST', body); }
    put(endpoint, body) { return this.request(endpoint, 'PUT', body); }
    delete(endpoint) { return this.request(endpoint, 'DELETE'); }
}

const api = new ApiService();
