const userSettingCard = document.getElementById('user-setting');
const editUserCard = document.getElementById('edit-user');

const editBtn = document.querySelector('.edit');
const deleteBtn = document.querySelector('.delete');
const saveBtn = document.querySelector('.save');
const cancelBtn = document.querySelector('.cancel');
const changePasswordBtn = document.getElementById('change-password');

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

// Save changes
saveBtn.addEventListener('click', () => {
  const newUsername = document.getElementById('edit-username').value;
  const newEmail = document.getElementById('edit-email').value;

  userSettingCard.querySelector('input[type="text"]').value = newUsername;
  userSettingCard.querySelector('input[type="email"]').value = newEmail;

  alert('Changes saved successfully!');
  editUserCard.style.display = 'none';
  userSettingCard.style.display = 'block';
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
