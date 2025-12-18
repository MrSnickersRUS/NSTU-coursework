// --- SHEET LOGIC (Global) ---
window.openBookingSheet = (name, id) => {
    window.selectedMachineId = id;
    const titleEl = document.getElementById('sheetTitle');
    if (titleEl) titleEl.innerText = 'Бронь: ' + name;

    const sheet = document.getElementById('bookingSheet');
    const overlay = document.getElementById('overlay');

    if (sheet) {
        sheet.classList.remove('sheet-closed');
        sheet.classList.add('sheet-open');
    }
    if (overlay) {
        overlay.classList.add('overlay-open');
    }
}

window.closeBookingSheet = () => {
    const sheet = document.getElementById('bookingSheet');
    const overlay = document.getElementById('overlay');
    if (sheet) {
        sheet.classList.remove('sheet-open');
        sheet.classList.add('sheet-closed');
    }
    if (overlay) {
        overlay.classList.remove('overlay-open');
    }
}

window.openNotificationSheet = () => {
    const sheet = document.getElementById('notificationSheet');
    const overlay = document.getElementById('overlay');
    if (sheet) {
        sheet.classList.remove('sheet-closed');
        sheet.classList.add('sheet-open');
    }
    if (overlay) {
        overlay.classList.add('overlay-open');
    }
}

window.closeNotificationSheet = () => {
    const sheet = document.getElementById('notificationSheet');
    const overlay = document.getElementById('overlay');
    if (sheet) {
        sheet.classList.remove('sheet-open');
        sheet.classList.add('sheet-closed');
    }
    if (overlay) {
        overlay.classList.remove('overlay-open');
    }
}

// --- CONFIRM LOGOUT (Global) ---
window.confirmLogout = () => {
    if (typeof showModal === 'function') {
        showModal(
            'Выход',
            'Вы уверены, что хотите выйти из аккаунта?',
            () => {
                api.logout();
            }
        );
    } else {
        if (confirm('Вы уверены, что хотите выйти?')) {
            api.logout();
        }
    }
};


// --- MAIN LOGIC ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check
    if (!api.getToken()) {
        window.location.href = 'index.html';
        return;
    }

    // 2. User Greeting & Profile Info
    const userInfo = JSON.parse(sessionStorage.getItem('user_info') || '{}');
    const login = userInfo.login || 'Пользователь';
    const email = userInfo.email || `${login}@neti.ru`;

    // A. Main Page Header Greeting
    const greetingH1 = document.querySelector('header h1');
    if (greetingH1 && window.location.pathname.includes('main.html')) {
        greetingH1.textContent = login + ' 👋';
    }

    // B. Profile Page Elements  
    const profileNameEl = document.querySelector('main h2.text-2xl');
    const profileEmailEl = document.querySelector('main p.text-gray-sec.font-medium');

    if (profileNameEl) profileNameEl.textContent = login;
    if (profileEmailEl) profileEmailEl.textContent = email;

    // Setup Logout Button - remove any inline handler and set proper one
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.removeAttribute('onclick');
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.confirmLogout();
        });
    }

    // 3. Load Active Bookings Count (only on main page)
    if (window.location.pathname.includes('main.html')) {
        try {
            const bookings = await api.get('/bookings');
            const activeBookings = bookings.filter(b => b.status === 'active');
            const activeCountEl = document.querySelector('p.text-sm span.font-bold.text-primary');
            if (activeCountEl) {
                activeCountEl.innerText = activeBookings.length;
            }
        } catch (error) {
            console.error('Failed to load bookings count:', error);
        }
    }

    // 4. Load Machines (Only on Main Page)
    if (window.location.pathname.includes('main.html')) {
        const machinesContainer = document.querySelector('.grid.grid-cols-2');
        if (machinesContainer) {
            machinesContainer.innerHTML = '<div class="col-span-2 text-center py-4 text-gray-400">Загрузка...</div>';
            try {
                const machines = await api.get('/machines');
                renderMachines(machines, machinesContainer);
            } catch (error) {
                machinesContainer.innerHTML = '<div class="col-span-2 text-center py-4 text-red-500">Ошибка загрузки.</div>';
            }
        }
    }

    // 5. Initialize Date/Time Pickers
    initBookingPickers();
});


// --- MACHINES RENDERER ---
function renderMachines(machines, container) {
    container.innerHTML = '';
    machines.forEach(machine => {
        const card = document.createElement('button');

        let statusConfig = {
            free: { color: 'green', text: 'Свободна', bg: '#E8F8F3', iconColor: 'text-primary', btn: 'BgPrimary' },
            busy: { color: 'red', text: 'Занята', bg: 'bg-red-50', iconColor: 'text-accent', btn: 'Disabled' },
            repair: { color: 'gray', text: 'Ремонт', bg: 'bg-gray-100', iconColor: 'text-gray-400', btn: 'Disabled' }
        };

        const config = statusConfig[machine.status] || statusConfig.free;
        const opacity = machine.status !== 'free' ? (machine.status === 'busy' ? 'opacity-70' : 'opacity-60 grayscale') : '';
        const statusHex = config.color === 'green' ? '#07AB66' : (config.color === 'red' ? '#DE093B' : '#9C9C9C');

        let btnContent = `<div class="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20">Занять</div>`;
        if (config.btn === 'Disabled') {
            btnContent = `<div class="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold">Недоступна</div>`;
        }

        let iconSvg = `<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="12" r="5"/><path d="M12 12h.01"/>`;
        if (machine.status === 'repair') iconSvg = `<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 8l8 8M16 8l-8 8"/>`;

        card.className = `bg-white p-4 rounded-[20px] shadow-card border border-gray-100 flex flex-col items-center text-center active:scale-[0.97] transition-transform duration-100 ${opacity}`;
        card.innerHTML = `
            <div class="h-14 w-14 ${config.bg} rounded-full flex items-center justify-center mb-3 ${config.iconColor}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>
            </div>
            <h3 class="font-bold text-dark text-base">${machine.name}</h3>
            <div class="flex items-center gap-1.5 mt-1.5 mb-4">
                <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${statusHex}"></span>
                <span class="text-xs font-bold" style="color: ${statusHex}">${config.text}</span>
            </div>
            ${btnContent}
        `;

        if (machine.status === 'free') {
            card.onclick = () => window.openBookingSheet(machine.name, machine.id);
        }

        container.appendChild(card);
    });
}


function initBookingPickers() {
    const sheet = document.getElementById('bookingSheet');
    if (!sheet) return;

    // --- DATES LOGIC (Scroll + Border Style) ---
    const datesContainer = sheet.querySelector('.flex.gap-3');
    if (datesContainer) {
        datesContainer.innerHTML = '';
        datesContainer.className = 'flex gap-3 overflow-x-auto no-scrollbar pb-1';

        const dates = [];
        const today = new Date();
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push(d);
        }

        dates.forEach((d, index) => {
            const el = document.createElement('div');
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const isoDate = `${year}-${month}-${day}`;
            const dayOfWeek = days[d.getDay()];

            el.dataset.date = isoDate;
            el.className = 'date-item flex-shrink-0 w-14 flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer transition-all border border-gray-200 bg-white text-dark hover:border-primary';

            if (index === 0) {
                el.classList.remove('border-gray-200', 'bg-white');
                el.classList.add('border-primary', 'bg-green-50');
            }

            el.innerHTML = `
                <span class="text-xs font-bold text-gray-light mb-0.5">${dayOfWeek}</span>
                <span class="text-lg font-extrabold">${d.getDate()}</span>
            `;

            el.onclick = () => {
                datesContainer.querySelectorAll('.date-item').forEach(child => {
                    child.classList.remove('border-primary', 'bg-green-50');
                    child.classList.add('border-gray-200', 'bg-white');
                });
                el.classList.remove('border-gray-200', 'bg-white');
                el.classList.add('border-primary', 'bg-green-50');

                renderTimeSlots(isoDate);
            };
            datesContainer.appendChild(el);
        });
    }

    // --- TIMES LOGIC ---
    const timesContainer = document.getElementById('timesContainer');
    let occupiedSlots = {};

    async function loadOccupiedSlots() {
        try {
            const allBookings = await api.get('/bookings');
            occupiedSlots = {};
            allBookings.forEach(booking => {
                const date = new Date(booking.start_time);
                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const timeKey = `${String(date.getHours()).padStart(2, '0')}:00`;
                if (!occupiedSlots[dateKey]) occupiedSlots[dateKey] = [];
                occupiedSlots[dateKey].push(timeKey);
            });
        } catch (e) {
            console.error('Failed to load bookings for validation', e);
        }
    }

    window.renderTimeSlots = function (dateKey = null) {
        if (!timesContainer) return;

        timesContainer.innerHTML = '';
        timesContainer.className = 'flex gap-3 overflow-x-auto no-scrollbar pb-1';

        if (!dateKey) {
            const selectedEl = datesContainer ? datesContainer.querySelector('.border-primary') : null;
            if (selectedEl) dateKey = selectedEl.dataset.date;
        }

        const occupied = (dateKey && occupiedSlots[dateKey]) || [];

        for (let hour = 0; hour < 24; hour++) {
            const timeStr = String(hour).padStart(2, '0') + ':00';
            const btn = document.createElement('button');
            const isOccupied = occupied.includes(timeStr);

            btn.className = 'time-item flex-shrink-0 w-16 py-2 rounded-xl text-sm font-semibold transition-all';

            if (isOccupied) {
                btn.classList.add('bg-gray-100', 'border', 'border-gray-200', 'text-gray-300', 'cursor-not-allowed');
                btn.disabled = true;
            } else {
                btn.classList.add('bg-white', 'border', 'border-gray-200', 'text-dark', 'hover:border-primary');
            }

            btn.innerText = timeStr;

            if (!isOccupied) {
                btn.onclick = () => {
                    timesContainer.querySelectorAll('.time-item:not([disabled])').forEach(b => {
                        b.classList.remove('border-primary', 'bg-green-50');
                        b.classList.add('border-gray-200', 'bg-white');
                    });
                    btn.classList.remove('border-gray-200', 'bg-white');
                    btn.classList.add('border-primary', 'bg-green-50');
                };
            }
            timesContainer.appendChild(btn);
        }
    };

    loadOccupiedSlots().then(() => {
        const firstDateEl = datesContainer ? datesContainer.querySelector('.date-item') : null;
        if (firstDateEl) {
            renderTimeSlots(firstDateEl.dataset.date);
        } else {
            renderTimeSlots();
        }
    });
}


// --- SUBMIT BOOKING (Global) ---
window.submitBooking = async () => {
    const sheet = document.getElementById('bookingSheet');
    if (!sheet) return;

    const datesContainer = sheet.querySelector('.flex.gap-3');
    const timesContainer = document.getElementById('timesContainer');

    const selectedDateEl = datesContainer ? datesContainer.querySelector('.border-primary') : null;
    const selectedTimeEl = timesContainer ? timesContainer.querySelector('.border-primary') : null;

    if (!selectedDateEl || !selectedTimeEl) {
        if (typeof showModal === 'function') {
            showModal('Внимание', 'Пожалуйста, выберите дату и время');
        } else {
            alert('Пожалуйста, выберите дату и время');
        }
        return;
    }

    const dateStr = selectedDateEl.dataset.date;
    const timeStr = selectedTimeEl.innerText.trim();
    const machineId = window.selectedMachineId;

    if (!machineId) {
        alert('Ошибка: Машина не выбрана');
        return;
    }

    const btn = sheet.querySelector('button[onclick="submitBooking()"]');
    if (btn) {
        btn.innerText = 'Бронирование...';
        btn.disabled = true;
    }

    try {
        await api.post('/bookings', {
            machine_id: machineId,
            date: dateStr,
            time: timeStr
        });

        closeBookingSheet();

        if (typeof showModal === 'function') {
            showModal('Успех', 'Бронь успешно создана!', () => location.reload());
        } else {
            alert('Бронь успешно создана!');
            location.reload();
        }

    } catch (e) {
        console.error(e);
        if (typeof showModal === 'function') {
            showModal('Ошибка', e.message || 'Не удалось создать бронь');
        } else {
            alert('Ошибка: ' + (e.message || 'Не удалось создать бронь'));
        }
    } finally {
        if (btn) {
            btn.innerText = 'Подтвердить бронь';
            btn.disabled = false;
        }
    }
};
