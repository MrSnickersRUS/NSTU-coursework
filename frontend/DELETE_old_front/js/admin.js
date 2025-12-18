document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth & Role Check
    const token = api.getToken();
    const user = api.getUserInfo();

    if (!token || !user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        window.location.href = 'admin_login.html';
        return;
    }

    // Update clock
    updateClock();
    setInterval(updateClock, 1000);

    // Load Data
    await loadStatistics();
    loadMachines();
    loadAllBookings();
});

function updateClock() {
    const clockEl = document.getElementById('currentTime');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
}

async function loadStatistics() {
    try {
        const [bookings, machines] = await Promise.all([
            api.get('/bookings?all=true'),
            api.get('/machines')
        ]);

        // Calculate stats
        const activeBookings = bookings.filter(b => b.status === 'active').length;
        const pendingBookings = bookings.filter(b => {
            const date = new Date(b.start_time);
            return date > new Date() && b.status !== 'completed';
        }).length;
        const machinesInRepair = machines.filter(m => m.status === 'repair').length;

        // Today's bookings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayBookings = bookings.filter(b => {
            const bookingDate = new Date(b.start_time);
            bookingDate.setHours(0, 0, 0, 0);
            return bookingDate.getTime() === today.getTime();
        }).length;

        // Update UI if elements exist
        const safeSetText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        safeSetText('stat-active', activeBookings);
        safeSetText('stat-pending', pendingBookings);
        safeSetText('stat-repair', machinesInRepair);
        safeSetText('stat-today', todayBookings);
    } catch (e) {
        console.error('Failed to load statistics:', e);
    }
}

async function loadMachines() {
    const container = document.getElementById('machinesList');
    if (!container) return; // Exit if not on page

    container.innerHTML = '<div class="text-center py-4 text-gray-400">Загрузка...</div>';

    try {
        const machines = await api.get('/machines');
        container.innerHTML = '';

        const statusInfo = {
            free: {
                label: 'Свободна',
                color: 'bg-green-100 text-green-700',
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                        <circle cx="12" cy="12" r="5"></circle>
                        <path d="M12 12h.01"></path>
                       </svg>`
            },
            busy: {
                label: 'Занята',
                color: 'bg-yellow-100 text-yellow-700',
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                        <circle cx="12" cy="12" r="5"></circle>
                        <path d="M12 12h.01"></path>
                       </svg>`
            },
            repair: {
                label: 'Ремонт',
                color: 'bg-red-100 text-red-700',
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                        <circle cx="12" cy="12" r="5"></circle>
                        <path d="M12 12h.01"></path>
                       </svg>`
            }
        };

        machines.forEach(m => {
            const el = document.createElement('div');
            el.className = 'flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-primary transition-colors';

            const info = statusInfo[m.status] || statusInfo.free;

            el.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-2xl">${info.icon}</span>
                    <div>
                        <h4 class="font-bold text-dark">${m.name}</h4>
                        <span class="text-xs px-2 py-0.5 rounded-lg font-semibold ${info.color}">${info.label}</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <select onchange="toggleMachineStatus(${m.id}, this.value)" class="text-xs font-semibold border border-gray-300 px-3 py-1.5 rounded-lg focus:outline-none focus:border-primary">
                        <option value="">Изменить...</option>
                        ${m.status !== 'free' ? '<option value="free">Свободна</option>' : ''}
                        ${m.status !== 'busy' ? '<option value="busy">Занята</option>' : ''}
                        ${m.status !== 'repair' ? '<option value="repair">Ремонт</option>' : ''}
                    </select>
                </div>
            `;
            container.appendChild(el);
        });
    } catch (e) {
        container.innerHTML = `<div class="text-red-500 text-center">Ошибка: ${e.message}</div>`;
    }
}

async function loadAllBookings() {
    const container = document.getElementById('bookingsList');
    if (!container) return; // Exit if not on page

    container.innerHTML = '<div class="text-center py-4 text-gray-400">Загрузка...</div>';

    try {
        const bookings = await api.get('/bookings?all=true');
        container.innerHTML = '';

        // Show recent 10
        const recentBookings = bookings.slice(0, 10);

        recentBookings.forEach(b => {
            const el = document.createElement('div');
            el.className = 'bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-primary transition-colors';

            const date = new Date(b.start_time);
            const timeStr = date.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

            const statusInfo = {
                active: { label: 'Активна', color: 'text-green-600' },
                completed: { label: 'Завершена', color: 'text-gray-400' },
                cancelled: { label: 'Отменена', color: 'text-red-500' }
            };

            const status = statusInfo[b.status] || statusInfo.active;

            el.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-bold text-dark">Заказ #${b.id}</div>
                        <div class="text-xs text-gray-500 mt-1">Машинка #${b.machine_id} • ${timeStr}</div>
                        <div class="text-xs text-gray-500">User ID: ${b.user_id}</div>
                    </div>
                    <div class="text-right">
                        <span class="block text-xs font-bold ${status.color}">${status.label}</span>
                        ${b.status === 'active' ? `<button onclick="cancelBookingAdmin(${b.id})" class="text-xs text-accent font-bold mt-2 hover:underline">Отменить</button>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(el);
        });

        if (recentBookings.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-gray-400">Нет броней</div>';
        }
    } catch (e) {
        container.innerHTML = `<div class="text-red-500 text-center">Ошибка: ${e.message}</div>`;
    }
}

// Admin Actions
window.toggleMachineStatus = async (id, status) => {
    if (!status) return;

    showModal('Подтвердите действие', `Изменить статус машинки #${id}?`, async () => {
        try {
            // TODO: Implement API endpoint for machine status update
            await api.put(`/machines/${id}`, { status });
            showToast('Статус обновлен');
            loadMachines();
            loadStatistics();
        } catch (e) {
            showToast('Ошибка: ' + e.message, true);
        }
    });
}

window.cancelBookingAdmin = async (id) => {
    showModal('Подтвердите действие', `Отменить бронь #${id}?`, async () => {
        try {
            await api.delete(`/bookings/${id}`);
            showToast('Бронь отменена');
            loadAllBookings();
            loadStatistics();
        } catch (e) {
            showToast('Ошибка: ' + e.message, true);
        }
    });
}
