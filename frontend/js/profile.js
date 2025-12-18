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

    // Notification toggle setup
    const toggle = document.getElementById('toggle');
    if (toggle) {
        // Load saved state
        const notificationsEnabled = localStorage.getItem('netiwash_notifications_enabled');
        toggle.checked = notificationsEnabled === null || notificationsEnabled === 'true';

        // Update toggle label color based on state
        updateToggleStyle(toggle);

        // Handle toggle change
        toggle.addEventListener('change', () => {
            localStorage.setItem('netiwash_notifications_enabled', toggle.checked ? 'true' : 'false');
            updateToggleStyle(toggle);
        });
    }

    // Logout is handled by dashboard.js via window.confirmLogout
});

// Update toggle visual style
function updateToggleStyle(toggle) {
    const label = toggle.nextElementSibling;
    if (label) {
        if (toggle.checked) {
            label.classList.remove('bg-gray-200');
            label.classList.add('bg-primary');
        } else {
            label.classList.remove('bg-primary');
            label.classList.add('bg-gray-200');
        }
    }
}

