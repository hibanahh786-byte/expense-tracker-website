/**
 * Expense Tracker - User Profile Management
 */

async function initProfilePage() {
  requireAuth();
  initDashboardLayout('profile');

  await loadUserProfile();
  setupProfileForms();
}

async function loadUserProfile() {
  try {
    const res = await apiRequest('/profile');
    if (res.success && res.user) {
      const u = res.user;

      // Fill display cards
      document.getElementById('profileHeaderName').textContent = u.name;
      document.getElementById('profileHeaderEmail').textContent = u.email;
      document.getElementById('profileHeaderAvatar').textContent = u.name ? u.name.charAt(0).toUpperCase() : 'U';

      document.getElementById('profileMemberSince').textContent = formatDate(u.createdAt);
      document.getElementById('profileTotalSpent').textContent = formatCurrency(u.totalSpent, u.currency);
      document.getElementById('profileTotalCount').textContent = `${u.expenseCount || 0} transactions`;

      // Fill edit form
      document.getElementById('profileNameInput').value = u.name;
      document.getElementById('profileEmailInput').value = u.email;
      document.getElementById('profileCurrencySelect').value = u.currency || '₹';

      // Update local storage
      updateLocalUser({ name: u.name, currency: u.currency });
    }
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function setupProfileForms() {
  const profileForm = document.getElementById('updateProfileForm');
  const passwordForm = document.getElementById('changePasswordForm');

  // Update Profile Form
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSaveProfile');
      const name = document.getElementById('profileNameInput').value.trim();
      const currency = document.getElementById('profileCurrencySelect').value;

      if (!name) {
        showToast('Please enter your name.', 'danger');
        return;
      }

      try {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        const res = await apiRequest('/profile', {
          method: 'PUT',
          body: JSON.stringify({ name, currency })
        });

        if (res.success) {
          showToast('Profile updated successfully!', 'success');
          updateLocalUser({ name, currency });
          initDashboardLayout('profile');
          await loadUserProfile();
        }
      } catch (err) {
        showToast(err.message, 'danger');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check2 me-2"></i>Save Changes';
      }
    });
  }

  // Change Password Form
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSavePassword');
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmNewPassword = document.getElementById('confirmNewPassword').value;

      if (!currentPassword || !newPassword) {
        showToast('Please fill all password fields.', 'danger');
        return;
      }

      if (newPassword.length < 6) {
        showToast('New password must be at least 6 characters.', 'danger');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        showToast('New passwords do not match.', 'danger');
        return;
      }

      try {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';

        const res = await apiRequest('/api/users/change-password', {
          method: 'PUT',
          body: JSON.stringify({ currentPassword, newPassword })
        });

        if (res.success) {
          showToast('Password changed successfully!', 'success');
          passwordForm.reset();
        }
      } catch (err) {
        showToast(err.message, 'danger');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-key me-2"></i>Change Password';
      }
    });
  }
}
