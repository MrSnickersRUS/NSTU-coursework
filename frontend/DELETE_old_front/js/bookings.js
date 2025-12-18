let allBookings = [];
let currentFilter = 'all'; // 'all', 'completed', 'active'

document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.querySelector('main');
    const searchInput = document.querySelector('header input');
    const filterButtons = document.querySelectorAll('header button[class*="px-5"]');

    // Initial Load
    await loadBookings();

    // Search Logic
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderBookings(filterAndSearch(e.target.value));
        });
    }

    // Filter Buttons
    filterButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(b => {
                b.classList.remove('bg-primary', 'text-white', 'shadow-md', 'shadow-primary/20');
                b.classList.add('bg-white', 'border', 'border-gray-200', 'text-gray-sec');
            });
            btn.classList.add('bg-primary', 'text-white', 'shadow-md', 'shadow-primary/20');
            btn.classList.remove('bg-white', 'border', 'border-gray-200', 'text-gray-sec');

            // Set filter
            if (index === 0) currentFilter = 'all';
            else if (index === 1) currentFilter = 'completed';
            else if (index === 2) currentFilter = 'active';

            renderBookings(filterAndSearch(searchInput ? searchInput.value : ''));
        });
    });

    // Function to load bookings from API
    async function loadBookings() {
        try {
            allBookings = await api.get('/bookings');
            updateBookingCount();
            renderBookings(filterAndSearch(''));
        } catch (error) {
            console.error('Failed to load bookings:', error);
            listContainer.innerHTML = '<div class="text-center py-10 text-gray-400">Не удалось загрузить брони</div>';
        }
    }

    function updateBookingCount() {
        const countEl = document.querySelector('header h1');
        if (countEl) {
            countEl.innerText = `Мои брони: ${allBookings.length}`;
        }
    }

    function filterAndSearch(query) {
        let filtered = allBookings;

        // Apply status filter
        if (currentFilter === 'active') {
            filtered = filtered.filter(b => b.status === 'active');
        } else if (currentFilter === 'completed') {
            filtered = filtered.filter(b => b.status === 'completed');
        }

        // Apply search
        if (query) {
            filtered = filtered.filter(b =>
                String(b.id).includes(query) || (b.status && b.status.includes(query))
            );
        }

        return filtered;
    }

    function renderBookings(list) {
        if (!list || list.length === 0) {
            listContainer.innerHTML = '<div class="text-center py-10 text-gray-400">Броней пока нет</div>';
            return;
        }

        listContainer.innerHTML = '';

        list.forEach(booking => {
            const isActive = booking.status === 'active';
            const statusRu = translateStatus(booking.status);

            let date = new Date(booking.start_time);
            if (isNaN(date.getTime())) {
                console.warn('Invalid date for booking', booking.id);
                date = new Date();
            }

            const day = date.getDate();
            const month = date.toLocaleString('ru-RU', { month: 'long' });
            const timeStart = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const timeEnd = new Date(booking.end_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

            const el = document.createElement('div');
            el.className = 'bg-white rounded-2xl p-5 shadow-card border border-gray-100 relative z-0 mb-4';

            // Cancel Action
            const cancelBtnHtml = isActive
                ? `<button onclick="cancelBooking(${booking.id})" class="w-full py-3 rounded-xl bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 active:bg-[#C2185B] transition-colors mt-6">Отменить</button>`
                : `<button onclick="cancelBooking(${booking.id})" class="w-full py-3 rounded-xl border border-accent text-accent text-sm font-bold active:bg-accent active:text-white transition-colors mt-6">Удалить из истории</button>`;

            // Progress Bar
            const progressHtml = renderProgress(booking.status);

            // Machine name
            const machineName = booking.machine_id ? `Машинка #${booking.machine_id}` : 'Машинка';

            el.innerHTML = `
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h3 class="text-lg font-bold text-dark">Заказ #${booking.id}</h3>
                        <p class="text-xs text-gray-sec mt-1">${machineName}</p>
                        <p class="text-xs text-gray-sec mt-0.5">Статус: ${statusRu}</p>
                    </div>
                    <div class="text-right"><span class="block text-xs text-gray-sec mb-0.5">${day} ${month}</span><span class="block text-sm font-bold text-dark">${timeStart}-${timeEnd}</span></div>
                </div>
                ${progressHtml}
                ${cancelBtnHtml}
            `;

            listContainer.appendChild(el);
        });
    }

    function renderProgress(status) {
        // 3 stages: waiting, washing, completed
        const stages = [
            { key: 'waiting', label: 'Ожидает' },
            { key: 'washing', label: 'Стирается' },
            { key: 'completed', label: 'Завершено' }
        ];

        let currentStage = 0;
        if (status === 'active') currentStage = 1; // Washing
        if (status === 'completed') currentStage = 2; // Completed

        let html = '<div class="relative flex items-center justify-between mb-6 px-2">';

        stages.forEach((stage, index) => {
            const isCompleted = index < currentStage;
            const isCurrent = index === currentStage && status === 'active';

            let circleClass, iconHtml, labelClass;

            if (isCurrent && stage.key === 'washing') {
                // Orange clock for washing
                circleClass = 'bg-warn';
                iconHtml = `
                    <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 7.99999V16L21.3333 18.6667M29.3333 16C29.3333 23.3638 23.3638 29.3333 16 29.3333C8.63616 29.3333 2.66663 23.3638 2.66663 16C2.66663 8.63619 8.63616 2.66666 16 2.66666C23.3638 2.66666 29.3333 8.63619 29.3333 16Z" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
                labelClass = 'text-dark font-bold';
            } else if (isCompleted) {
                circleClass = 'bg-primary text-white';
                iconHtml = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
                labelClass = 'text-gray-sec';
            } else {
                circleClass = 'bg-gray-100 text-gray-300';
                iconHtml = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
                labelClass = 'text-gray-light';
            }

            html += `
                <div class="flex flex-col items-center relative z-10">
                    <div class="w-8 h-8 rounded-full ${circleClass} flex items-center justify-center mb-2 shadow-sm">
                        ${iconHtml}
                    </div>
                    <span class="text-[10px] font-semibold ${labelClass}">${stage.label}</span>
                </div>
            `;

            if (index < stages.length - 1) {
                const lineClass = index < currentStage ? 'bg-primary' : 'bg-gray-200';
                html += `<div class="flex-1 h-[2px] ${lineClass} mb-5 mx-1"></div>`;
            }
        });

        html += '</div>';
        return html;
    }

    function translateStatus(status) {
        const map = {
            'active': 'Активная',
            'completed': 'Завершена',
            'cancelled': 'Отменена'
        };
        return map[status] || status;
    }
});

// Global Cancel Handler
window.cancelBooking = async (id) => {
    showModal('Подтвердите действие', 'Вы действительно хотите отменить эту бронь?', async () => {
        await performCancel(id);
    });
}

async function performCancel(id) {
    try {
        await api.delete(`/bookings/${id}`);
        showToast('Бронь отменена/удалена');
        location.reload();
    } catch (e) {
        showToast('Ошибка: ' + e.message, true);
    }
}

function translateStatus(status) {
    const map = {
        'active': 'Активная',
        'completed': 'Завершена',
        'cancelled': 'Отменена'
    };
    return map[status] || status;
}
