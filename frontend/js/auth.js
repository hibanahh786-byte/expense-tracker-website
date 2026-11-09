/**
 * Expense Tracker - Authentication Logic
 */

// Route Guards
function requireAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
  }
}

function requireAdmin() {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  const user = getUser();
  if (!user || user.role !== 'admin') {
    showToast('Administrator privileges required to access this portal.', 'danger');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1200);
    return false;
  }
  return true;
}

function requireGuest() {
  const token = getToken();
  if (token) {
    window.location.href = 'dashboard.html';
  }
}

// Password toggle helper
function setupPasswordToggle() {
  const toggleButtons = document.querySelectorAll('.toggle-password');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = '<i class="bi bi-eye-slash"></i>';
        } else {
          input.type = 'password';
          btn.innerHTML = '<i class="bi bi-eye"></i>';
        }
      }
    });
  });
}

// Initialize Login Page
function initLoginPage() {
  requireGuest();
  setupPasswordToggle();

  const loginForm = document.getElementById('loginForm');
  const errorAlert = document.getElementById('loginErrorAlert');
  const btnSubmit = document.getElementById('btnLoginSubmit');
  const btnFillDemo = document.getElementById('btnFillDemo');
  const btnFillAdmin = document.getElementById('btnFillAdmin');

  // Fill admin credentials button
  if (btnFillAdmin) {
    btnFillAdmin.addEventListener('click', () => {
      document.getElementById('email').value = 'admin@expensetrack.app';
      document.getElementById('password').value = 'Admin@123';
      showToast('Administrator credentials filled! Click Sign In.', 'info');
    });
  }

  // Fill demo credentials button
  if (btnFillDemo) {
    btnFillDemo.addEventListener('click', () => {
      document.getElementById('email').value = 'demo@expensetracker.com';
      document.getElementById('password').value = 'Password@123';
      showToast('Demo credentials filled! Click Sign In to test.', 'info');
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorAlert) errorAlert.classList.add('d-none');

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        if (errorAlert) {
          errorAlert.textContent = 'Please enter both username/email and password.';
          errorAlert.classList.remove('d-none');
        }
        return;
      }

      try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';

        const res = await apiRequest('/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        if (res.success && res.token) {
          setAuth(res.token, res.user);
          showToast('Welcome back, ' + res.user.name + '!', 'success');
          setTimeout(() => {
            if (res.user && res.user.role === 'admin') {
              window.location.href = 'admin.html';
            } else {
              window.location.href = 'dashboard.html';
            }
          }, 800);
        }
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message || 'Login failed. Please check your credentials.';
          errorAlert.classList.remove('d-none');
        }
        showToast(err.message, 'danger');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Sign In';
      }
    });
  }
}

// Initialize Registration Page
function initRegisterPage() {
  requireGuest();
  setupPasswordToggle();

  const registerForm = document.getElementById('registerForm');
  const errorAlert = document.getElementById('registerErrorAlert');
  const btnSubmit = document.getElementById('btnRegisterSubmit');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorAlert) errorAlert.classList.add('d-none');

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const currency = document.getElementById('currency').value;

      if (!name || !email || !password) {
        if (errorAlert) {
          errorAlert.textContent = 'Please fill in all required fields.';
          errorAlert.classList.remove('d-none');
        }
        return;
      }

      if (password.length < 6) {
        if (errorAlert) {
          errorAlert.textContent = 'Password must be at least 6 characters.';
          errorAlert.classList.remove('d-none');
        }
        return;
      }

      if (password !== confirmPassword) {
        if (errorAlert) {
          errorAlert.textContent = 'Passwords do not match.';
          errorAlert.classList.remove('d-none');
        }
        return;
      }

      try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating Account...';

        const res = await apiRequest('/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, currency })
        });

        if (res.success && res.token) {
          setAuth(res.token, res.user);
          showToast('Account created successfully! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1000);
        }
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message || 'Registration failed.';
          errorAlert.classList.remove('d-none');
        }
        showToast(err.message, 'danger');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="bi bi-person-plus me-2"></i>Create Account';
      }
    });
  }
}
