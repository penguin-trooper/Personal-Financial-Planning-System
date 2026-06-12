const userSettingCard = document.getElementById('user-setting');
const editUserCard = document.getElementById('edit-user');
const passwordCard = document.getElementById('password-container');

const editBtn = document.querySelector('.edit');
const deleteBtn = document.querySelector('.delete');
const saveBtn = document.querySelector('.save');
const cancelBtn = document.querySelector('.cancel');
const changePasswordBtn = document.getElementById('change-password');
const savePasswordBtn = document.getElementById('save-password-btn');
const cancelPasswordBtn = document.getElementById('cancel-password-btn');

const usernameInput = document.querySelector('#user-setting input[type="text"]');
const emailInput = document.querySelector('#user-setting input[type="email"]');

const editUsername = document.getElementById('edit-username');
const editEmail = document.getElementById('edit-email');

// ======================================
// LOAD PROFILE DATA
// ======================================
async function loadProfile() {
    try {
        const res = await fetch('/api/profile');

        if (!res.ok) {
            window.location.href = '/login.html';
            return;
        }

        const data = await res.json();

        usernameInput.value = data.username;
        emailInput.value = data.email;

        editUsername.value = data.username;
        editEmail.value = data.email;

    } catch (err) {
        console.error('Failed to load profile:', err);
        alert('Unable to load profile information.');
    }
}

// Load profile immediately when page opens
loadProfile();

// ======================================
// ENTER EDIT MODE
// ======================================
editBtn.addEventListener('click', () => {
    userSettingCard.style.display = 'none';
    editUserCard.style.display = 'block';
    if (passwordCard) passwordCard.style.display = 'none';
});

// ======================================
// SAVE PROFILE CHANGES
// ======================================
saveBtn.addEventListener('click', async () => {
    try {
        const username = editUsername.value.trim();
        const email = editEmail.value.trim();

        if (!username || !email) {
            alert('Username and Email cannot be empty.');
            return;
        }

        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email })
        });

        const result = await res.json();

        if (!res.ok) {
            alert(result.error || 'Failed to update profile');
            return;
        }

        alert(result.message || 'Profile updated successfully');
        await loadProfile();

        editUserCard.style.display = 'none';
        userSettingCard.style.display = 'block';

    } catch (err) {
        console.error('Update failed:', err);
        alert('Server error while updating profile.');
    }
});

// ======================================
// CANCEL EDIT
// ======================================
cancelBtn.addEventListener('click', async () => {
    await loadProfile();
    editUserCard.style.display = 'none';
    userSettingCard.style.display = 'block';
});

// ======================================
// DELETE ACCOUNT
// ======================================
deleteBtn.addEventListener('click', async () => {
    const confirmed = confirm(
        'Are you sure you want to delete your account?\n\nThis action cannot be undone.'
    );

    if (!confirmed) return;

    try {
        const res = await fetch('/api/profile', {
            method: 'DELETE'
        });

        const result = await res.json();

        if (!res.ok) {
            alert(result.error || 'Failed to delete account');
            return;
        }

        alert(result.message || 'Account deleted successfully');
        window.location.href = '/login.html';

    } catch (err) {
        console.error('Delete failed:', err);
        alert('Server error while deleting account.');
    }
});

// ======================================
// CHANGE PASSWORD INLINE SWITCH
// ======================================
changePasswordBtn.addEventListener('click', () => {
    editUserCard.style.display = 'none';
    if (passwordCard) passwordCard.style.display = 'block';
});

cancelPasswordBtn?.addEventListener('click', () => {
    if (passwordCard) passwordCard.style.display = 'none';
    editUserCard.style.display = 'block';
    
    // Clean up input fields on cancellation
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordAlert').innerHTML = '';
});

// ======================================
// BACKEND API SUBMISSION FOR PASSWORD CHANGE
// ======================================
savePasswordBtn?.addEventListener('click', async () => {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!newPassword || !confirmPassword) {
        alert("Please fill out both password fields.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("New passwords do not match!");
        return;
    }

    try {
        const res = await fetch('/api/profile/change-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                newPassword,
                confirmPassword
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Failed to change password');
            return;
        }

        alert(data.message || 'Password changed successfully!');
        cancelPasswordBtn.click(); // Returns securely to Edit Profile menu view

    } catch (err) {
        console.error('Password change request failed:', err);
        alert('Server error while changing password.');
    }
});