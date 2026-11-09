/**
 * Expense Tracker - Monthly Reports & Financial Analytics
 */

let reportDailyChartInstance = null;
let reportCategoryChartInstance = null;

async function initReportsPage() {
  requireAuth();
  initDashboardLayout('reports');

  setupMonthYearSelectors();
  await loadMonthlyReport();

  // Print button handler
  const btnPrint = document.getElementById('btnPrintReport');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }
}

function setupMonthYearSelectors() {
  const monthSelect = document.getElementById('reportMonth');
  const yearSelect = document.getElementById('reportYear');

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Populate Year options (current year down 5 years)
  if (yearSelect) {
    yearSelect.innerHTML = '';
    for (let y = currentYear; y >= currentYear - 4; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === currentYear) opt.selected = true;
      yearSelect.appendChild(opt);
    }
  }

  // Set current month
  if (monthSelect) {
    monthSelect.value = currentMonth;
  }

  if (monthSelect) monthSelect.addEventListener('change', loadMonthlyReport);
  if (yearSelect) yearSelect.addEventListener('change', loadMonthlyReport);
}

async function loadMonthlyReport() {
  const monthSelect = document.getElementById('reportMonth');
  const yearSelect = document.getElementById('reportYear');
  if (!monthSelect || !yearSelect) return;

  const month = parseInt(monthSelect.value, 10);
  const year = parseInt(yearSelect.value, 10);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const titleEl = document.getElementById('reportPeriodTitle');
  if (titleEl) titleEl.textContent = `${monthNames[month - 1]} ${year}`;

  try {
    // Calculate date boundaries for this month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = new Date(year, month - 1, daysInMonth).toISOString().split('T')[0];

    // Fetch expenses for this month
    const expensesRes = await apiRequest(`/expenses?startDate=${startDate}&endDate=${endDate}&limit=500`);
    const categoryRes = await apiRequest(`/expense/category?month=${month}&year=${year}`);

    const expenses = expensesRes.expenses || [];
    const categories = categoryRes.data || [];

    // Calculate Summary Metrics
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const dailyAverage = totalSpent > 0 ? (totalSpent / daysInMonth).toFixed(2) : 0;

    let highestExpense = null;
    if (expenses.length > 0) {
      highestExpense = expenses.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev));
    }

    const topCategory = categories.length > 0 ? categories[0] : null;

    // Render Metrics
    document.getElementById('reportTotalSpent').textContent = formatCurrency(totalSpent);
    document.getElementById('reportDailyAverage').textContent = formatCurrency(dailyAverage);
    document.getElementById('reportHighestExpense').textContent = highestExpense ? formatCurrency(highestExpense.amount) : formatCurrency(0);
    document.getElementById('reportHighestExpenseTitle').textContent = highestExpense ? highestExpense.title : 'None';
    document.getElementById('reportTopCategory').textContent = topCategory ? topCategory.category : 'None';
    document.getElementById('reportTopCategoryAmount').textContent = topCategory ? formatCurrency(topCategory.totalAmount) : formatCurrency(0);

    // Render Category Breakdown Bars
    renderCategoryBreakdownList(categories, totalSpent);

    // Render Charts
    renderDailyTrendChart(expenses, daysInMonth, monthNames[month - 1]);
    renderReportCategoryChart(categories);

    // Render Detailed Month Table
    renderMonthlyTransactionsTable(expenses);
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function renderCategoryBreakdownList(categories, totalSpent) {
  const container = document.getElementById('categoryBreakdownContainer');
  if (!container) return;

  if (!categories || categories.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="bi bi-inbox fs-2 text-secondary d-block mb-2"></i>
        No expenses recorded for this month.
      </div>
    `;
    return;
  }

  container.innerHTML = categories
    .map((c) => {
      const meta = CATEGORY_META[c.category] || CATEGORY_META.Others;
      return `
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="fw-semibold font-monospace">
            <i class="bi ${meta.icon} me-1" style="color: ${meta.color}"></i> ${c.category}
            <small class="text-muted fw-normal">(${c.count} txns)</small>
          </span>
          <span class="fw-bold">${formatCurrency(c.totalAmount)} <span class="badge badge-payment ms-1">${c.percentage}%</span></span>
        </div>
        <div class="progress" style="height: 8px;">
          <div class="progress-bar" role="progressbar" style="width: ${c.percentage}%; background-color: ${meta.color};" aria-valuenow="${c.percentage}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
    `;
    })
    .join('');
}

function renderDailyTrendChart(expenses, daysInMonth, monthName) {
  const ctx = document.getElementById('reportDailyChart');
  if (!ctx) return;

  if (reportDailyChartInstance) {
    reportDailyChartInstance.destroy();
  }

  // Aggregate by day of month (1..daysInMonth)
  const dayTotals = Array(daysInMonth).fill(0);
  expenses.forEach((e) => {
    const d = new Date(e.date).getDate();
    if (d >= 1 && d <= daysInMonth) {
      dayTotals[d - 1] += e.amount;
    }
  });

  const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

  reportDailyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: `Daily Spending (${monthName})`,
          data: dayTotals,
          borderColor: '#00f5a0',
          backgroundColor: 'rgba(0, 245, 160, 0.12)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#00f5a0',
          pointRadius: 3,
          pointHoverRadius: 6
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
            callback: (val) => getCurrency() + ' ' + val.toLocaleString()
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#FFFFFF' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Day ${ctx.label}: ${formatCurrency(ctx.parsed.y)}`
          }
        }
      }
    }
  });
}

function renderReportCategoryChart(categories) {
  const ctx = document.getElementById('reportCategoryChart');
  if (!ctx) return;

  if (reportCategoryChartInstance) {
    reportCategoryChartInstance.destroy();
  }

  if (!categories || categories.length === 0) {
    return;
  }

  const labels = categories.map((c) => c.category);
  const data = categories.map((c) => c.totalAmount);
  const colors = categories.map((c) => (CATEGORY_META[c.category] ? CATEGORY_META[c.category].color : '#6c757d'));

  reportCategoryChartInstance = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.map((c) => c + 'cc'),
          borderColor: '#0d1733'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          grid: { color: 'rgba(255, 255, 255, 0.08)' },
          ticks: { display: false, backdropColor: 'transparent' }
        }
      },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            color: '#FFFFFF',
            font: { family: "'Inter', sans-serif", size: 12 }
          }
        }
      }
    }
  });
}

function renderMonthlyTransactionsTable(expenses) {
  const tbody = document.getElementById('monthlyReportTableBody');
  if (!tbody) return;

  if (!expenses || expenses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No transactions found for this month.</td></tr>`;
    return;
  }

  tbody.innerHTML = expenses
    .map(
      (exp) => `
    <tr>
      <td>${formatDate(exp.date)}</td>
      <td>
        <span class="fw-semibold">${escapeHtml(exp.title)}</span>
        ${exp.description ? `<br><small style="opacity: 0.75;">${escapeHtml(exp.description)}</small>` : ''}
      </td>
      <td>${getCategoryBadge(exp.category)}</td>
      <td><span class="badge badge-payment">${escapeHtml(exp.paymentMethod || 'Cash')}</span></td>
      <td class="text-end fw-bold expense-amount-negative">-${formatCurrency(exp.amount)}</td>
    </tr>
  `
    )
    .join('');
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
