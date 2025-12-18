// PWA Registration Script
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

// Install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💡 beforeinstallprompt fired');
    e.preventDefault();
    deferredPrompt = e;

    // Показать свою кнопку установки (опционально)
    const installButton = document.getElementById('installBtn');
    if (installButton) {
        installButton.style.display = 'block';
        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response: ${outcome}`);
                deferredPrompt = null;
                installButton.style.display = 'none';
            }
        });
    }
});

// Когда приложение установлено
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed!');
    deferredPrompt = null;
});
