/**
 * Expense Tracker - Dashboard Script
 */

let categoryChartInstance = null;
let monthlyChartInstance = null;

async function initDashboard() {
  requireAuth();
  initDashboardLayout('dashboard');

  await loadDashboardData();

  // Quick Add Expense Modal form submission handler
  const quickAddForm = document.getElementById('quickAddExpenseForm');
  if (quickAddForm) {
    // Set default date to today
    const dateInput = document.getElementById('quickExpenseDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    quickAddForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('quickExpenseTitle').value.trim();
      const amount = document.getElementById('quickExpenseAmount').value;
      const category = document.getElementById('quickExpenseCategory').value;
      const date = document.getElementById('quickExpenseDate').value;
      const description = document.getElementById('quickExpenseDescription').value.trim();
      const paymentMethod = document.getElementById('quickExpensePayment').value;

      try {
        const res = await apiRequest('/expense', {
          method: 'POST',
          body: JSON.stringify({ title, amount, category, date, description, paymentMethod })
        });

        if (res.success) {
          showToast('Expense added successfully!', 'success');
          // Hide modal
          const modalEl = document.getElementById('quickAddExpenseModal');
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
          quickAddForm.reset();
          if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

          // Refresh dashboard
          await loadDashboardData();
        }
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  }
}

async function loadDashboardData() {
  try {
    // Fetch summary stats
    const totalData = await apiRequest('/expense/total');
    if (totalData.success) {
      renderSummaryCards(totalData.data);
      renderRecentTransactions(totalData.data.recentExpenses || []);
    }

    // Fetch category breakdown
    const categoryData = await apiRequest('/expense/category');
    if (categoryData.success) {
      renderCategoryChart(categoryData.data || []);
    }

    // Fetch monthly breakdown
    const currentYear = new Date().getFullYear();
    const monthlyData = await apiRequest(`/expense/monthly?year=${currentYear}`);
    if (monthlyData.success) {
      renderMonthlyChart(monthlyData.data || []);
    }
  } catch (error) {
    showToast(error.message, 'danger');
  }
}

function renderSummaryCards(data) {
  const currency = getCurrency();

  const totalEl = document.getElementById('statTotalExpenses');
  if (totalEl) totalEl.textContent = formatCurrency(data.totalAmount, currency);

  const todayEl = document.getElementById('statTodayExpenses');
  if (todayEl) todayEl.textContent = formatCurrency(data.todayAmount, currency);

  const monthlyEl = document.getElementById('statMonthlyExpenses');
  if (monthlyEl) monthlyEl.textContent = formatCurrency(data.monthlyAmount, currency);

  const countEl = document.getElementById('statTotalTransactions');
  if (countEl) countEl.textContent = data.totalTransactions || 0;
}

function renderRecentTransactions(transactions) {
  const tbody = document.getElementById('recentTransactionsBody');
  const emptyState = document.getElementById('recentTransactionsEmpty');
  if (!tbody) return;

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('d-none');
    return;
  }

  if (emptyState) emptyState.classList.add('d-none');

  tbody.innerHTML = transactions
    .map(
      (tx) => `
    <tr>
      <td>
        <div class="fw-semibold">${escapeHtml(tx.title)}</div>
        <small style="opacity: 0.75;">${escapeHtml(tx.description || '-')}</small>
      </td>
      <td>${getCategoryBadge(tx.category)}</td>
      <td><span class="badge badge-payment">${escapeHtml(tx.paymentMethod || 'Cash')}</span></td>
      <td>${formatDate(tx.date)}</td>
      <td class="text-end fw-bold expense-amount-negative">-${formatCurrency(tx.amount)}</td>
    </tr>
  `
    )
    .join('');
}

function renderCategoryChart(categories) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  if (!categories || categories.length === 0) {
    ctx.parentElement.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-pie-chart fs-1 d-block mb-2 text-secondary"></i>
        <p class="mb-0">No expense records yet to plot category distribution.</p>
      </div>
    `;
    return;
  }

  const labels = categories.map((c) => c.category);
  const data = categories.map((c) => c.totalAmount);
  const colors = categories.map((c) => (CATEGORY_META[c.category] ? CATEGORY_META[c.category].color : '#6c757d'));

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#0d1733'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15,
            color: '#FFFFFF',
            font: { family: "'Inter', sans-serif", size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const val = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((val / total) * 100).toFixed(1);
              return ` ${context.label}: ${formatCurrency(val)} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '68%'
    }
  });
}

function renderMonthlyChart(monthlyData) {
  const ctx = document.getElementById('monthlyChart');
  if (!ctx) return;

  if (monthlyChartInstance) {
    monthlyChartInstance.destroy();
  }

  const labels = monthlyData.map((m) => m.month);
  const data = monthlyData.map((m) => m.total);

  monthlyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Expenses',
          data,
          backgroundColor: 'rgba(0, 245, 160, 0.75)',
          hoverBackgroundColor: '#00f5a0',
          borderRadius: 6,
          barPercentage: 0.6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.08)' },
          ticks: {
            color: '#FFFFFF',
            callback: function (value) {
              return getCurrency() + ' ' + value.toLocaleString();
            },
            font: { family: "'Inter', sans-serif" }
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#FFFFFF', font: { family: "'Inter', sans-serif" } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return ` Spending: ${formatCurrency(context.parsed.y)}`;
            }
          }
        }
      }
    }
  });
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
