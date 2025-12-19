function createAdminNavContent(currentPage) {
    const pages = {
        dashboard: {
            label: 'Dashboard',
            icon: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 40V20M36 40V8M12 40V32" /></svg>`,
            href: 'admin.html'
        },
        machines: {
            label: 'Машинки',
            icon: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M29.4 12.6C29.0335 12.9738 28.8282 13.4765 28.8282 14C28.8282 14.5235 29.0335 15.0261 29.4 15.4L32.6 18.6C32.9738 18.9664 33.4764 19.1717 34 19.1717C34.5235 19.1717 35.0261 18.9664 35.4 18.6L42.94 11.06C43.9456 13.2823 44.2501 15.7584 43.8129 18.1583C43.3756 20.5581 42.2174 22.7676 40.4925 24.4925C38.7676 26.2174 36.5581 27.3756 34.1582 27.8129C31.7584 28.2501 29.2823 27.9456 27.06 26.94L13.24 40.76C12.4443 41.5556 11.3652 42.0026 10.24 42.0026C9.11474 42.0026 8.0356 41.5556 7.23995 40.76C6.44431 39.9643 5.99731 38.8852 5.99731 37.76C5.99731 36.6347 6.44431 35.5556 7.23995 34.76L21.06 20.94C20.0543 18.7176 19.7498 16.2415 20.187 13.8417C20.6243 11.4418 21.7825 9.23227 23.5074 7.5074C25.2323 5.78253 27.4418 4.6243 29.8417 4.18704C32.2415 3.74979 34.7176 4.05429 36.94 5.05996L29.4 12.6Z"/></svg>`,
            href: 'admin-machines.html'
        },
        bookings: {
            label: 'Брони',
            icon: `<svg width="24" height="24" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M11.3333 8.5H29.75M11.3333 17H29.75M11.3333 25.5H29.75M4.25 8.5H4.26417M4.25 17H4.26417M4.25 25.5H4.26417"/></svg>`,
            href: 'admin-bookings.html'
        }
    };

    return `
        <!-- Logo -->
        <div class="flex items-center gap-3 p-6 pb-6 border-b border-white/10">
            <div class="w-10 h-10 shrink-0">
                <svg width="40" height="40" viewBox="0 0 112 112" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#filter0_d_16_351)">
                    <mask id="mask0_16_351" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="24" y="20" width="64" height="64">
                    <path d="M43.7432 51.7264C46.391 47.4012 52.6389 47.3011 55.424 51.5393L55.7572 52.0464C58.6368 56.4284 65.1188 56.2556 67.7608 51.7264" stroke="#D9D9D9" stroke-width="5" stroke-linecap="round"/>
                    <path d="M88 84H24V20H88V84ZM39.7861 36.2139V68.2139H71.7861V36.2139H39.7861Z" fill="#D9D9D9"/>
                    </mask>
                    <g mask="url(#mask0_16_351)">
                    <rect x="88" y="20" width="58.3148" height="90.5097" transform="rotate(45 88 20)" fill="#07AB66"/>
                    <rect x="46.7651" y="-21.2349" width="58.3148" height="90.5097" transform="rotate(45 46.7651 -21.2349)" fill="#DE093B"/>
                    <rect x="80.2351" y="-4.06836" width="25.1748" height="90.5097" transform="rotate(72.5 80.2351 -4.06836)" fill="#9E0D3A"/>
                    <rect x="87.8662" y="20" width="25.1748" height="90.5097" transform="rotate(17.5 87.8662 20)" fill="#0F523C"/>
                    </g>
                    </g>
                    <defs>
                    <filter id="filter0_d_16_351" x="0" y="0" width="112" height="112" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="4"/>
                    <feGaussianBlur stdDeviation="12"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_16_351"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_16_351" result="shape"/>
                    </filter>
                    </defs>
                </svg>
            </div>
            <div>
                <h2 class="font-bold text-lg leading-tight">NETI WASH</h2>
                <p class="text-[10px] text-white/50 uppercase tracking-widest">Admin</p>
            </div>
        </div>
        
        <!-- Navigation Links -->
        <div class="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
            ${Object.entries(pages).map(([key, page]) => `
                <a href="${page.href}" 
                   class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${key === currentPage
            ? 'bg-primary text-white shadow-lg shadow-primary/20'
            : 'text-white/60 hover:bg-white/5 hover:text-white'
        }">
                    <span class="text-xl w-6 h-6 flex items-center justify-center">${page.icon}</span>
                    <span class="font-semibold text-sm">${page.label}</span>
                </a>
            `).join('')}
        </div>
        
        <!-- Logout -->
        <div class="p-4 border-t border-white/10">
            <button id="adminLogoutBtn" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-accent/10 hover:text-accent transition-all group">
                <span class="text-xl group-hover:scale-110 transition-transform w-6 h-6 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.5 31.5H7.5C6.70435 31.5 5.94129 31.1839 5.37868 30.6213C4.81607 30.0587 4.5 29.2956 4.5 28.5V7.5C4.5 6.70435 4.81607 5.94129 5.37868 5.37868C5.94129 4.81607 6.70435 4.5 7.5 4.5H13.5M24 25.5L31.5 18M31.5 18L24 10.5M31.5 18H13.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                <span class="font-semibold text-sm">Выйти</span>
            </button>
        </div>
    `;
}

function initAdminNav() {
    const sidebar = document.getElementById('adminSidebar');
    if (!sidebar) return;

    const currentPage = document.body.dataset.adminPage || 'dashboard';
    sidebar.innerHTML = createAdminNavContent(currentPage);

    // Logout handler
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const confirmLogout = () => {
                api.logout();
                window.location.href = 'index.html';
            };

            if (typeof showModal !== 'undefined') {
                showModal('Выход', 'Вы действительно хотите выйти?', confirmLogout);
            } else {
                if (confirm('Выйти?')) confirmLogout();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initAdminNav);
