// Admin Bookings Page Logic
document.addEventListener('DOMContentLoaded', async () => {
    const bookingsContainer = document.getElementById('bookingsContainer');
    const searchInput = document.getElementById('searchInput');

    async function loadBookings() {
        try {
            const bookings = await api.get('/bookings');
            renderBookings(bookings);
        } catch (error) {
            console.error('Error loading bookings:', error);
            if (typeof showToast !== 'undefined') {
                showToast('Ошибка загрузки броней', true);
            }
        }
    }

    function renderBookings(bookings) {
        if (!Array.isArray(bookings) || bookings.length === 0) {
            bookingsContainer.innerHTML = '<p class="text-center text-gray-sec py-10">Нет броней</p>';
            return;
        }

        bookingsContainer.innerHTML = bookings.map(booking => {
            const isActive = booking.status === 'active';
            const statusClass = isActive ? 'bg-green-100 text-primary' : 'bg-gray-100 text-gray-500';
            const statusText = isActive ? 'Активен' : 'Завершен';
            const cardClass = isActive ? '' : 'opacity-70';

            // Format dates
            const startTime = new Date(booking.start_time);
            const endTime = new Date(booking.end_time);
            const dateStr = startTime.toLocaleString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' });

            const startH = String(startTime.getUTCHours()).padStart(2, '0');
            const startM = String(startTime.getUTCMinutes()).padStart(2, '0');
            const endH = String(endTime.getUTCHours()).padStart(2, '0');
            const endM = String(endTime.getUTCMinutes()).padStart(2, '0');
            const timeStr = `${startH}:${startM} - ${endH}:${endM}`;

            return `
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 ${cardClass}">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-bold text-dark">Заказ #${booking.id}</span>
                                <span class="text-[10px] ${statusClass} px-2 py-0.5 rounded-full font-bold">${statusText}</span>
                            </div>
                            <p class="text-xs text-gray-sec mt-1">User ID: <span class="font-bold text-dark">${booking.user_id}</span></p>
                        </div>
                        <div class="flex gap-2">
                            ${isActive ? `
                                <button onclick="completeBooking(${booking.id})" class="p-2 text-primary bg-green-50 rounded-lg hover:bg-green-100 transition" title="Завершить">
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </button>
                            ` : ''}
                            <button onclick="cancelBooking(${booking.id})" class="p-2 text-accent bg-red-50 rounded-lg hover:bg-red-100 transition" title="Удалить">
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center justify-between text-xs text-gray-sec border-t border-gray-100 pt-3">
                        <span>Машинка #${booking.machine_id}</span>
                        <span>${dateStr}, ${timeStr}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.toLowerCase();
            const bookings = await api.get('/bookings');
            const filtered = bookings.filter(b =>
                b.id.toString().includes(query) ||
                b.user_id.toString().includes(query) ||
                b.machine_id.toString().includes(query)
            );
            renderBookings(filtered);
        });
    }

    await loadBookings();

    // Refresh every 10 seconds
    setInterval(loadBookings, 10000);
});

// Complete booking (early finish)
async function completeBooking(id) {
    if (!confirm('Завершить бронь досрочно? Клиент получит уведомление.')) {
        return;
    }

    try {
        await fetch(`${api.baseUrl}/bookings/${id}/complete`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${api.getToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (typeof showToast !== 'undefined') {
            showToast('Бронь завершена');
        } else {
            alert('Бронь завершена!');
        }

        // Reload bookings
        location.reload();
    } catch (error) {
        console.error('Error completing booking:', error);
        if (typeof showToast !== 'undefined') {
            showToast('Ошибка при завершении', true);
        } else {
            alert('Ошибка при завершении брони');
        }
    }
}

// Cancel/delete booking
async function cancelBooking(id) {
    if (!confirm('Удалить эту бронь?')) {
        return;
    }

    try {
        await api.delete(`/bookings/${id}`);

        if (typeof showToast !== 'undefined') {
            showToast('Бронь удалена');
        } else {
            alert('Бронь удалена!');
        }

        // Reload bookings
        location.reload();
    } catch (error) {
        console.error('Error cancelling booking:', error);
        if (typeof showToast !== 'undefined') {
            showToast('Ошибка при удалении', true);
        } else {
            alert('Ошибка при удалении брони');
        }
    }
}
