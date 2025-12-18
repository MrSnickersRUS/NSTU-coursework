document.addEventListener('DOMContentLoaded', async () => {
    // Auth check
    if (!api.getToken()) {
        window.location.href = 'index.html';
        return;
    }

    // Load user info
    const userInfo = api.getUserInfo();

    // Update user name
    const nameEl = document.querySelector('h2.text-2xl');
    const usernameEl = document.querySelector('p.text-gray-sec');
    if (nameEl && userInfo.login) {
        nameEl.innerText = userInfo.login;
    }
    if (usernameEl && userInfo.login) {
        usernameEl.innerText = `@${userInfo.login}`;
    }

    // Load bookings stats
    try {
        const bookings = await api.get('/bookings');
        const totalCount = bookings.length;
        const completedCount = bookings.filter(b => b.status === 'completed').length;

        // Update stats
        const totalEl = document.querySelector('.text-3xl.font-extrabold.text-dark');
        const completedEl = document.querySelectorAll('.text-3xl.font-extrabold.text-dark')[1];

        if (totalEl) totalEl.innerText = totalCount;
        if (completedEl) completedEl.innerText = completedCount;
    } catch (error) {
        console.error('Failed to load booking stats:', error);
    }

    // Logout button - find by text or ID
    const logoutBtn = document.getElementById('logoutBtn') ||
        Array.from(document.querySelectorAll('button')).find(btn =>
            btn.textContent.trim().includes('Выйти')
        );

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Logout clicked');
            api.logout();
        });
    } else {
        console.warn('Logout button not found');
    }
});
