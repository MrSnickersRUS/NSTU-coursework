// Notifications module
// Handles notification display, read status, and toggle from profile

const NotificationManager = {
    // Notification types
    TYPES: {
        SUCCESS: 'success',      // Стирка завершена
        WARNING: 'warning',      // Технические работы
        INFO: 'info',            // Общая информация
        BOOKING: 'booking'       // Напоминание о брони
    },

    // Get notifications from localStorage or return default demo data
    getNotifications() {
        const stored = localStorage.getItem('netiwash_notifications');
        if (stored) {
            return JSON.parse(stored);
        }
        // Default demo notifications
        return [
            {
                id: 1,
                type: 'success',
                title: 'Стирка завершена!',
                message: 'Машинка #2 закончила работу. Заберите вещи.',
                time: Date.now() - 10 * 60 * 1000, // 10 minutes ago
                read: false
            },
            {
                id: 2,
                type: 'warning',
                title: 'Технические работы',
                message: 'Завтра с 10:00 до 12:00 прачечная закрыта.',
                time: Date.now() - 24 * 60 * 60 * 1000, // Yesterday
                read: false
            }
        ];
    },

    // Save notifications to localStorage
    saveNotifications(notifications) {
        localStorage.setItem('netiwash_notifications', JSON.stringify(notifications));
    },

    // Check if notifications are enabled
    isEnabled() {
        const setting = localStorage.getItem('netiwash_notifications_enabled');
        return setting === null || setting === 'true'; // Enabled by default
    },

    // Toggle notifications on/off
    setEnabled(enabled) {
        localStorage.setItem('netiwash_notifications_enabled', enabled ? 'true' : 'false');
    },

    // Get unread count
    getUnreadCount() {
        const notifications = this.getNotifications();
        return notifications.filter(n => !n.read).length;
    },

    // Mark notification as read
    markAsRead(id) {
        const notifications = this.getNotifications();
        const notification = notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.saveNotifications(notifications);
            this.updateBadge();
            this.renderNotifications();
        }
    },

    // Mark all as read
    markAllAsRead() {
        const notifications = this.getNotifications();
        notifications.forEach(n => n.read = true);
        this.saveNotifications(notifications);
        this.updateBadge();
        this.renderNotifications();
    },

    // Add new notification
    addNotification(type, title, message) {
        if (!this.isEnabled()) return;

        const notifications = this.getNotifications();
        const newNotification = {
            id: Date.now(),
            type: type,
            title: title,
            message: message,
            time: Date.now(),
            read: false
        };
        notifications.unshift(newNotification);
        // Keep only last 20 notifications
        if (notifications.length > 20) {
            notifications.pop();
        }
        this.saveNotifications(notifications);
        this.updateBadge();
        this.renderNotifications();
    },

    // Update the notification badge (red dot)
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            const unreadCount = this.getUnreadCount();
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    },

    // Format time ago
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Только что';
        if (minutes < 60) return `${minutes} мин. назад`;
        if (hours < 24) return `${hours} ч. назад`;
        if (days === 1) return 'Вчера';
        return `${days} дн. назад`;
    },

    // Get icon and styling for notification type
    getTypeConfig(type) {
        const configs = {
            success: {
                bg: 'bg-green-50',
                border: 'border-green-100',
                iconBg: 'text-primary',
                icon: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>`
            },
            warning: {
                bg: 'bg-yellow-50',
                border: 'border-yellow-100',
                iconBg: 'text-yellow-500',
                icon: `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>`
            },
            info: {
                bg: 'bg-blue-50',
                border: 'border-blue-100',
                iconBg: 'text-blue-500',
                icon: `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>`
            },
            booking: {
                bg: 'bg-purple-50',
                border: 'border-purple-100',
                iconBg: 'text-purple-500',
                icon: `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>`
            }
        };
        return configs[type] || configs.info;
    },

    // Render notifications in the container
    renderNotifications() {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;

        const notifications = this.getNotifications();

        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <svg class="mx-auto mb-3 w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <p class="text-sm">Нет уведомлений</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(n => {
            const config = this.getTypeConfig(n.type);
            const readClass = n.read ? 'opacity-60' : '';

            return `
                <div class="flex items-start gap-4 p-4 ${config.bg} rounded-2xl border ${config.border} ${readClass} cursor-pointer transition-opacity hover:opacity-80"
                     onclick="NotificationManager.markAsRead(${n.id})">
                    <div class="h-10 w-10 bg-white rounded-full flex items-center justify-center ${config.iconBg} shadow-sm flex-shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            ${config.icon}
                        </svg>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <h4 class="font-bold text-dark text-sm">${n.title}</h4>
                            ${!n.read ? '<div class="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1"></div>' : ''}
                        </div>
                        <p class="text-xs text-gray-sec mt-1">${n.message}</p>
                        <span class="text-[10px] text-gray-400 mt-2 block">${this.formatTimeAgo(n.time)}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Initialize
    init() {
        this.updateBadge();
        this.renderNotifications();
    }
};

// Global function for "Mark all as read" button
function markAllNotificationsRead() {
    NotificationManager.markAllAsRead();
}

// ============================================
// BookingWatcher - monitors bookings and sends notifications when washing completes
// ============================================
const BookingWatcher = {
    checkInterval: null,
    notifiedBookings: new Set(),

    init() {
        // Load previously notified bookings
        const stored = localStorage.getItem('netiwash_notified_bookings');
        if (stored) {
            this.notifiedBookings = new Set(JSON.parse(stored));
        }

        // Start checking every 30 seconds
        this.startWatching();

        // Also check immediately
        setTimeout(() => this.checkBookings(), 3000);
    },

    startWatching() {
        if (this.checkInterval) return;

        this.checkInterval = setInterval(() => {
            this.checkBookings();
        }, 30000); // Check every 30 seconds

        console.log('[BookingWatcher] Started watching bookings');
    },

    stopWatching() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    },

    async checkBookings() {
        // Only check if notifications are enabled
        if (!NotificationManager.isEnabled()) return;

        // Only check if logged in
        if (typeof api === 'undefined' || !api.getToken()) return;

        try {
            const bookings = await api.get('/bookings');
            if (!Array.isArray(bookings)) return;

            const now = new Date();



            bookings.forEach(booking => {
                // Skip if already notified
                if (this.notifiedBookings.has(booking.id)) return;

                // Skip non-active bookings
                if (booking.status !== 'active') return;

                // Parse booking end time
                const [endHour, endMin] = booking.time_slot.split('-')[1].split(':').map(Number);
                const bookingDate = new Date(booking.booking_date);
                const endTime = new Date(bookingDate);
                endTime.setHours(endHour, endMin, 0, 0);

                // Check if washing is complete (end time has passed)
                if (now >= endTime) {
                    this.sendWashingCompleteNotification(booking);
                    this.notifiedBookings.add(booking.id);
                    this.saveNotifiedBookings();
                }
            });
        } catch (error) {
            console.error('[BookingWatcher] Error checking bookings:', error);
        }
    },

    async sendWashingCompleteNotification(booking) {
        const machineName = booking.machine_name || `Машинка #${booking.machine_id}`;
        const title = 'Стирка завершена! 🧺';
        const message = `${machineName} закончила работу. Заберите вещи!`;

        // Add to in-app notifications
        NotificationManager.addNotification('success', title, message);

        // Send push notification if available
        if (typeof PWAManager !== 'undefined' && 'Notification' in window) {
            try {
                await PWAManager.sendLocalNotification(title, message, '/bookings.html');
            } catch (e) {
                console.log('[BookingWatcher] Could not send push notification:', e);
            }
        }

        console.log('[BookingWatcher] Sent notification for booking:', booking.id);
    },

    saveNotifiedBookings() {
        // Keep only last 100 to avoid bloating localStorage
        const arr = Array.from(this.notifiedBookings).slice(-100);
        localStorage.setItem('netiwash_notified_bookings', JSON.stringify(arr));
    },

    // Clean up old entries (run occasionally)
    cleanupOldEntries() {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        // Simple cleanup - just keep it reasonably sized
        if (this.notifiedBookings.size > 100) {
            const arr = Array.from(this.notifiedBookings).slice(-50);
            this.notifiedBookings = new Set(arr);
            this.saveNotifiedBookings();
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    NotificationManager.init();

    // Start BookingWatcher after a short delay (to let api load)
    setTimeout(() => {
        BookingWatcher.init();
    }, 2000);
});

// Also check when page becomes visible again
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        BookingWatcher.checkBookings();
    }
});

