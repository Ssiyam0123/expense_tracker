interface TestResult {
  name: string;
  url: string;
  status: "PASSED" | "FAILED";
  statusCode?: number;
  error?: string;
  details?: any;
}

const EXPRESS_BASE = "http://localhost:5000";
const WEB_BASE = "http://localhost:3000";
const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<{ url: string; details?: any }>) {
  let url = "";
  try {
    const res = await fn();
    url = res.url;
    results.push({
      name,
      url: res.url,
      status: "PASSED",
      statusCode: 200,
      details: res.details,
    });
    console.log(`[PASSED] ${name}`);
  } catch (err: any) {
    results.push({
      name,
      url: url || err.url || "",
      status: "FAILED",
      statusCode: err.status || 500,
      error: err.message || "Request failed",
      details: err.details || null,
    });
    console.log(`[FAILED] ${name}: ${err.message}`);
  }
}

async function fetchJson(url: string, options: RequestInit = {}): Promise<{ url: string; details: any; status: number }> {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers as any || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  let details = null;
  try {
    details = JSON.parse(text);
  } catch {
    details = text;
  }

  if (!res.ok) {
    const errorObj = new Error(details?.error?.message || `HTTP error ${res.status}`);
    (errorObj as any).status = res.status;
    (errorObj as any).details = details;
    (errorObj as any).url = url;
    throw errorObj;
  }

  return { url, details, status: res.status };
}

async function verify() {
  console.log("Starting API Audit and Integration Verification...\n");

  // Test 1: Express Health Check
  await runTest("Express Backend Health Check", async () => {
    const { url, details } = await fetchJson(`${EXPRESS_BASE}/api/health`);
    return { url, details };
  });

  // Test 2: Next.js Web Health Check
  await runTest("Web Frontend (Next.js) Health Check", async () => {
    const { url, details } = await fetchJson(`${WEB_BASE}/api/health`);
    return { url, details };
  });

  // Generate unique test credentials
  const testEmail = `tester-${Date.now()}@example.com`;
  const testPassword = "Password123!";
  const testName = "API Test User";
  let authToken = "";

  // Test 3: Express User Signup
  await runTest("Express Direct Signup", async () => {
    const { url, details } = await fetchJson(`${EXPRESS_BASE}/api/auth/signup`, {
      method: "POST",
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
    });
    authToken = details?.data?.token;
    return { url, details };
  });

  // Test 4: Express User Login
  await runTest("Express Direct Login", async () => {
    const { url, details } = await fetchJson(`${EXPRESS_BASE}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    return { url, details };
  });

  if (!authToken) {
    console.error("Could not obtain auth token. Skipping authenticated routes.");
    printReport();
    return;
  }

  // Setup headers for authenticated requests
  const authHeaders = {
    Authorization: `Bearer ${authToken}`,
  };

  let categoryId = "";
  // Test 5: Create Category
  await runTest("Express Create Category", async () => {
    const { url, details } = await fetchJson(`${EXPRESS_BASE}/api/v1/categories`, {
      method: "POST",
      body: JSON.stringify({
        name: "Food & Drinks",
        icon: "🍔",
        color: "#ff9900",
        type: "expense",
      }),
      headers: authHeaders,
    });
    categoryId = details?.data?._id || details?.data?.id;
    return { url, details };
  });

  // Test 6: List Categories
  await runTest("Express List Categories", async () => {
    const { url, details } = await fetchJson(`${EXPRESS_BASE}/api/v1/categories`, {
      headers: authHeaders,
    });
    return { url, details };
  });

  let paymentMethodId = "";
  // Test 7: Create Payment Method
  await runTest("Express Create Payment Method", async () => {
    const { url, details } = await fetchJson(`${EXPRESS_BASE}/api/v1/payment-methods`, {
      method: "POST",
      body: JSON.stringify({
        name: "Cash in Hand",
        icon: "💵",
      }),
      headers: authHeaders,
    });
    paymentMethodId = details?.data?._id || details?.data?.id;
    return { url, details };
  });

  // Test 8: List Payment Methods
  await runTest("Express List Payment Methods", async () => {
    const { url, details } = await fetchJson(`${EXPRESS_BASE}/api/v1/payment-methods`, {
      headers: authHeaders,
    });
    return { url, details };
  });

  // Test 9: Transactions Sync (Idempotent Offline Sync)
  await runTest("Express Sync Transactions (Offline Sync)", async () => {
    const { url, details } = await fetchJson(`${EXPRESS_BASE}/api/v1/transactions/sync`, {
      method: "POST",
      body: JSON.stringify({
        transactions: [
          {
            localId: `local_tx_${Date.now()}`,
            sourceDeviceId: "mobile_test_device_123",
            amountMinor: 55000, // 550.00 BDT
            currency: "BDT",
            type: "expense",
            categoryId: categoryId || "food_placeholder",
            paymentMethodId: paymentMethodId || "cash_placeholder",
            timestamp: new Date().toISOString(),
            note: "Lunch with team",
            tags: ["food", "work"],
            version: 1,
            idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
          }
        ],
      }),
      headers: authHeaders,
    });
    return { url, details };
  });

  // Test 10: List Transactions
  await runTest("Express List Transactions", async () => {
    const { url, details } = await fetchJson(`${EXPRESS_BASE}/api/v1/transactions`, {
      headers: authHeaders,
    });
    return { url, details };
  });

  // Test 11: Dashboard Summary
  await runTest("Express Get Dashboard Summary", async () => {
    const { url, details } = await fetchJson(`${EXPRESS_BASE}/api/v1/dashboard/summary`, {
      headers: authHeaders,
    });
    return { url, details };
  });

  printReport();
}

function printReport() {
  console.log("\n=================================");
  console.log("       API AUDIT REPORT");
  console.log("=================================");
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.status === "PASSED").length}`);
  console.log(`Failed: ${results.filter(r => r.status === "FAILED").length}`);
  console.log("=================================\n");

  console.log(JSON.stringify(results, null, 2));
}

verify();
