class ApiService {
    constructor() {
        this.baseUrl = '/api';
    }

    getToken() {
        return localStorage.getItem('netiwash_token');
    }

    setToken(token) {
        localStorage.setItem('netiwash_token', token);
    }

    logout() {
        localStorage.removeItem('netiwash_token');
        localStorage.removeItem('netiwash_user_info');
        if (window.history && window.history.pushState) {
            window.history.pushState(null, '', 'index.html');
            window.history.pushState(null, '', 'index.html');
            window.history.back();
        }

        window.location.replace('index.html');
    }

    getUserInfo() {
        return JSON.parse(localStorage.getItem('netiwash_user_info') || '{}');
    }
    setUserInfo(userInfo) {
        localStorage.setItem('netiwash_user_info', JSON.stringify(userInfo));
    }

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

            if (response.status === 401) {
                let errorMessage = 'Unauthorized';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || 'Неверный логин или пароль';
                } catch (e) {
                }

                const path = window.location.pathname;
                const isLoginPage = path.includes('index.html') || path.includes('admin_login.html') || path === '/' || path.endsWith('/');

                if (!isLoginPage) {
                    this.logout();
                }
                throw new Error(errorMessage);
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || data.error || `Error ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    }
    get(endpoint) { return this.request(endpoint, 'GET'); }
    post(endpoint, body) { return this.request(endpoint, 'POST', body); }
    put(endpoint, body) { return this.request(endpoint, 'PUT', body); }
    delete(endpoint) { return this.request(endpoint, 'DELETE'); }
}

const api = new ApiService();
