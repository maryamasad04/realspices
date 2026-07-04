// lib/backendApi.js

// Generic backend fetch utility
export async function backendFetch(endpoint, options = {}) {
  // Default to same-origin (no base) so internal Next.js API routes are used
  // If an external backend is required, set `NEXT_PUBLIC_BACKEND_URL` to its origin (e.g. https://api.example.com)
  const baseUrl = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_BACKEND_URL)
    ? process.env.NEXT_PUBLIC_BACKEND_URL
    : ''; // empty string -> use same origin + endpoint (e.g. `/api/...`)

  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}), // Prevents crash if headers is undefined
  };

  // Add Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers,
      ...options,
    });

    // Read response text so we can include server message for debugging
    const text = await response.text();

    if (!response.ok) {
      // Try to parse JSON error body, otherwise include raw text
      let serverMessage = response.statusText || '';
      if (text) {
        try {
          const json = JSON.parse(text);
          serverMessage = json.error || json.message || JSON.stringify(json);
        } catch (e) {
          serverMessage = text;
        }
      }
      // Sanitize sensitive backend errors (Prisma/DB connection details)
      const lower = String(serverMessage).toLowerCase();
      if (
        response.status >= 500 &&
        (
          lower.includes('prisma') ||
          lower.includes("can't reach database") ||
          lower.includes('connection refused') ||
          lower.includes('connection timed out') ||
          lower.includes('database server')
        )
      ) {
        throw new Error('Backend error: 500 Internal server error (database unreachable)');
      }

      throw new Error(`Backend error: ${response.status} ${serverMessage}`);
    }

    try {
      return text ? JSON.parse(text) : {};
    } catch (e) {
      return text;
    }
  } catch (err) {
    // Network-level errors (DNS, CORS, refused connection, etc.) will be caught here
    const msg = err && err.message ? err.message : String(err);
    // Provide actionable message for debugging and suggested steps
    const adviceBase = baseUrl || 'this frontend origin';
    const advice = `Ensure your backend is running at ${adviceBase} and accepts requests from this origin.`;
    throw new Error(`Network error fetching ${baseUrl}${endpoint}: ${msg}. ${advice} If your backend runs on a different URL, set NEXT_PUBLIC_BACKEND_URL in your frontend environment.`);
  }
}

// Signup API call
export function signup(userData) {
  return backendFetch('/api/auth/signup', {  // ✅ CHANGED: Added /auth
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

// Login API call
export function login(credentials) {
  return backendFetch('/api/auth/login', {  // ✅ CHANGED: Added /auth
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

// Get profile API call (requires JWT)
export function getProfile(token) {
  return backendFetch('/api/auth/profile', {  // ✅ CHANGED: Added /auth
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
