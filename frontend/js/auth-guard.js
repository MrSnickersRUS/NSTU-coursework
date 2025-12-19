window.addEventListener('load', () => {
    window.addEventListener('pageshow', (event) => {
        if (event.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
            if (!sessionStorage.getItem('token')) {
                window.location.replace('index.html');
            }
        }
    });

    window.addEventListener('popstate', () => {
        if (!sessionStorage.getItem('token')) {
            window.location.replace('index.html');
        }
    });
});
