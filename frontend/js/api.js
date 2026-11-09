/**
 * Expense Tracker - Central API & Utility Library
 */

const API_BASE_URL = window.location.origin;

// Category metadata for icons and styles
const CATEGORY_META = {
  Food: { icon: 'bi-egg-fried', color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.2)' },
  Travel: { icon: 'bi-airplane', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' },
  Shopping: { icon: 'bi-bag', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.2)' },
  Education: { icon: 'bi-book', color: '#00f5a0', bg: 'rgba(0, 245, 160, 0.2)' },
  Health: { icon: 'bi-heart-pulse', color: '#fa5252', bg: 'rgba(250, 82, 82, 0.2)' },
  Entertainment: { icon: 'bi-film', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' },
  Bills: { icon: 'bi-receipt', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.2)' },
  Others: { icon: 'bi-three-dots', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.2)' }
};

// ==========================================
// Authentication Storage Utilities
// ==========================================

function getToken() {
  return localStorage.getItem('et_token');
}

function getCurrentUser() {
  const userJson = localStorage.getItem('et_user');
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    return null;
  }
}

const getUser = getCurrentUser;

function setAuth(token, user) {
  if (token) localStorage.setItem('et_token', token);
  if (user) localStorage.setItem('et_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('et_token');
  localStorage.removeItem('et_user');
  window.location.href = 'login.html';
}

function getCurrency() {
  const user = getCurrentUser();
  return (user && user.currency) ? user.currency : '₹';
}

function updateLocalUser(fields) {
  const user = getCurrentUser() || {};
  const updated = { ...user, ...fields };
  localStorage.setItem('et_user', JSON.stringify(updated));
  return updated;
}

// ==========================================
// Formatting Helpers
// ==========================================

function formatCurrency(amount, currencySymbol = null) {
  const sym = currencySymbol || getCurrency();
  const num = Number(amount) || 0;
  return `${sym} ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatDate(dateInput, format = 'medium') {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  if (format === 'short') {
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getCategoryBadge(category) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Others;
  return `<span class="category-badge badge-${category}">
    <i class="bi ${meta.icon}"></i> ${category}
  </span>`;
}

// ==========================================
// Toast Notification
// ==========================================

function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const toastId = 'toast_' + Date.now();
  const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : type === 'warning' ? 'bg-warning text-dark' : 'bg-primary';
  const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';

  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0 shadow" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon}"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', toastHtml);
  const toastEl = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

// ==========================================
// Central Fetch Client
// ==========================================

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('et_token');
        localStorage.removeItem('et_user');
        if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html') && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
          window.location.href = 'login.html';
        }
      }
      throw new Error(data.message || 'An error occurred while processing the request.');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// ==========================================
// Sidebar & Navbar Initializer for Dashboards
// ==========================================

function initDashboardLayout(activePage = 'dashboard') {
  // Mobile sidebar toggle handler
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  let backdrop = document.querySelector('.sidebar-backdrop');

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('show');
      backdrop.classList.toggle('show');
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('show');
      backdrop.classList.remove('show');
    });
  }

  // Populate active user info
  const user = getCurrentUser();
  if (user) {
    const userNames = document.querySelectorAll('.dynamic-user-name');
    userNames.forEach((el) => (el.textContent = user.name || 'User'));

    const userEmails = document.querySelectorAll('.dynamic-user-email');
    userEmails.forEach((el) => (el.textContent = user.email || ''));

    const userAvatars = document.querySelectorAll('.dynamic-user-avatar');
    userAvatars.forEach((el) => {
      const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
      el.textContent = initial;
    });

    const currencyBadges = document.querySelectorAll('.dynamic-user-currency');
    currencyBadges.forEach((el) => (el.textContent = user.currency || '₹'));

    // Admin menu item visibility
    const adminLinks = document.querySelectorAll('a[href="admin.html"]');
    if (user.role === 'admin') {
      adminLinks.forEach((link) => {
        const parentLi = link.closest('.sidebar-menu-item');
        if (parentLi) parentLi.classList.remove('d-none');
      });
    } else {
      adminLinks.forEach((link) => {
        const parentLi = link.closest('.sidebar-menu-item');
        if (parentLi) parentLi.classList.add('d-none');
      });
    }
  }

  // Logout handler
  const logoutBtns = document.querySelectorAll('.btn-logout');
  logoutBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to log out?')) {
        clearAuth();
      }
    });
  });
}
