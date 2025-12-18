document.addEventListener('DOMContentLoaded', () => {

    // --- LOGIN FORM ---
    const loginForm = document.querySelector('form[action="/api/login"]') || document.getElementById('loginForm') || (document.location.pathname.endsWith('index.html') ? document.querySelector('form') : null);

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button');

            if (!email || !password) {
                showToast('Заполните все поля', true);
                return;
            }

            setLoading(submitBtn, true, 'Вход...');
            try {
                // Send 'login' field (backend accepts email OR username in this field)
                const response = await api.post('/auth/login', { login: email, password });
                handleLoginSuccess(response);
            } catch (error) {
                if (isMock(error)) {
                    mockLogin();
                } else {
                    let msg = error.message;
                    if (msg === 'Unauthorized' || msg.includes('hashedPassword')) {
                        msg = 'Неверный логин или пароль';
                    }
                    if (typeof showModal !== 'undefined') {
                        showModal('Ошибка входа', msg, null);
                    } else {
                        showToast(msg, true);
                    }
                }
            } finally {
                setLoading(submitBtn, false, 'Войти');
            }
        });
    }

    // --- REGISTER FORM ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value;
            const login = document.getElementById('reg-login').value;
            const password = document.getElementById('reg-password').value;
            const submitBtn = registerForm.querySelector('button');

            if (!email || !login || !password) {
                if (typeof showModal !== 'undefined') {
                    showModal('⚠️ Ошибка', 'Заполните все поля');
                } else {
                    alert('Заполните все поля');
                }
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (typeof showModal !== 'undefined') {
                    showModal('⚠️ Некорректная почта', 'Пожалуйста, введите корректный email адрес');
                }
                return;
            }

            // Login validation (at least 3 chars)
            if (login.length < 3) {
                if (typeof showModal !== 'undefined') {
                    showModal('⚠️ Некорректный логин', 'Логин должен содержать минимум 3 символа');
                }
                return;
            }

            // Password validation (at least 6 chars)
            if (password.length < 6) {
                if (typeof showModal !== 'undefined') {
                    showModal('⚠️ Слабый пароль', 'Пароль должен содержать минимум 6 символов');
                }
                return;
            }

            setLoading(submitBtn, true, 'Регистрация...');
            try {
                const response = await api.post('/auth/register', { email, login, password });

                // Check if user needs to verify email (no token returned)
                if (!response.token || response.token === '') {
                    // Show verification required message
                    if (typeof showModal !== 'undefined') {
                        showModal(
                            '📧 Подтвердите email',
                            `Мы отправили письмо с подтверждением на <strong>${email}</strong>.<br><br>Пожалуйста, проверьте почту и перейдите по ссылке для активации аккаунта.`,
                            () => {
                                window.location.href = 'index.html';
                            }
                        );
                    } else {
                        showModal(
                            '✅ Регистрация успешна!',
                            `Проверьте почту <strong>${email}</strong> для подтверждения.`,
                            () => window.location.href = 'index.html'
                        );
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 2000);
                    }
                } else {
                    // Old behavior - auto login (shouldn't happen now)
                    handleLoginSuccess(response);
                }
            } catch (error) {
                if (isMock(error)) {
                    alert('Регистрация успешна! (Mock)');
                    window.location.href = 'index.html';
                } else {
                    showToast(error.message, true);
                }
            } finally {
                setLoading(submitBtn, false, 'Зарегистрироваться');
            }
        });
    }


    // --- FORGOT PASSWORD FORM ---
    // NOTE: Forgot password logic is now in forgot-password.html directly
    // This section is kept for backwards compatibility but should not be used
    /*
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;
            const submitBtn = forgotForm.querySelector('button');

            if (!email) return alert('Введите почту');

            setLoading(submitBtn, true, 'Отправка...');
            try {
                await api.post('/forgot-password', { email });
                alert('Код отправлен на почту!');
                window.location.href = 'reset-password.html';
            } catch (error) {
                if (isMock(error)) {
                    alert('Код отправлен на почту! (Mock)');
                    window.location.href = 'reset-password.html';
                } else {
                    alert('Ошибка: ' + error.message);
                }
            } finally {
                setLoading(submitBtn, false, 'Отправить код');
            }
        });
    }
    */

    // --- RESET PASSWORD FORM ---
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('reset-code').value;
            const password = document.getElementById('reset-password').value;
            const submitBtn = resetForm.querySelector('button');

            if (!code || !password) return alert('Заполните все поля');

            setLoading(submitBtn, true, 'Сохранение...');
            try {
                await api.post('/reset-password', { code, password });
                alert('Пароль изменен! Войдите с новым паролем.');
                window.location.href = 'index.html';
            } catch (error) {
                if (isMock(error)) {
                    alert('Пароль изменен! (Mock)');
                    window.location.href = 'index.html';
                } else {
                    alert('Ошибка: ' + error.message);
                }
            } finally {
                setLoading(submitBtn, false, 'Сменить пароль');
            }
        });
    }
});

// Helpers
function setLoading(btn, isLoading, text) {
    if (isLoading) {
        btn.dataset.originalText = btn.innerText; // Save original text
        btn.innerText = text;
        btn.disabled = true;
        btn.classList.add('opacity-70');
    } else {
        btn.innerText = btn.dataset.originalText || text; // Restore
        btn.disabled = false;
        btn.classList.remove('opacity-70');
    }
}

function handleLoginSuccess(response) {
    if (response.token) {
        api.setToken(response.token);
        // Store user info including email
        if (response.user) {
            sessionStorage.setItem('user_info', JSON.stringify({
                login: response.user.login,
                email: response.user.email || `${response.user.login}@neti.ru`,
                role: response.user.role,
                name: response.user.login
            }));
        }
        window.location.href = 'main.html';
    } else {
        throw new Error('Token not received');
    }
}

function isMock(error) {
    return error.message.includes('Failed to fetch') || error.message.includes('JSON');
}

function mockLogin() {
    console.warn('Backend unavailable. Using Mock Mode.');
    api.setToken('mock_token_123');
    localStorage.setItem('user_info', JSON.stringify({ name: 'Artem', email: 'test@neti.ru', role: 'user' }));
    window.location.href = 'main.html';
}
