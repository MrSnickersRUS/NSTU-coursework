// Prevent back button access after logout
window.addEventListener('load', () => {
    // Detect if user is logged out and trying to use back button
    window.addEventListener('pageshow', (event) => {
        // If page is loaded from cache (back/forward)
        if (event.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
            // Check if user is actually logged in
            if (!sessionStorage.getItem('token')) {
                // User is not logged in but viewing cached page - redirect
                window.location.replace('index.html');
            }
        }
    });

    // Also check on popstate (browser back/forward)
    window.addEventListener('popstate', () => {
        if (!sessionStorage.getItem('token')) {
            window.location.replace('index.html');
        }
    });
});
