document.addEventListener('DOMContentLoaded', () => {
    const changePasswordForm = document.getElementById('changePasswordForm'); // Match your form's HTML ID

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop page reload

            // Grab your input IDs. Make sure these match your change-password.html input IDs!
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            // Simple frontend structural validation
            if (newPassword !== confirmPassword) {
                alert("New passwords do not match!");
                return;
            }

            try {
                // Send password update payload to our secure server route
                const response = await fetch('/api/profile/change-password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                        confirmPassword
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('Password updated successfully!');
                    window.location.href = 'profile.html'; // Redirect back to profile page
                } else {
                    alert('Error: ' + (result.error || 'Failed to update password.'));
                }
            } catch (error) {
                console.error('Password submission error:', error);
                alert('Could not connect to the server.');
            }
        });
    }
});