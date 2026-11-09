/**
 * ExpenseTrack - Admin Operations Center & Multi-Module Controller
 */

let allAdminUsers = [];
let allAdminExpenses = [];
let adminChartInstance = null;

async function initAdminPage() {
  // Enforce Admin Route Guard
  if (!requireAdmin()) return;

  initDashboardLayout('admin');
  loadAdminUserProfile();
  setupAdminTabs();
  setupSearchAndFilters();
  setupBackupHandlers();

  // Initial Data Load
  await Promise.all([
    loadAdminStats(),
    loadAdminUsers(),
    loadAdminExpenses()
  ]);
}

function loadAdminUserProfile() {
  const user = getCurrentUser();
  if (user) {
    const avatarEls = document.querySelectorAll('.dynamic-user-avatar');
    const nameEls = document.querySelectorAll('.dynamic-user-name');
    const emailEls = document.querySelectorAll('.dynamic-user-email');
    avatarEls.forEach(el => el.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'A');
    nameEls.forEach(el => el.textContent = user.name || 'System Administrator');
    emailEls.forEach(el => el.textContent = user.email || 'admin@expensetrack.app');
  }
}

/**
 * Tab Navigation Controller
 */
function setupAdminTabs() {
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const sidebarNavBtns = document.querySelectorAll('.admin-sidebar-nav');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');

  function switchTab(targetTabId) {
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === targetTabId);
    });
    sidebarNavBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-target-tab') === targetTabId);
    });
    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === targetTabId);
    });

    if (targetTabId === 'tabOverview' && adminChartInstance) {
      adminChartInstance.resize();
    }
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  sidebarNavBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(btn.getAttribute('data-target-tab'));
    });
  });

  // Shortcut action buttons from Overview tab
  const btnQuickGoUsers = document.getElementById('btnQuickGoUsers');
  if (btnQuickGoUsers) {
    btnQuickGoUsers.addEventListener('click', () => switchTab('tabUsers'));
  }

  const btnQuickGoAudit = document.getElementById('btnQuickGoAudit');
  if (btnQuickGoAudit) {
    btnQuickGoAudit.addEventListener('click', () => switchTab('tabAudit'));
  }
}

/**
 * Platform Stats & Diagnostics
 */
async function loadAdminStats() {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.stats) {
        const s = data.stats;
        const usersEl = document.getElementById('adminTotalUsers');
        const amountEl = document.getElementById('adminTotalAmount');
        const transEl = document.getElementById('adminTotalTransactions');
        const modeEl = document.getElementById('adminStorageMode');
        const nodeVerEl = document.getElementById('diagNodeVersion');
        const memEl = document.getElementById('diagMemory');
        const uptimeEl = document.getElementById('diagUptime');
        const uptimeBadge = document.getElementById('adminUptimeBadge');

        if (usersEl) usersEl.textContent = s.totalUsers;
        if (amountEl) amountEl.textContent = formatCurrency(s.totalAmount);
        if (transEl) transEl.textContent = s.totalExpenses;
        if (modeEl) modeEl.textContent = s.storageMode;
        if (nodeVerEl) nodeVerEl.textContent = `Node.js ${s.nodeVersion} (${s.platform})`;
        if (memEl) memEl.textContent = s.memoryUsage || '42.5 MB';
        
        const uptimeSec = s.serverUptime || 0;
        const hours = Math.floor(uptimeSec / 3600);
        const mins = Math.floor((uptimeSec % 3600) / 60);
        const secs = uptimeSec % 60;
        const uptimeStr = hours > 0 ? `${hours}h ${mins}m ${secs}s` : `${mins}m ${secs}s`;

        if (uptimeEl) uptimeEl.textContent = uptimeStr;
        if (uptimeBadge) uptimeBadge.textContent = `Uptime: ${uptimeStr}`;
      }
    }
  } catch (err) {
    console.error('Failed to load admin stats:', err);
  }
}

/**
 * User Management (Module 2)
 */
async function loadAdminUsers() {
  const tbody = document.getElementById('adminUsersTableBody');
  const countBadge = document.getElementById('badgeTabUsersCount');
  if (!tbody) return;

  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.users) {
        allAdminUsers = data.users;
        if (countBadge) countBadge.textContent = allAdminUsers.length;
        renderAdminUsersTable(allAdminUsers);
      }
    }
  } catch (err) {
    console.error('Failed to load admin users:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Error loading user ledger.</td></tr>`;
  }
}

function renderAdminUsersTable(users) {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;

  if (!users || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 opacity-75">No matching user accounts found.</td></tr>`;
    return;
  }

  const currentUser = getCurrentUser() || {};
  const currentUserId = String(currentUser.id || currentUser._id);

  tbody.innerHTML = users.map(u => {
    const isSelf = String(u.id || u._id) === currentUserId;
    const isAdmin = u.role === 'admin' || u.role === 'Admin';
    const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent';
    const totalSpent = Number(u.totalSpent || 0);

    return `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="user-avatar" style="width: 34px; height: 34px; font-size: 0.85rem; background: ${isAdmin ? 'rgba(0, 245, 160, 0.2)' : 'rgba(255, 255, 255, 0.1)'}; color: ${isAdmin ? '#00f5a0' : '#FFFFFF'};">
              ${u.name ? u.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div class="fw-semibold">${escapeHtml(u.name)} ${isSelf ? '<span class="badge ms-1" style="background: rgba(0, 245, 160, 0.2); color: #00f5a0; font-size: 0.65rem;">YOU</span>' : ''}</div>
            </div>
          </div>
        </td>
        <td><span class="font-monospace small">${escapeHtml(u.email)}</span></td>
        <td><span class="badge" style="background: rgba(0, 245, 160, 0.15); color: #00f5a0; border: 1px solid rgba(0, 245, 160, 0.3);">${escapeHtml(u.currency || '₹')}</span></td>
        <td>
          <span class="badge ${isAdmin ? 'admin-role-badge-admin' : 'admin-role-badge-user'}">
            <i class="bi ${isAdmin ? 'bi-shield-check' : 'bi-person'} me-1"></i>${isAdmin ? 'Administrator' : 'Standard User'}
          </span>
        </td>
        <td>
          <div class="small fw-semibold">${formatCurrency(totalSpent, u.currency)}</div>
          <small class="opacity-75">${u.expenseCount || 0} transactions</small>
        </td>
        <td><span class="small opacity-75">${dateStr}</span></td>
        <td class="text-end">
          <div class="d-inline-flex gap-1">
            ${isSelf ? `
              <span class="badge py-2 px-3 text-secondary" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">Active Session</span>
            ` : `
              <button class="btn btn-sm ${isAdmin ? 'btn-navy-outline' : 'btn-mint'} py-1 px-2" onclick="handleToggleRole('${u.id || u._id}', '${isAdmin ? 'user' : 'admin'}', '${escapeHtml(u.name)}')" title="${isAdmin ? 'Demote to User' : 'Promote to Admin'}">
                <i class="bi ${isAdmin ? 'bi-shield-slash' : 'bi-shield-fill-check'} me-1"></i>${isAdmin ? 'Demote' : 'Promote'}
              </button>
              <button class="btn btn-sm btn-outline-danger py-1 px-2" onclick="handleDeleteUser('${u.id || u._id}', '${escapeHtml(u.name)}')" title="Delete Account">
                <i class="bi bi-trash"></i>
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function handleToggleRole(userId, newRole, userName) {
  const actionText = newRole === 'admin' ? 'Promote to Administrator' : 'Demote to Standard User';
  if (!confirm(`Are you sure you want to ${actionText} for "${userName}"?`)) return;

  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role: newRole })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message || `Role updated successfully.`, 'success');
      await loadAdminUsers();
      await loadAdminStats();
    } else {
      showToast(data.message || 'Failed to update role.', 'danger');
    }
  } catch (err) {
    showToast(err.message || 'Network error updating user role.', 'danger');
  }
}

async function handleDeleteUser(userId, userName) {
  if (!confirm(`CAUTION: Are you sure you want to permanently delete user "${userName}"?\n\nThis will purge the account and all associated expense records. This action cannot be undone.`)) return;

  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message || `User account removed.`, 'success');
      await loadAdminUsers();
      await loadAdminExpenses();
      await loadAdminStats();
    } else {
      showToast(data.message || 'Failed to delete user.', 'danger');
    }
  } catch (err) {
    showToast(err.message || 'Network error deleting user.', 'danger');
  }
}

/**
 * Global Platform Expense Audit (Module 3)
 */
async function loadAdminExpenses() {
  const tbody = document.getElementById('adminAuditTableBody');
  const countBadge = document.getElementById('badgeTabExpensesCount');
  if (!tbody) return;

  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/api/admin/expenses?limit=100`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.expenses) {
        allAdminExpenses = data.expenses;
        if (countBadge) countBadge.textContent = allAdminExpenses.length;
        renderAdminExpensesTable(allAdminExpenses);
        renderAdminCategoryChart(allAdminExpenses);
      }
    }
  } catch (err) {
    console.error('Failed to load platform expenses:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Error auditing platform expenses.</td></tr>`;
  }
}

function renderAdminExpensesTable(expenses) {
  const tbody = document.getElementById('adminAuditTableBody');
  if (!tbody) return;

  if (!expenses || expenses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 opacity-75">No expense transactions match current filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = expenses.map(e => {
    const user = e.user || { name: 'Unknown User', email: 'unknown@user.com', currency: '₹' };
    const dateStr = e.date ? new Date(e.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent';
    const amountVal = Number(e.amount || 0);

    return `
      <tr>
        <td>
          <div class="fw-semibold">${escapeHtml(user.name)}</div>
          <small class="opacity-75 font-monospace">${escapeHtml(user.email)}</small>
        </td>
        <td>
          <div class="fw-semibold">${escapeHtml(e.title)}</div>
          <small class="opacity-75">${escapeHtml(e.description || 'No description provided')}</small>
        </td>
        <td>${getCategoryBadge(e.category)}</td>
        <td><span class="badge badge-payment">${escapeHtml(e.paymentMethod || 'UPI')}</span></td>
        <td><span class="small opacity-75">${dateStr}</span></td>
        <td class="fw-bold">${formatCurrency(amountVal, user.currency)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger py-1 px-2" onclick="handleDeleteExpense('${e._id || e.id}', '${escapeHtml(e.title)}')" title="Moderate / Delete Expense">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function handleDeleteExpense(expenseId, title) {
  if (!confirm(`Are you sure you want to delete the expense "${title}" from the platform ledger?`)) return;

  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/api/admin/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message || 'Expense record removed.', 'success');
      await loadAdminExpenses();
      await loadAdminStats();
    } else {
      showToast(data.message || 'Failed to remove expense.', 'danger');
    }
  } catch (err) {
    showToast(err.message || 'Network error deleting expense.', 'danger');
  }
}

/**
 * Chart.js Visual Platform Distribution
 */
function renderAdminCategoryChart(expenses) {
  const canvas = document.getElementById('adminCategoryChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const categoryTotals = {};
  expenses.forEach(e => {
    const cat = e.category || 'Others';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount || 0);
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (labels.length === 0) {
    labels.push('Food', 'Bills', 'Shopping', 'Travel');
    data.push(1000, 2000, 1500, 800);
  }

  const palette = [
    '#ff6b6b', '#4dabf7', '#cc5de8', '#00f5a0',
    '#fa5252', '#fcc419', '#ff922b', '#868e96'
  ];

  if (adminChartInstance) {
    adminChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  adminChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: palette.slice(0, labels.length),
        borderColor: '#0d1733',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#FFFFFF',
            font: { family: 'Inter', size: 12 },
            boxWidth: 12,
            padding: 12
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.parsed;
              return ` ${context.label}: ${formatCurrency(val)}`;
            }
          }
        }
      },
      cutout: '70%'
    }
  });
}

/**
 * Search & Filters Logic
 */
function setupSearchAndFilters() {
  // Users Filter
  const userSearch = document.getElementById('userSearchInput');
  const userRole = document.getElementById('userRoleFilter');
  const btnRefreshUsers = document.getElementById('btnRefreshUsers');

  function applyUserFilters() {
    const query = (userSearch ? userSearch.value : '').toLowerCase().trim();
    const role = (userRole ? userRole.value : '').toLowerCase().trim();

    const filtered = allAdminUsers.filter(u => {
      const matchQuery = !query || 
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query));
      const matchRole = !role || (u.role && u.role.toLowerCase() === role);
      return matchQuery && matchRole;
    });

    renderAdminUsersTable(filtered);
  }

  if (userSearch) userSearch.addEventListener('input', applyUserFilters);
  if (userRole) userRole.addEventListener('change', applyUserFilters);
  if (btnRefreshUsers) {
    btnRefreshUsers.addEventListener('click', async () => {
      btnRefreshUsers.disabled = true;
      btnRefreshUsers.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>';
      await loadAdminUsers();
      btnRefreshUsers.disabled = false;
      btnRefreshUsers.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Refresh';
      showToast('User ledger refreshed.', 'success');
    });
  }

  // Expenses Audit Filter
  const auditSearch = document.getElementById('auditSearchInput');
  const auditCategory = document.getElementById('auditCategoryFilter');
  const auditPayment = document.getElementById('auditPaymentFilter');
  const btnRefreshAudit = document.getElementById('btnRefreshAudit');

  function applyAuditFilters() {
    const query = (auditSearch ? auditSearch.value : '').toLowerCase().trim();
    const cat = auditCategory ? auditCategory.value : '';
    const pay = auditPayment ? auditPayment.value : '';

    const filtered = allAdminExpenses.filter(e => {
      const user = e.user || {};
      const matchQuery = !query ||
        (e.title && e.title.toLowerCase().includes(query)) ||
        (e.description && e.description.toLowerCase().includes(query)) ||
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query));
      const matchCat = !cat || e.category === cat;
      const matchPay = !pay || e.paymentMethod === pay;
      return matchQuery && matchCat && matchPay;
    });

    renderAdminExpensesTable(filtered);
  }

  if (auditSearch) auditSearch.addEventListener('input', applyAuditFilters);
  if (auditCategory) auditCategory.addEventListener('change', applyAuditFilters);
  if (auditPayment) auditPayment.addEventListener('change', applyAuditFilters);
  if (btnRefreshAudit) {
    btnRefreshAudit.addEventListener('click', async () => {
      btnRefreshAudit.disabled = true;
      btnRefreshAudit.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>';
      await loadAdminExpenses();
      btnRefreshAudit.disabled = false;
      btnRefreshAudit.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Refresh';
      showToast('Platform expense audit refreshed.', 'success');
    });
  }
}

/**
 * 1-Click Database Backup Handlers
 */
function setupBackupHandlers() {
  const triggerBackup = async () => {
    try {
      const token = getToken();
      showToast('Preparing full database snapshot...', 'info');

      const res = await fetch(`${API_BASE_URL}/api/admin/backup`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expensetrack_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        showToast('Database backup downloaded successfully!', 'success');
      } else {
        showToast('Failed to generate backup.', 'danger');
      }
    } catch (err) {
      showToast(err.message || 'Error downloading database backup.', 'danger');
    }
  };

  const btnExportTop = document.getElementById('btnExportBackupTop');
  const btnDownloadMain = document.getElementById('btnDownloadBackup');
  const btnQuickBackup = document.getElementById('btnQuickDownloadBackup');

  if (btnExportTop) btnExportTop.addEventListener('click', triggerBackup);
  if (btnDownloadMain) btnDownloadMain.addEventListener('click', triggerBackup);
  if (btnQuickBackup) btnQuickBackup.addEventListener('click', triggerBackup);
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
