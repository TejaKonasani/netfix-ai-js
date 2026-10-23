/* ============================================================
   NETFIX AI — Auth Service
   Talks to the real backend API via a single shared request()
   helper. No offline "fake success" fallbacks: if the API is
   unreachable the user is told, never silently logged in.
   ============================================================ */

const API_BASE_URL = (window.NETFIX_CONFIG && window.NETFIX_CONFIG.API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');

/**
 * Single shared HTTP helper for the whole auth surface.
 * Performs the fetch, parses the JSON envelope, and enforces the
 * `{ success, data, error: { code, message } }` contract in one place.
 *
 * @param {string} path            API path relative to API_BASE_URL (e.g. "/auth/login")
 * @param {object} opts
 * @param {string} [opts.method]   HTTP method (default "POST")
 * @param {object} [opts.body]     JSON-serialisable request body
 * @param {string} [opts.fallback] Message used when the API returns no error text
 * @returns {Promise<object>} the `data` payload from a successful response
 */
async function request(path, { method = 'POST', body, fallback = 'Request failed.' } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    // Network failure (server down / offline). Surface it honestly — never fake success.
    throw new Error('Unable to reach the Netfix AI server. Please check your connection and try again.');
  }

  const resData = await response.json().catch(() => ({}));

  if (!response.ok || !resData.success) {
    throw new Error((resData && resData.error && resData.error.message) || fallback);
  }

  return resData.data;
}

const authService = {
  /**
   * Validate credentials for login and request Login OTP via Backend API
   */
  async login(data) {
    if (!data.email || !data.email.includes('@')) {
      throw new Error('Enter a valid email address.');
    }
    if (!data.password) {
      throw new Error('Password is required.');
    }

    const d = await request('/auth/login', {
      body: { email: data.email, password: data.password },
      fallback: 'Invalid credentials.',
    });

    return {
      success: true,
      maskedContact: d && d.maskedContact,
      message: (d && d.message) || 'Verification code sent to registered contact.',
    };
  },

  /**
   * Perform direct 6-role development Demo Login via Backend API (bypasses OTP/MFA)
   */
  async demoLogin(email, password, role) {
    if (!email || !email.includes('@')) throw new Error('Enter a valid demo email address.');
    if (!password) throw new Error('Password is required.');

    const d = await request('/auth/demo-login', {
      body: { email, password, expectedRole: role },
      fallback: 'Demo authentication failed.',
    });

    return {
      success: true,
      user: d && d.user,
      message: 'Demo login successful.',
    };
  },

  /**
   * Register a new user and request Registration OTP via Backend API
   */
  async register(data) {
    if (!data.firstName.trim()) throw new Error('First Name is required.');
    if (!data.lastName.trim()) throw new Error('Last Name is required.');
    if (!data.dob) throw new Error('Date of Birth is required.');
    if (!data.email || !data.email.includes('@')) throw new Error('Enter a valid email address.');
    if (!data.phone || data.phone.trim().length < 7) throw new Error('Enter a valid phone number.');
    if (!data.permanentAddress.trim()) throw new Error('Permanent Address is required.');
    if (!data.password) throw new Error('Password is required.');
    if (data.password !== data.confirmPassword) throw new Error('Passwords do not match.');

    const d = await request('/auth/register', {
      body: {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        dob: data.dob,
        email: data.email,
        phone: data.phone,
        permanentAddress: data.permanentAddress,
        temporaryAddress: data.temporaryAddress,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: data.role,
      },
      fallback: 'Registration failed.',
    });

    return {
      success: true,
      maskedContact: d && d.maskedContact,
      message: (d && d.message) || 'Verification code sent to your email address.',
    };
  },

  /**
   * Verify OTP code for both login and registration via Backend API
   */
  async verifyOtp(otp, mode, email = '') {
    if (!otp || otp.length < 6) {
      throw new Error('Enter the complete 6-digit verification code.');
    }

    const d = await request('/auth/verify-otp', {
      body: { email: email || 'user@example.com', otp, purpose: mode },
      fallback: 'Verification code is invalid or expired.',
    });

    return {
      success: true,
      user: d && d.user,
      message: 'Verification successful.',
    };
  },

  /**
   * Request resending OTP via Backend API
   */
  async resendOtp(email = '', mode = 'login') {
    const d = await request('/auth/resend-otp', {
      body: { email: email || 'user@example.com', purpose: mode },
      fallback: 'Failed to resend verification code.',
    });

    return {
      success: true,
      message: (d && d.message) || 'New verification code sent.',
    };
  },

  /**
   * Determine authenticated user session from HttpOnly Cookie.
   * Returns null when there is no active session (a legitimate state,
   * not a fake success).
   */
  async getMe() {
    try {
      return await request('/auth/me', { method: 'GET' });
    } catch (err) {
      return null;
    }
  },

  /**
   * Logout user and invalidate HttpOnly cookie session.
   * Network errors are intentionally ignored — the local session is
   * cleared regardless of whether the server is reachable.
   */
  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (err) {
      // Ignore network error on logout
    }
  },
};

window.authService = authService;