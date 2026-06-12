const userSettingCard = document.getElementById('user-setting');
const editUserCard = document.getElementById('edit-user');

const editBtn = document.querySelector('.edit');
const deleteBtn = document.querySelector('.delete');
const saveBtn = document.querySelector('.save');
const cancelBtn = document.querySelector('.cancel');
const changePasswordBtn = document.getElementById('change-password');

// ========================================================
// NEW: 1. Pull User Data From MySQL Database on Page Load
// ========================================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/profile');

    if (response.status === 401) {
      alert("Session expired or unauthorized. Redirecting to login...");
      window.location.href = '/login.html';
      return;
    }

    const user = await response.json();

    if (response.ok) {
      // Set the values in your "View Profile" card
      // (Using querySelector to find inputs inside your display card)
      const displayFields = userSettingCard.querySelectorAll('input');
      if (displayFields[0]) displayFields[0].value = user.username || '';
      if (displayFields[1]) displayFields[1].value = user.email || '';
      
      // If your profile layout has an explicit Full Name and Phone field, populate them:
      if (document.getElementById('edit-username')) document.getElementById('edit-username').value = user.full_name || user.username;
      if (document.getElementById('edit-email')) document.getElementById('edit-email').value = user.email || '';
      
      // Update any text element showing the username globally if it exists
      const usernameHeader = document.getElementById('usernameDisplay');
      if (usernameHeader) usernameHeader.textContent = user.username;
    } else {
      console.error('Error fetching profile:', user.error);
    }
  } catch (error) {
    console.error('Network error fetching profile data:', error);
  }
});

// Switch to Edit User view
editBtn.addEventListener('click', () => {
  userSettingCard.style.display = 'none';
  editUserCard.style.display = 'block';
});

// Delete user
deleteBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to delete this user?')) {
    alert('User deleted successfully!');
  }
});

// ========================================================
// UPGRADED: 2. Save Changes Natively to MySQL Database
// ========================================================
saveBtn.addEventListener('click', async (e) => {
  e.preventDefault(); // Prevent standard button actions

  const newUsername = document.getElementById('edit-username').value;
  const newEmail = document.getElementById('edit-email').value;
  // If your edit form has a phone input field, capture it here (e.g., document.getElementById('edit-phone').value)
  const phoneVal = ""; 

  const updatedData = {
    full_name: newUsername, // Mapping username form element to full_name in backend
    email: newEmail,
    phone: phoneVal
  };

  try {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Keep your original UI transitions
      const displayFields = userSettingCard.querySelectorAll('input');
      if (displayFields[0]) displayFields[0].value = newUsername;
      if (displayFields[1]) displayFields[1].value = newEmail;

      alert('Changes saved to database successfully!');
      editUserCard.style.display = 'none';
      userSettingCard.style.display = 'block';
    } else {
      alert('Update failed: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Could not connect to the server.');
  }
});

// Cancel editing
cancelBtn.addEventListener('click', () => {
  alert('Edit canceled.');
  editUserCard.style.display = 'none';
  userSettingCard.style.display = 'block';
});

// Redirect to Change Password page
changePasswordBtn.addEventListener('click', () => {
  window.location.href = "change-password.html";
});