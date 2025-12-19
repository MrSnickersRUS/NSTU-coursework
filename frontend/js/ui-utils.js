window.showToast = (message, isError = false) => {
    let toast = document.getElementById('custom-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'custom-toast';
        toast.className = 'fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 opacity-0 translate-y-[-10px]';
        document.body.appendChild(toast);
    }

    toast.className = `fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 ${isError ? 'bg-accent text-white' : 'bg-dark text-white'}`;
    toast.innerText = message;

    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-[-10px]');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-10px]');
    }, 3000);
}

window.showModal = (title, message, onConfirm = null) => {
    const existing = document.getElementById('custom-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-modal-overlay';
    overlay.className = 'fixed inset-0 bg-black/40 z-[90] flex items-center justify-center px-4 animate-fade-in';

    const modal = document.createElement('div');
    modal.className = 'bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl transform scale-95 animate-pop-in';

    const confirmBtnHtml = onConfirm
        ? `<button id="modal-confirm" class="flex-1 h-12 bg-primary text-white rounded-xl font-bold active:scale-95 transition">OK</button>`
        : `<button id="modal-close" class="flex-1 h-12 bg-primary text-white rounded-xl font-bold active:scale-95 transition">OK</button>`;

    const cancelBtnHtml = onConfirm
        ? `<button id="modal-cancel" class="flex-1 h-12 bg-gray-100 text-dark rounded-xl font-bold active:scale-95 transition">Отмена</button>`
        : ``;

    modal.innerHTML = `
        <h3 class="text-xl font-extrabold text-dark mb-2 text-center">${title}</h3>
        <p class="text-gray-500 text-center font-medium mb-6 leading-relaxed">${message}</p>
        <div class="flex gap-3">
            ${cancelBtnHtml}
            ${confirmBtnHtml}
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();

    if (onConfirm) {
        document.getElementById('modal-confirm').onclick = () => {
            onConfirm();
            close();
        };
        document.getElementById('modal-cancel').onclick = close;
    } else {
        document.getElementById('modal-close').onclick = close;
    }
}

const style = document.createElement('style');
style.innerHTML = `
@keyframes pop-in {
    0% { transform: scale(0.9); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
}
.animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
}
.animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
`;
document.head.appendChild(style);
