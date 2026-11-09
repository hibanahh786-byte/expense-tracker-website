const http = require('http');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE ENDPOINT VERIFICATION ---');
  let token = '';
  let createdExpenseId = '';

  // 1. Verify HTML pages
  const pages = [
    '/',
    '/register.html',
    '/login.html',
    '/dashboard.html',
    '/add-expense.html',
    '/expenses.html',
    '/edit-expense.html',
    '/reports.html',
    '/profile.html'
  ];

  for (const p of pages) {
    const res = await request(p);
    if (res.statusCode === 200 && res.data.length > 500) {
      console.log(`✓ Page [${p}] loaded successfully (HTTP 200, ${res.data.length} bytes)`);
    } else {
      console.error(`✗ Page [${p}] failed with status ${res.statusCode}`);
      process.exit(1);
    }
  }

  // 2. Test User Registration
  const testEmail = `student_${Date.now()}@test.com`;
  const regRes = await request('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      name: 'Rohan Verma',
      email: testEmail,
      password: 'Password@123',
      currency: '₹'
    }
  });

  if (regRes.statusCode === 201 && regRes.json.success && regRes.json.token) {
    console.log(`✓ POST /register: Successfully registered ${testEmail} with JWT token`);
  } else {
    console.error('✗ POST /register failed:', regRes.json || regRes.data);
    process.exit(1);
  }

  // 3. Test User Login with Demo Account
  const loginRes = await request('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      email: 'demo@expensetracker.com',
      password: 'Password@123'
    }
  });

  if (loginRes.statusCode === 200 && loginRes.json.success && loginRes.json.token) {
    token = loginRes.json.token;
    console.log(`✓ POST /login: Successfully authenticated demo user (Token received)`);
  } else {
    console.error('✗ POST /login failed:', loginRes.json || loginRes.data);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 4. Test GET /expenses
  const expRes = await request('/expenses', { headers: authHeaders });
  if (expRes.statusCode === 200 && expRes.json.success) {
    console.log(`✓ GET /expenses: Retrieved ${expRes.json.count} expenses (Total: ${expRes.json.total})`);
  } else {
    console.error('✗ GET /expenses failed:', expRes.json);
    process.exit(1);
  }

  // 5. Test GET /expenses with category filter
  const catFilterRes = await request('/expenses?category=Food', { headers: authHeaders });
  if (catFilterRes.statusCode === 200 && catFilterRes.json.expenses.every((e) => e.category === 'Food')) {
    console.log(`✓ GET /expenses?category=Food: Filter working (${catFilterRes.json.count} records)`);
  } else {
    console.error('✗ GET /expenses?category=Food filter failed');
    process.exit(1);
  }

  // 6. Test GET /expense/total
  const totalRes = await request('/expense/total', { headers: authHeaders });
  if (totalRes.statusCode === 200 && totalRes.json.success && typeof totalRes.json.data.totalAmount === 'number') {
    console.log(`✓ GET /expense/total: Total Amount = ₹ ${totalRes.json.data.totalAmount}, Today = ₹ ${totalRes.json.data.todayAmount}, Month = ₹ ${totalRes.json.data.monthlyAmount}`);
  } else {
    console.error('✗ GET /expense/total failed:', totalRes.json);
    process.exit(1);
  }

  // 7. Test GET /expense/monthly
  const monthRes = await request('/expense/monthly?year=2026', { headers: authHeaders });
  if (monthRes.statusCode === 200 && Array.isArray(monthRes.json.data) && monthRes.json.data.length === 12) {
    console.log(`✓ GET /expense/monthly: 12-month annual trend successfully calculated`);
  } else {
    console.error('✗ GET /expense/monthly failed:', monthRes.json);
    process.exit(1);
  }

  // 8. Test GET /expense/category
  const catBreakdownRes = await request('/expense/category', { headers: authHeaders });
  if (catBreakdownRes.statusCode === 200 && Array.isArray(catBreakdownRes.json.data)) {
    console.log(`✓ GET /expense/category: Category breakdown retrieved (${catBreakdownRes.json.data.length} categories, Grand Total: ₹ ${catBreakdownRes.json.grandTotal})`);
  } else {
    console.error('✗ GET /expense/category failed:', catBreakdownRes.json);
    process.exit(1);
  }

  // 9. Test POST /expense (Create)
  const newExpRes = await request('/expense', {
    method: 'POST',
    headers: authHeaders,
    body: {
      title: 'Cloudflare Workers Subscription',
      amount: 450,
      category: 'Bills',
      description: 'API deployment serverless hosting',
      date: new Date().toISOString(),
      paymentMethod: 'Credit Card'
    }
  });

  if (newExpRes.statusCode === 201 && newExpRes.json.success && newExpRes.json.expense) {
    createdExpenseId = newExpRes.json.expense._id;
    console.log(`✓ POST /expense: Successfully created expense (ID: ${createdExpenseId})`);
  } else {
    console.error('✗ POST /expense failed:', newExpRes.json);
    process.exit(1);
  }

  // 10. Test GET /expense/:id
  const getSingleRes = await request(`/expense/${createdExpenseId}`, { headers: authHeaders });
  if (getSingleRes.statusCode === 200 && getSingleRes.json.expense.title === 'Cloudflare Workers Subscription') {
    console.log(`✓ GET /expense/:id: Successfully fetched single expense details`);
  } else {
    console.error('✗ GET /expense/:id failed:', getSingleRes.json);
    process.exit(1);
  }

  // 11. Test PUT /expense/:id (Update)
  const updateExpRes = await request(`/expense/${createdExpenseId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: {
      title: 'Cloudflare Pro Subscription (Updated)',
      amount: 1800,
      category: 'Bills'
    }
  });

  if (updateExpRes.statusCode === 200 && updateExpRes.json.expense.amount === 1800) {
    console.log(`✓ PUT /expense/:id: Successfully updated expense amount to ₹ 1800`);
  } else {
    console.error('✗ PUT /expense/:id failed:', updateExpRes.json);
    process.exit(1);
  }

  // 12. Test DELETE /expense/:id
  const deleteExpRes = await request(`/expense/${createdExpenseId}`, {
    method: 'DELETE',
    headers: authHeaders
  });

  if (deleteExpRes.statusCode === 200 && deleteExpRes.json.success) {
    console.log(`✓ DELETE /expense/:id: Successfully deleted test expense`);
  } else {
    console.error('✗ DELETE /expense/:id failed:', deleteExpRes.json);
    process.exit(1);
  }

  // 13. Test GET /profile
  const profRes = await request('/profile', { headers: authHeaders });
  if (profRes.statusCode === 200 && profRes.json.user.email === 'demo@expensetracker.com') {
    console.log(`✓ GET /profile: Retrieved user profile (Name: ${profRes.json.user.name}, Lifetime Spend: ₹ ${profRes.json.user.totalSpent})`);
  } else {
    console.error('✗ GET /profile failed:', profRes.json);
    process.exit(1);
  }

  // 14. Test PUT /profile (Update)
  const updateProfRes = await request('/profile', {
    method: 'PUT',
    headers: authHeaders,
    body: {
      name: 'Aditya Sharma (MCA)',
      currency: '₹'
    }
  });

  if (updateProfRes.statusCode === 200 && updateProfRes.json.user.name === 'Aditya Sharma (MCA)') {
    console.log(`✓ PUT /profile: Successfully updated user display name`);
  } else {
    console.error('✗ PUT /profile failed:', updateProfRes.json);
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('  ALL 14 TEST SUITES PASSED FLAWLESSLY!               ');
  console.log('  EVERY ENDPOINT, PAGE, AND CRUD OPERATION VERIFIED! ');
  console.log('======================================================');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
