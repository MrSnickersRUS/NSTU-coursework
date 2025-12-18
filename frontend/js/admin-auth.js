document.addEventListener('DOMContentLoaded', () => {
    // If already logged in AND is admin, redirect to admin dashboard
    const token = api.getToken();
    const user = api.getUserInfo();

    if (token && user && (user.role === 'admin' || user.role === 'superadmin')) {
        window.location.href = 'admin.html';
        return;
    }

    const form = document.getElementById('adminLoginForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = 'Вход...';
            btn.disabled = true;

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                // Use standard login
                const response = await api.post('/auth/login', {
                    login: data.login,
                    password: data.password
                });

                // Check role
                if (response.user.role !== 'admin' && response.user.role !== 'superadmin') {
                    throw new Error('У вас нет прав администратора');
                }

                api.setToken(response.token);
                sessionStorage.setItem('user_info', JSON.stringify(response.user));

                window.location.href = 'admin.html';
            } catch (err) {
                alert(err.message || 'Ошибка входа');
                console.error(err);
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }
});
