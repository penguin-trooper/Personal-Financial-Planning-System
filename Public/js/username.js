document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/current-user');
        const data = await response.json();

        if (data.loggedIn && data.username) {
            document.getElementById('navbar-username').textContent = data.username;
        } else {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error fetching user session data:', error);
    }
});