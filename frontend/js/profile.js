document.addEventListener('DOMContentLoaded', async () => {
    // Auth check
    if (!api.getToken()) {
        window.location.href = 'index.html';
        return;
    }

    // Load user info
    const userInfo = api.getUserInfo();
    const login = userInfo.login || 'Пользователь';
    const email = userInfo.email || `${login}@neti.ru`;

    // Update user name (h2)
    const nameEl = document.querySelector('main h2.text-2xl');
    if (nameEl) {
        nameEl.textContent = login;
    }

    // Update username/email (p below h2)
    const emailEl = document.querySelector('main p.text-gray-sec.font-medium');
    if (emailEl) {
        emailEl.textContent = email;
    }

    // Load bookings stats
    try {
        const bookings = await api.get('/bookings');
        const totalCount = bookings.length;
        const completedCount = bookings.filter(b => b.status === 'completed').length;

        // Update stats - find both stat boxes
        const statElements = document.querySelectorAll('.text-3xl.font-extrabold.text-dark');
        if (statElements[0]) statElements[0].innerText = totalCount;
        if (statElements[1]) statElements[1].innerText = completedCount;
    } catch (error) {
        console.error('Failed to load booking stats:', error);
    }

    // Logout is handled by dashboard.js via window.confirmLogout
});
