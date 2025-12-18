document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check
    if (!api.getToken()) {
        window.location.href = 'index.html';
        return;
    }

    // 2. User Greeting
    const userInfo = JSON.parse(sessionStorage.getItem('user_info') || '{}');
    const headerNameElement = document.querySelector('header h1.font-extrabold');
    if (headerNameElement && userInfo.login) {
        headerNameElement.textContent = `${userInfo.login}! 👋`;
    }

    // 3. Load Active Bookings Count
    try {
        const bookings = await api.get('/bookings');
        const activeBookings = bookings.filter(b => b.status === 'active');
        const activeCountEl = document.querySelector('p.text-sm.text-gray-sec span.font-bold.text-primary');
        if (activeCountEl) {
            activeCountEl.innerText = activeBookings.length;
        }
    } catch (error) {
        console.error('Failed to load bookings count:', error);
    }

    // 4. Load Machines
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

    // 5. Initialize Date/Time Pickers (Event Delegation)
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
        const clickAction = machine.status === 'free' ? `onclick="openBookingSheet('${machine.name}', ${machine.id})"` : 'disabled';

        // Colors for CSS
        const statusHex = config.color === 'green' ? '#07AB66' : (config.color === 'red' ? '#DE093B' : '#9C9C9C');

        let btnContent = `<div class="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20">Занять</div>`;
        if (config.btn === 'Disabled') {
            btnContent = `<div class="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold">Недоступна</div>`;
        }

        // Icon (Simplified)
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

        // Bind click manually to avoid inline mess if complex
        if (machine.status === 'free') {
            card.onclick = () => openBookingSheet(machine.name, machine.id);
        }

        container.appendChild(card);
    });
}

// --- BOOKING LOGIC ---
let selectedMachineId = null;
let selectedDate = null;
let selectedTime = null;

window.openBookingSheet = (name, id) => {
    selectedMachineId = id;
    document.getElementById('sheetTitle').innerText = 'Бронь: ' + name;
    document.getElementById('bookingSheet').classList.remove('sheet-closed');
    document.getElementById('bookingSheet').classList.add('sheet-open');
    document.getElementById('overlay').classList.add('overlay-open');

    // Reset selection visually (simple reset)
    // In a real app we might keep today selected
}

window.closeBookingSheet = () => {
    document.getElementById('bookingSheet').classList.remove('sheet-open');
    document.getElementById('bookingSheet').classList.add('sheet-closed');
    document.getElementById('overlay').classList.remove('overlay-open');
}

// Logic for interactive buttons
function initBookingPickers() {
    const sheet = document.getElementById('bookingSheet');

    // Dates
    const datesContainer = sheet.querySelector('.flex.gap-3'); // Selector
    if (datesContainer) {
        datesContainer.innerHTML = ''; // Clear existing
        // Add scroll classes to parent if not present
        datesContainer.className = 'flex gap-3 overflow-x-auto pb-2 scrollbar-hide';

        // Generate dates for the next 30 days
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
            // Format: YYYY-MM-DD for attribute
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const isoDate = `${year}-${month}-${day}`;

            el.dataset.date = isoDate;

            // Fixed width for items to prevent shrinking
            el.className = `flex-shrink-0 w-16 flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer transition-all border border-gray-200 bg-white text-dark hover:border-primary`;
            el.innerHTML = `
                <span class="text-xs font-bold text-gray-light mb-1">${days[d.getDay()]}</span>
                <span class="text-lg font-extrabold">${d.getDate()}</span>
            `;

            el.onclick = () => {
                // Reset all
                datesContainer.querySelectorAll('div').forEach(d => {
                    d.classList.remove('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/30');
                    d.classList.add('bg-white', 'border', 'border-gray-200', 'text-dark', 'hover:border-primary');
                    // Label color
                    const label = d.querySelector('span:nth-child(1)');
                    if (label) {
                        label.classList.remove('opacity-80', 'text-white');
                        label.classList.add('text-gray-light');
                    }
                });

                // Set Active
                el.classList.remove('bg-white', 'border', 'border-gray-200', 'text-dark', 'hover:border-primary');
                el.classList.add('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/30');
                const activeLabel = el.querySelector('span:nth-child(1)');
                if (activeLabel) {
                    activeLabel.classList.remove('text-gray-light');
                    activeLabel.classList.add('opacity-80', 'text-white');
                }
                selectedDate = el.dataset.date;
            };
            datesContainer.appendChild(el);
        });
    }

    // Date Click Event Delegation (Fallback removed as we attach onclick directly)
    // The previous delegated listener is now removed as individual `el.onclick` handlers are used.

    // Times logic remains similar but let's ensure container scrolls if needed or grid is fine
    // Grid 4 columns is fine for fixed slots.


    // Times - Generate 24 hours dynamically with availability check
    const timesContainer = sheet.querySelector('.grid.grid-cols-4');
    let selectedDateForValidation = null;
    let occupiedSlots = {}; // { 'YYYY-MM-DD': ['00:00', '12:00', ...] }

    // Load occupied slots from backend
    async function loadOccupiedSlots() {
        try {
            const allBookings = await api.get('/bookings');
            occupiedSlots = {};
            allBookings.forEach(booking => {
                // Parse as local time
                const date = new Date(booking.start_time);
                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const timeKey = `${String(date.getHours()).padStart(2, '0')}:00`;
                if (!occupiedSlots[dateKey]) occupiedSlots[dateKey] = [];
                occupiedSlots[dateKey].push(timeKey);
            });
            console.log('Occupied slots:', occupiedSlots); // Debug
        } catch (e) {
            console.error('Failed to load bookings for validation', e);
        }
    }

    function renderTimeSlots(dateKey = null) {
        if (!timesContainer) return;

        selectedDateForValidation = dateKey;
        timesContainer.innerHTML = ''; // Clear
        timesContainer.className = 'flex gap-2 overflow-x-auto pb-2 scrollbar-hide';

        const occupied = (dateKey && occupiedSlots[dateKey]) || [];

        for (let hour = 0; hour < 24; hour++) {
            const timeStr = String(hour).padStart(2, '0') + ':00';
            const btn = document.createElement('button');
            const isOccupied = occupied.includes(timeStr);

            if (isOccupied) {
                btn.className = 'flex-shrink-0 w-16 py-2 rounded-xl bg-gray-100 border border-gray-200 text-sm font-semibold text-gray-300 cursor-not-allowed';
                btn.disabled = true;
            } else {
                btn.className = 'flex-shrink-0 w-16 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-dark hover:border-primary hover:text-primary transition';
            }
            btn.innerText = timeStr;

            if (!isOccupied) {
                btn.onclick = () => {
                    // Reset all
                    timesContainer.querySelectorAll('button:not([disabled])').forEach(b => {
                        b.classList.remove('bg-primary', 'text-white', 'shadow-md', 'shadow-primary/20');
                        b.classList.add('bg-white', 'border', 'border-gray-200', 'text-dark', 'hover:border-primary', 'hover:text-primary');
                    });
                    // Set active
                    btn.classList.remove('bg-white', 'border', 'border-gray-200', 'text-dark', 'hover:border-primary', 'hover:text-primary');
                    btn.classList.add('bg-primary', 'text-white', 'shadow-md', 'shadow-primary/20');
                    selectedTime = timeStr;
                };
            }

            timesContainer.appendChild(btn);
        }
    }

    // Initialize
    loadOccupiedSlots().then(() => {
        renderTimeSlots();
    });

    // Update time slots when date changes
    datesContainer.addEventListener('click', (e) => {
        const dateEl = e.target.closest('div[data-date]');
        if (dateEl) {
            const dateKey = dateEl.dataset.date;
            renderTimeSlots(dateKey);
            selectedTime = null; // Reset time selection
        }
    });

    // Confirm Booking
    document.getElementById('confirmBookingBtn').addEventListener('click', async function () {
        const btn = this;
        // Check selection
        const selectedDateEl = datesContainer.querySelector('.bg-primary');
        const selectedTimeEl = timesContainer.querySelector('.bg-primary'); // Corrected from timeContainer

        if (!selectedDateEl || !selectedTimeEl) {
            alert('Пожалуйста, выберите дату и время'); // We will replace alert later
            return;
        }

        // Parse Date: We need YYYY-MM-DD
        // The element stores raw date in dataset usually, but our current render logic just puts text.
        // Let's look at how we render dates. we used `dates.push(d)`.
        // We should attach the real date to the element dataset for reliability.
        // Assuming we fix rendering to add data-date:
        const dateStr = selectedDateEl.dataset.date;
        const timeStr = selectedTimeEl.innerText; // "08:00"

        btn.innerText = 'Бронирование...';
        btn.disabled = true;

        try {
            await api.post('/bookings', {
                machine_id: selectedMachineId, // Corrected from currentMachineId
                date: dateStr,
                time: timeStr
            });

            // Success
            closeBookingSheet();
            // Show custom success message instead of alert?
            alert('Бронь успешно создана!'); // Reverted to alert for now
            // showToast('Бронь успешно создана!'); // We will implement this

            // Refresh logic?
            location.reload(); // Added refresh
        } catch (e) {
            alert('Ошибка: ' + e.message); // Reverted to alert for now
            // showModal('Ошибка', e.message); // Custom modal
        } finally {
            btn.innerText = 'Подтвердить бронь';
            btn.disabled = false;
        }
    });
}

// submitBooking function called from main.html button onclick
window.submitBooking = async () => {
    const sheet = document.getElementById('bookingSheet');
    const datesContainer = sheet.querySelector('.flex.gap-3');
    const timesContainer = sheet.querySelector('.flex.gap-2.overflow-x-auto') || sheet.querySelector('.grid.grid-cols-4');

    const selectedDateEl = datesContainer ? datesContainer.querySelector('.bg-primary') : null;
    const selectedTimeEl = timesContainer ? timesContainer.querySelector('.bg-primary') : null;

    if (!selectedDateEl || !selectedTimeEl) {
        showModal('Внимание', 'Пожалуйста, выберите дату и время');
        return;
    }

    const dateStr = selectedDateEl.dataset.date; // YYYY-MM-DD
    const timeStr = selectedTimeEl.innerText.trim(); // HH:00

    const btn = document.querySelector('#bookingSheet button[onclick="submitBooking()"]');
    if (btn) {
        btn.innerText = 'Отправка...';
        btn.disabled = true;
    }

    try {
        // Validate data
        if (!selectedMachineId) {
            throw new Error('Машина не выбрана. Пожалуйста, закройте окно и выберите машину снова.');
        }

        console.log('Booking data:', {
            machine_id: selectedMachineId,
            date: dateStr,
            time: timeStr
        });

        await api.post('/bookings', {
            machine_id: selectedMachineId,
            date: dateStr,
            time: timeStr
        });

        sheet.classList.add('hidden');
        showModal('Успех', 'Бронь успешно создана!', () => {
            location.reload();
        });
    } catch (e) {
        console.error('Booking error:', e);
        showModal('Ошибка', e.message || 'Не удалось создать бронь');
    } finally {
        if (btn) {
            btn.innerText = 'Подтвердить бронь';
            btn.disabled = false;
        }
    }
};

// --- NOTIFICATION LOGIC ---
window.openNotificationSheet = () => {
    const sheet = document.getElementById('notificationSheet');
    sheet.classList.remove('sheet-closed');
    sheet.classList.add('sheet-open');
    document.getElementById('overlay').classList.add('overlay-open');

    // Override overlay click to close correct sheet? 
    // Currently overlay closes booking sheet. We need smart handler.
    const overlay = document.getElementById('overlay');
    overlay.onclick = () => {
        closeBookingSheet();
        closeNotificationSheet();
    };
}

window.closeNotificationSheet = () => {
    const sheet = document.getElementById('notificationSheet');
    sheet.classList.remove('sheet-open');
    sheet.classList.add('sheet-closed');
    document.getElementById('overlay').classList.remove('overlay-open');
}
