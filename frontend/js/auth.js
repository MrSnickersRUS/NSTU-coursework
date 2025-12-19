document.addEventListener('DOMContentLoaded', () => {
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

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (typeof showModal !== 'undefined') {
                    showModal('⚠️ Некорректная почта', 'Пожалуйста, введите корректный email адрес');
                }
                return;
            }

            if (login.length < 3) {
                if (typeof showModal !== 'undefined') {
                    showModal('⚠️ Некорректный логин', 'Логин должен содержать минимум 3 символа');
                }
                return;
            }

            if (password.length < 6) {
                if (typeof showModal !== 'undefined') {
                    showModal('⚠️ Слабый пароль', 'Пароль должен содержать минимум 6 символов');
                }
                return;
            }

            setLoading(submitBtn, true, 'Регистрация...');
            try {
                const response = await api.post('/auth/register', { email, login, password });

                if (!response.token || response.token === '') {
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
                    handleLoginSuccess(response);
                }
            } catch (error) {
                showToast(error.message, true);
            } finally {
                setLoading(submitBtn, false, 'Зарегистрироваться');
            }
        });
    }

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
                alert('Ошибка: ' + error.message);
            } finally {
                setLoading(submitBtn, false, 'Сменить пароль');
            }
        });
    }
});

function setLoading(btn, isLoading, text) {
    if (isLoading) {
        btn.dataset.originalText = btn.innerText;
        btn.innerText = text;
        btn.disabled = true;
        btn.classList.add('opacity-70');
    } else {
        btn.innerText = btn.dataset.originalText || text;
        btn.disabled = false;
        btn.classList.remove('opacity-70');
    }
}

function handleLoginSuccess(response) {
    if (response.token) {
        api.setToken(response.token);
        if (response.user) {
            api.setUserInfo({
                login: response.user.name,
                email: response.user.email || `${response.user.name}@neti.ru`,
                role: response.user.role,
                name: response.user.name
            });
        }
        window.location.href = 'main.html';
    } else {
        throw new Error('Token not received');
    }
}
