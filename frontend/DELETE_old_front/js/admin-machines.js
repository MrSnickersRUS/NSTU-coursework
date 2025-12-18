document.addEventListener('DOMContentLoaded', () => {
    loadMachinesList();
});

async function loadMachinesList() {
    const container = document.getElementById('machinesContainer');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-10"><div class="animate-pulse text-gray-400">Загрузка машинок...</div></div>';

    try {
        const machines = await api.get('/machines');
        container.innerHTML = '';

        if (machines.length === 0) {
            container.innerHTML = '<div class="text-center py-10 text-gray-400">Нет машинок</div>';
            return;
        }

        const statusInfo = {
            free: {
                label: 'Свободна',
                color: 'bg-green-100 text-green-700',
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                        <circle cx="12" cy="12" r="5"></circle>
                        <path d="M12 12h.01"></path>
                       </svg>`,
                iconBg: 'bg-green-50'
            },
            busy: {
                label: 'Занята',
                color: 'bg-red-100 text-red-700',
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                        <circle cx="12" cy="12" r="5"></circle>
                        <path d="M12 12h.01"></path>
                       </svg>`,
                iconBg: 'bg-red-50'
            },
            repair: {
                label: 'Ремонт',
                color: 'bg-yellow-100 text-yellow-700',
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                        <circle cx="12" cy="12" r="5"></circle>
                        <path d="M12 12h.01"></path>
                       </svg>`,
                iconBg: 'bg-yellow-50'
            }
        };

        machines.forEach(m => {
            const el = document.createElement('div');
            el.className = 'bg-white rounded-2xl p-5 shadow-card border border-gray-100 flex flex-col items-center text-center hover:shadow-lg transition-all';

            // Determine status style
            const info = statusInfo[m.status] || statusInfo.free;

            el.innerHTML = `
                <div class="w-20 h-20 ${info.iconBg} rounded-full flex items-center justify-center text-2xl mb-4">
                    ${info.icon}
                </div>
                <h3 class="text-xl font-extrabold text-dark mb-1">${m.name}</h3>
                <div class="inline-flex items-center px-3 py-1 rounded-full ${info.color} text-xs font-bold mb-6">
                    <span class="w-2 h-2 rounded-full bg-current mr-2 opacity-70"></span>${info.label}
                </div>
                <div class="flex gap-3 w-full mt-auto">
                    <button onclick="openEditMachineModal(${m.id}, '${m.name}', '${m.status}')"
                        class="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-[#06965a] flex items-center justify-center gap-2 transition-transform active:scale-95">
                        Изм.
                    </button>
                    <button onclick="deleteMachine(${m.id})"
                        class="flex-1 py-3 rounded-xl bg-white text-accent border border-accent/20 text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-2 transition-transform active:scale-95">
                        Удалить
                    </button>
                </div>
            `;
            container.appendChild(el);
        });

    } catch (e) {
        console.error('Failed to load machines:', e);
        container.innerHTML = `<div class="text-center py-10 text-red-500">Ошибка: ${e.message}</div>`;
    }
}

// Modal Logic
window.openMachineModal = (isEdit = false, id = null, name = '', status = 'free') => {
    // We'll use a simple prompt logic or the generic modal for now, 
    // but ideally we need a custom form modal.
    // For MVP/fixing, let's use the generic modal with inputs injected if possible, 
    // or just prompts for now to get it working, OR create a specific modal HTML in the page.
    // Let's assume there is a #machineModal in the HTML (we will add it).

    const modal = document.getElementById('machineModal');
    const form = document.getElementById('machineForm');
    const modalTitle = document.getElementById('machineModalTitle');

    if (!modal || !form) return;

    // Reset form
    form.reset();
    document.getElementById('machineId').value = id || '';
    document.getElementById('machineName').value = name;
    document.getElementById('machineStatus').value = status;

    modalTitle.innerText = isEdit ? 'Редактировать машинку' : 'Новая машинка';

    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

window.openCreateMachineModal = () => {
    openMachineModal(false);
}

window.openEditMachineModal = (id, name, status) => {
    openMachineModal(true, id, name, status);
}

window.closeMachineModal = () => {
    const modal = document.getElementById('machineModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

window.saveMachine = async (e) => {
    e.preventDefault();

    const id = document.getElementById('machineId').value;
    const name = document.getElementById('machineName').value;
    const status = document.getElementById('machineStatus').value;

    const isEdit = !!id;

    try {
        if (isEdit) {
            await api.put(`/machines/${id}`, { name, status });
            showToast('Машинка обновлена');
        } else {
            await api.post('/machines', { name, status });
            showToast('Машинка создана');
        }

        closeMachineModal();
        loadMachinesList();
    } catch (err) {
        showToast(err.message, true);
    }
}

window.deleteMachine = async (id) => {
    if (typeof showModal !== 'undefined') {
        showModal('Удаление', `Удалить машинку #${id}?`, async () => {
            try {
                await api.delete(`/machines/${id}`);
                showToast('Машинка удалена');
                loadMachinesList();
            } catch (e) {
                showToast(e.message, true);
            }
        });
    } else if (confirm(`Удалить машинку #${id}?`)) {
        try {
            await api.delete(`/machines/${id}`);
            showToast('Машинка удалена');
            loadMachinesList();
        } catch (e) {
            showToast(e.message, true);
        }
    }
}
