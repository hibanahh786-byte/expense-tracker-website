/**
 * Expense Tracker - Expenses Management Script
 */

let allExpensesCache = [];
let deleteTargetId = null;

// ==========================================
// Initialization for View All Expenses Page
// ==========================================

async function initExpensesPage() {
  requireAuth();
  initDashboardLayout('expenses');

  setupFilterListeners();
  setupModalListeners();
  await loadExpenses();
}

// Load expenses with active filters
async function loadExpenses() {
  const search = document.getElementById('searchExpense')?.value || '';
  const category = document.getElementById('filterCategory')?.value || '';
  const startDate = document.getElementById('filterStartDate')?.value || '';
  const endDate = document.getElementById('filterEndDate')?.value || '';
  const sort = document.getElementById('sortExpense')?.value || 'date_desc';

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (sort) params.append('sort', sort);

  const tbody = document.getElementById('expensesTableBody');
  const emptyState = document.getElementById('expensesEmptyState');
  const countBadge = document.getElementById('expenseCountBadge');
  const totalAmountEl = document.getElementById('filteredTotalAmount');

  try {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4">
            <div class="spinner-border text-primary spinner-border-sm me-2"></div> Loading expenses...
          </td>
        </tr>
      `;
    }

    const res = await apiRequest(`/expenses?${params.toString()}`);
    if (res.success) {
      allExpensesCache = res.expenses || [];

      if (countBadge) countBadge.textContent = `${res.count} records`;

      const sumFiltered = allExpensesCache.reduce((acc, curr) => acc + curr.amount, 0);
      if (totalAmountEl) totalAmountEl.textContent = formatCurrency(sumFiltered);

      if (allExpensesCache.length === 0) {
        if (tbody) tbody.innerHTML = '';
        if (emptyState) emptyState.classList.remove('d-none');
        return;
      }

      if (emptyState) emptyState.classList.add('d-none');
      renderExpensesTable(allExpensesCache);
    }
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function renderExpensesTable(expenses) {
  const tbody = document.getElementById('expensesTableBody');
  if (!tbody) return;

  tbody.innerHTML = expenses
    .map(
      (exp, index) => `
    <tr>
      <td class="text-center opacity-75">${index + 1}</td>
      <td>
        <div class="fw-semibold">${escapeHtml(exp.title)}</div>
        ${exp.description ? `<small class="d-block text-truncate opacity-75" style="max-width: 240px;">${escapeHtml(exp.description)}</small>` : ''}
      </td>
      <td>${getCategoryBadge(exp.category)}</td>
      <td><span class="badge badge-payment">${escapeHtml(exp.paymentMethod || 'Cash')}</span></td>
      <td>${formatDate(exp.date)}</td>
      <td class="fw-bold expense-amount-negative text-end">-${formatCurrency(exp.amount)}</td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" title="View Details" onclick="viewExpenseDetails('${exp._id}')">
            <i class="bi bi-eye"></i>
          </button>
          <a href="edit-expense.html?id=${exp._id}" class="btn btn-outline-primary" title="Edit Expense">
            <i class="bi bi-pencil"></i>
          </a>
          <button class="btn btn-outline-danger" title="Delete Expense" onclick="confirmDeleteExpense('${exp._id}')">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
}

function setupFilterListeners() {
  const searchInput = document.getElementById('searchExpense');
  const categorySelect = document.getElementById('filterCategory');
  const startDateInput = document.getElementById('filterStartDate');
  const endDateInput = document.getElementById('filterEndDate');
  const sortSelect = document.getElementById('sortExpense');
  const btnReset = document.getElementById('btnResetFilters');
  const btnExport = document.getElementById('btnExportCsv');

  // Debounced search
  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadExpenses();
      }, 350);
    });
  }

  if (categorySelect) categorySelect.addEventListener('change', loadExpenses);
  if (startDateInput) startDateInput.addEventListener('change', loadExpenses);
  if (endDateInput) endDateInput.addEventListener('change', loadExpenses);
  if (sortSelect) sortSelect.addEventListener('change', loadExpenses);

  // Quick Date Range Filter presets
  const quickFilters = document.querySelectorAll('.quick-date-filter');
  quickFilters.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      quickFilters.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const preset = btn.getAttribute('data-preset');
      const now = new Date();
      if (preset === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        startDateInput.value = todayStr;
        endDateInput.value = todayStr;
      } else if (preset === 'this-month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        startDateInput.value = firstDay;
        endDateInput.value = lastDay;
      } else if (preset === 'last-30') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        startDateInput.value = d.toISOString().split('T')[0];
        endDateInput.value = now.toISOString().split('T')[0];
      } else {
        // All
        startDateInput.value = '';
        endDateInput.value = '';
      }
      loadExpenses();
    });
  });

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categorySelect) categorySelect.value = '';
      if (startDateInput) startDateInput.value = '';
      if (endDateInput) endDateInput.value = '';
      if (sortSelect) sortSelect.value = 'date_desc';
      quickFilters.forEach((b) => b.classList.remove('active'));
      const allFilter = document.querySelector('.quick-date-filter[data-preset="all"]');
      if (allFilter) allFilter.classList.add('active');
      loadExpenses();
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', exportToCsv);
  }
}

function setupModalListeners() {
  const btnConfirmDelete = document.getElementById('btnConfirmDeleteExpense');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', async () => {
      if (!deleteTargetId) return;
      try {
        const res = await apiRequest(`/expense/${deleteTargetId}`, {
          method: 'DELETE'
        });
        if (res.success) {
          showToast('Expense deleted successfully', 'success');
          const modalEl = document.getElementById('deleteConfirmModal');
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
          loadExpenses();
        }
      } catch (err) {
        showToast(err.message, 'danger');
      } finally {
        deleteTargetId = null;
      }
    });
  }
}

// View expense details in modal
window.viewExpenseDetails = function (id) {
  const exp = allExpensesCache.find((e) => e._id === id);
  if (!exp) return;

  document.getElementById('viewDetailTitle').textContent = exp.title;
  document.getElementById('viewDetailAmount').textContent = formatCurrency(exp.amount);
  document.getElementById('viewDetailCategory').innerHTML = getCategoryBadge(exp.category);
  document.getElementById('viewDetailDate').textContent = formatDate(exp.date);
  document.getElementById('viewDetailPayment').textContent = exp.paymentMethod || 'Cash';
  document.getElementById('viewDetailDescription').textContent = exp.description || 'No description provided.';
  document.getElementById('viewDetailCreated').textContent = new Date(exp.createdAt).toLocaleString();

  const modalEl = document.getElementById('expenseDetailsModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};

// Confirm delete modal
window.confirmDeleteExpense = function (id) {
  const exp = allExpensesCache.find((e) => e._id === id);
  if (!exp) return;

  deleteTargetId = id;
  document.getElementById('deleteExpenseTitle').textContent = exp.title;
  document.getElementById('deleteExpenseAmount').textContent = formatCurrency(exp.amount);

  const modalEl = document.getElementById('deleteConfirmModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};

// Export to CSV
function exportToCsv() {
  if (!allExpensesCache || allExpensesCache.length === 0) {
    showToast('No expenses to export', 'warning');
    return;
  }

  const headers = ['Title', 'Amount', 'Currency', 'Category', 'Date', 'Payment Method', 'Description'];
  const rows = allExpensesCache.map((exp) => [
    `"${exp.title.replace(/"/g, '""')}"`,
    exp.amount,
    `"${getCurrency()}"`,
    `"${exp.category}"`,
    `"${new Date(exp.date).toISOString().split('T')[0]}"`,
    `"${exp.paymentMethod || 'Cash'}"`,
    `"${(exp.description || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Expense_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Expenses exported successfully as CSV!', 'success');
}

// ==========================================
// Initialization for Add Expense Page
// ==========================================

function initAddExpensePage() {
  requireAuth();
  initDashboardLayout('add-expense');

  const form = document.getElementById('addExpenseForm');
  const dateInput = document.getElementById('expenseDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSubmitExpense');

      const title = document.getElementById('expenseTitle').value.trim();
      const amount = document.getElementById('expenseAmount').value;
      const category = document.getElementById('expenseCategory').value;
      const date = document.getElementById('expenseDate').value;
      const paymentMethod = document.getElementById('expensePayment').value;
      const description = document.getElementById('expenseDescription').value.trim();

      if (!title || !amount) {
        showToast('Please provide both Title and Amount.', 'danger');
        return;
      }

      try {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        const res = await apiRequest('/expense', {
          method: 'POST',
          body: JSON.stringify({ title, amount, category, date, paymentMethod, description })
        });

        if (res.success) {
          showToast('Expense recorded successfully!', 'success');
          form.reset();
          if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
          setTimeout(() => {
            window.location.href = 'expenses.html';
          }, 800);
        }
      } catch (err) {
        showToast(err.message, 'danger');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check2-circle me-2"></i>Save Expense';
      }
    });
  }
}

// ==========================================
// Initialization for Edit Expense Page
// ==========================================

async function initEditExpensePage() {
  requireAuth();
  initDashboardLayout('expenses');

  const urlParams = new URLSearchParams(window.location.search);
  const expenseId = urlParams.get('id');

  if (!expenseId) {
    showToast('No expense specified to edit', 'danger');
    setTimeout(() => (window.location.href = 'expenses.html'), 1000);
    return;
  }

  // Load existing expense
  try {
    const res = await apiRequest(`/expense/${expenseId}`);
    if (res.success && res.expense) {
      const exp = res.expense;
      document.getElementById('editExpenseId').value = exp._id;
      document.getElementById('editExpenseTitle').value = exp.title;
      document.getElementById('editExpenseAmount').value = exp.amount;
      document.getElementById('editExpenseCategory').value = exp.category;
      document.getElementById('editExpenseDate').value = new Date(exp.date).toISOString().split('T')[0];
      document.getElementById('editExpensePayment').value = exp.paymentMethod || 'Cash';
      document.getElementById('editExpenseDescription').value = exp.description || '';
    }
  } catch (err) {
    showToast(err.message, 'danger');
    setTimeout(() => (window.location.href = 'expenses.html'), 1500);
    return;
  }

  // Form submit handler
  const form = document.getElementById('editExpenseForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnUpdateExpense');

      const title = document.getElementById('editExpenseTitle').value.trim();
      const amount = document.getElementById('editExpenseAmount').value;
      const category = document.getElementById('editExpenseCategory').value;
      const date = document.getElementById('editExpenseDate').value;
      const paymentMethod = document.getElementById('editExpensePayment').value;
      const description = document.getElementById('editExpenseDescription').value.trim();

      try {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';

        const res = await apiRequest(`/expense/${expenseId}`, {
          method: 'PUT',
          body: JSON.stringify({ title, amount, category, date, paymentMethod, description })
        });

        if (res.success) {
          showToast('Expense updated successfully!', 'success');
          setTimeout(() => {
            window.location.href = 'expenses.html';
          }, 800);
        }
      } catch (err) {
        showToast(err.message, 'danger');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-save me-2"></i>Update Expense';
      }
    });
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
