// PWA Manager - Install Prompt & Notifications
const PWAManager = {
    deferredPrompt: null,
    isInstalled: false,

    init() {
        this.registerServiceWorker();
        this.handleInstallPrompt();
        this.checkIfInstalled();
        this.initNotificationPermission();
    },

    // Register Service Worker
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('✅ SW registered:', registration.scope);
                    })
                    .catch((error) => {
                        console.error('❌ SW registration failed:', error);
                    });
            });
        }
    },

    // Handle Install Prompt
    handleInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('💡 beforeinstallprompt fired');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallBanner();
        });

        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA installed!');
            this.deferredPrompt = null;
            this.isInstalled = true;
            this.hideInstallBanner();
        });
    },

    // Check if app is already installed
    checkIfInstalled() {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('📱 Running as installed PWA');
        }
    },

    // Show install banner
    showInstallBanner() {
        // Don't show if already installed
        if (this.isInstalled) return;

        // Check if banner was dismissed recently
        const dismissed = localStorage.getItem('pwa_install_dismissed');
        if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) {
            return; // Don't show for 24 hours after dismissal
        }

        // Create banner if not exists
        let banner = document.getElementById('pwa-install-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'pwa-install-banner';
            banner.className = 'fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-xl p-4 z-50 flex items-center gap-4 animate-slide-up';
            banner.innerHTML = `
                <div class="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-dark text-sm">Установите приложение</h4>
                    <p class="text-xs text-gray-sec">Быстрый доступ с главного экрана</p>
                </div>
                <button id="pwa-install-btn" class="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold">
                    Установить
                </button>
                <button id="pwa-dismiss-btn" class="text-gray-400 p-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
            document.body.appendChild(banner);

            // Install button click
            document.getElementById('pwa-install-btn').addEventListener('click', () => {
                this.promptInstall();
            });

            // Dismiss button click
            document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
                this.hideInstallBanner();
                localStorage.setItem('pwa_install_dismissed', Date.now().toString());
            });
        }

        banner.style.display = 'flex';
    },

    hideInstallBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.style.display = 'none';
        }
    },

    // Trigger install prompt
    async promptInstall() {
        if (!this.deferredPrompt) {
            console.log('No install prompt available');
            return false;
        }

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);

        if (outcome === 'accepted') {
            this.deferredPrompt = null;
            this.hideInstallBanner();
        }

        return outcome === 'accepted';
    },

    // Initialize notification permission
    initNotificationPermission() {
        // Check if notifications are enabled in app settings
        const notificationsEnabled = localStorage.getItem('netiwash_notifications_enabled');
        if (notificationsEnabled === 'false') {
            return; // User disabled in app
        }

        // Request permission if not yet asked
        if ('Notification' in window && Notification.permission === 'default') {
            // Wait a bit before asking
            setTimeout(() => {
                this.requestNotificationPermission();
            }, 10000); // Ask after 10 seconds
        }
    },

    // Request notification permission
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    },

    // Send local notification (for testing or app notifications)
    async sendLocalNotification(title, body, url = '/main.html') {
        const notificationsEnabled = localStorage.getItem('netiwash_notifications_enabled');
        if (notificationsEnabled === 'false') {
            return; // Disabled in app settings
        }

        if (Notification.permission !== 'granted') {
            const granted = await this.requestNotificationPermission();
            if (!granted) return;
        }

        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, {
            body: body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            vibrate: [200, 100, 200],
            data: url,
            tag: 'netiwash-notification'
        });
    }
};

// Initialize PWA Manager
document.addEventListener('DOMContentLoaded', () => {
    PWAManager.init();
});

// Global function for install button
window.installPWA = () => PWAManager.promptInstall();

// CSS for animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-up {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    .animate-slide-up {
        animation: slide-up 0.3s ease-out;
    }
`;
document.head.appendChild(style);
