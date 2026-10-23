/* ============================================================
   NETFIX AI — App (converted from frontend/src/App.tsx)
   Client-side router + all event wiring for landing & auth.
   ============================================================ */

const C = window.NETFIX_COMPONENTS;
const D = window.NETFIX_DATA;
const A = window.NETFIX_AUTH;

/* ---------- App state ---------- */
const state = {
  currentPath: window.location.pathname,
  selectedRole: null,
  maskedContact: 't***@example.com',
  authenticatedRole: (() => {
    const saved = localStorage.getItem('netfix_auth_role');
    if (saved) return D.USER_ROLES.find((r) => r.id === saved) || null;
    return null;
  })(),
};

const root = document.getElementById('app');

/* ---------- Role resolution from path ---------- */
function resolveRoleFromPath(path) {
  const map = {
    '/employee': 'employee', '/management': 'management', '/advocate': 'advocate',
    '/client': 'client', '/tenant': 'tenant-vendor', '/regulator': 'regulator', '/admin': 'admin',
    '/dashboard/employee': 'employee', '/dashboard/management': 'management', '/dashboard/advocate': 'advocate',
    '/dashboard/client': 'client', '/dashboard/tenant': 'tenant-vendor', '/dashboard/regulator': 'regulator', '/dashboard/admin': 'admin',
  };
  for (const [prefix, id] of Object.entries(map)) {
    if (path.startsWith(prefix)) return D.USER_ROLES.find((r) => r.id === id) || null;
  }
  return null;
}

/* ---------- Navigation ---------- */
function navigate(path) {
  window.history.pushState({}, '', path);
  state.currentPath = path;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
}

function handleAuthenticatedSuccess(role, userEmail) {
  state.authenticatedRole = role;
  localStorage.setItem('netfix_auth_role', role.id);
  if (userEmail) state.maskedContact = userEmail;
  navigate(role.dashboardRoute);
}

function handleLogout() {
  state.authenticatedRole = null;
  localStorage.removeItem('netfix_auth_role');
  navigate('/');
}

/* ---------- Render ---------- */
function render() {
  const path = state.currentPath;
  const matchedRoleFromRoute = resolveRoleFromPath(path);
  const isDashboardOrRoleRoute = path.startsWith('/dashboard') || matchedRoleFromRoute !== null;

  if (isDashboardOrRoleRoute) {
    const targetRole = matchedRoleFromRoute || state.authenticatedRole || state.selectedRole || D.USER_ROLES.find((r) => r.id === 'client');
    root.innerHTML = dashboardPlaceholder(targetRole);
    C.refreshIcons();
    wireDashboard();
    return;
  }

  const isAuthRoute = ['/role-selection', '/login', '/register', '/login/otp', '/register/otp'].includes(path);
  if (isAuthRoute) {
    root.innerHTML = A.authPage(path, state.selectedRole, state.maskedContact);
    C.refreshIcons();
    wireAuth(path);
    return;
  }

  // Landing page
  root.innerHTML = C.landingPage();
  C.refreshIcons();
  C.attachTilt(root);
  wireLanding();
}

/* ---------- Dashboard placeholder (Phase 2+) ---------- */
function dashboardPlaceholder(role) {
  return `
    <div class="min-h-screen bg-[#050B14] text-slate-100 flex flex-col font-sans relative">
      <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <div class="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#050B14] to-[#081525]"></div>
        <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(0,163,255,0.12),transparent_70%)] blur-3xl"></div>
      </div>
      <header class="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        ${C.brandLogo('md')}
        <div class="flex items-center gap-3">
          <span class="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00B8FF]/10 border border-[#00B8FF]/30 text-xs font-semibold text-[#00B8FF]">${role.title}</span>
          <button id="dash-logout" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-all">${C.icon('log-out', 'w-4 h-4')}<span>Logout</span></button>
        </div>
      </header>
      <main class="relative z-10 flex-1 flex items-center justify-center px-4">
        <div class="w-full max-w-lg p-8 rounded-3xl bg-[#04121F]/85 border border-[#00B8FF]/35 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,184,255,0.14)] text-center space-y-4">
          <div class="w-14 h-14 rounded-2xl bg-[#00B8FF]/15 border border-[#00B8FF]/40 flex items-center justify-center text-[#00B8FF] mx-auto">${C.icon('layout-dashboard', 'w-7 h-7')}</div>
          <h1 class="text-2xl font-extrabold text-white tracking-tight">${role.title} Dashboard</h1>
          <p class="text-sm text-slate-300">
            You're signed in as <span class="text-[#00B8FF] font-semibold">${role.title}</span>.
            This role workspace is part of the next conversion phase — the landing page, authentication,
            and role routing are fully live and wired to the real backend.
          </p>
          <div class="pt-2">
            <button id="dash-home" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#00B8FF] hover:bg-[#0098D4] shadow-[0_0_20px_rgba(0,184,255,0.35)] transition-all inline-flex items-center gap-2">${C.icon('home', 'w-4 h-4')}<span>Back to Home</span></button>
          </div>
        </div>
      </main>
    </div>`;
}

function wireDashboard() {
  const logout = document.getElementById('dash-logout');
  if (logout) logout.addEventListener('click', () => window.authService.logout().then(handleLogout));
  const home = document.getElementById('dash-home');
  if (home) home.addEventListener('click', () => navigate('/'));
}

/* ---------- Landing event wiring ---------- */
function wireLanding() {
  // Navbar scroll effect
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 20) {
      navbar.className = 'fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#050B14]/85 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/40 py-3.5';
    } else {
      navbar.className = 'fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#050B14]/40 backdrop-blur-md border-b border-white/5 py-4 sm:py-5';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Nav links (smooth scroll)
  root.querySelectorAll('[data-nav-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const href = a.getAttribute('data-nav-link');
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      const menu = document.getElementById('mobile-menu');
      if (menu) menu.classList.add('hidden');
    });
  });

  // Mobile menu toggle
  const menuBtn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
      const open = menu.classList.toggle('hidden');
      menuBtn.setAttribute('aria-expanded', String(!open));
    });
  }

  // Generic route buttons
  root.querySelectorAll('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const menu = document.getElementById('mobile-menu');
      if (menu) menu.classList.add('hidden');
      navigate(btn.getAttribute('data-goto'));
    });
  });

  // Smooth-scroll buttons
  root.querySelectorAll('[data-scroll]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const el = document.querySelector(btn.getAttribute('data-scroll'));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Role cards on landing -> select role + go to login
  root.querySelectorAll('#roles [data-card-click]').forEach((card) => {
    card.addEventListener('click', () => {
      // find role by matching the card's title text
      const title = card.querySelector('h3');
      if (!title) return;
      const role = D.USER_ROLES.find((r) => r.title === title.textContent.trim());
      if (role) {
        state.selectedRole = role;
        navigate('/login');
      }
    });
  });

  // FAQ accordion
  root.querySelectorAll('[data-faq-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-faq-toggle');
      const answer = document.getElementById(`faq-answer-${id}`);
      const iconWrap = btn.querySelector('.faq-icon');
      const isOpen = answer && !answer.classList.contains('hidden');
      if (answer) answer.classList.toggle('hidden');
      if (iconWrap) iconWrap.innerHTML = isOpen ? C.icon('plus', 'w-3.5 h-3.5') : C.icon('minus', 'w-3.5 h-3.5 text-sky-400');
      C.refreshIcons();
    });
  });

  // Contact copy
  root.querySelectorAll('[data-contact]').forEach((card) => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-contact');
      const item = D.CONTACT_ITEMS.find((c) => c.type === type);
      const label = card.querySelector('.inline-flex');
      if (type === 'phone' || type === 'email') {
        navigator.clipboard && navigator.clipboard.writeText(item.value);
        if (label) label.innerHTML = `${C.icon('check', 'w-3 h-3 text-emerald-400')}<span class="text-emerald-400">Copied to clipboard</span>`;
      } else {
        if (label) label.innerHTML = `${C.icon('check', 'w-3 h-3 text-emerald-400')}<span class="text-emerald-400">Initiating connect...</span>`;
      }
      C.refreshIcons();
      setTimeout(() => location.reload(), 2000);
    });
  });

  // Footer links
  root.querySelectorAll('[data-footer-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const href = a.getAttribute('data-href');
      const isRoute = a.getAttribute('data-route') === 'true';
      if (isRoute) navigate(href);
      else if (href === '#privacy' || href === '#terms') {
        const modal = document.getElementById('policy-modal');
        const title = document.getElementById('policy-modal-title');
        if (title) title.textContent = href === '#privacy' ? 'Privacy Policy' : 'Terms of Service';
        if (modal) modal.classList.remove('hidden');
        C.refreshIcons();
      } else {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Policy modal close
  ['policy-modal-close', 'policy-modal-close2'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => {
      const modal = document.getElementById('policy-modal');
      if (modal) modal.classList.add('hidden');
    });
  });
}

/* ---------- Auth event wiring ---------- */
function wireAuth(path) {
  // Role selection
  root.querySelectorAll('[data-role-card]').forEach((card) => {
    const select = () => {
      const id = card.getAttribute('data-role-card');
      const role = D.USER_ROLES.find((r) => r.id === id);
      if (!role) return;
      state.selectedRole = role;
      // re-render to reflect selection
      render();
    };
    card.addEventListener('click', select);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
    });
  });

  const continueBtn = document.getElementById('role-continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      if (!state.selectedRole) {
        const err = document.getElementById('role-prompt-error');
        if (err) err.classList.remove('hidden');
        return;
      }
      navigate('/login');
    });
  }

  // Quick guide modal
  const openGuide = document.getElementById('open-quick-guide');
  if (openGuide) openGuide.addEventListener('click', () => {
    const m = document.getElementById('quick-guide-modal');
    if (m) { m.classList.remove('hidden'); C.refreshIcons(); }
  });
  ['quick-guide-close', 'quick-guide-close2'].forEach((id) => {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', () => {
      const m = document.getElementById('quick-guide-modal');
      if (m) m.classList.add('hidden');
    });
  });

  // ---- Login form ----
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const pw = document.getElementById('login-password');
    const togglePw = document.getElementById('toggle-login-pw');
    if (togglePw) togglePw.addEventListener('click', () => {
      pw.type = pw.type === 'password' ? 'text' : 'password';
      togglePw.innerHTML = C.icon(pw.type === 'password' ? 'eye' : 'eye-off', 'w-4 h-4');
      C.refreshIcons();
    });
    document.getElementById('forgot-pw').addEventListener('click', () => {
      const err = document.getElementById('login-error');
      err.textContent = 'Please contact system administrator to reset password.';
      err.classList.remove('hidden');
    });
    document.getElementById('change-role-login').addEventListener('click', () => navigate('/role-selection'));
    document.getElementById('go-register').addEventListener('click', () => navigate('/register'));

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('login-error');
      err.classList.add('hidden');
      const submit = document.getElementById('login-submit');
      submit.disabled = true;
      submit.innerHTML = `${C.icon('loader-2', 'w-4 h-4 animate-spin text-white')}<span>Verifying...</span>`;
      C.refreshIcons();
      try {
        const res = await window.authService.login({
          email: document.getElementById('login-email').value,
          password: pw.value,
        });
        if (res.success && res.maskedContact) {
          state.maskedContact = res.maskedContact;
          navigate('/login/otp');
        }
      } catch (e2) {
        err.textContent = e2.message || 'The email or password is incorrect.';
        err.classList.remove('hidden');
      } finally {
        submit.disabled = false;
        submit.innerHTML = `<span>Next</span>${C.icon('arrow-right', 'w-4 h-4')}`;
        C.refreshIcons();
      }
    });

    // Demo modal
    const openDemo = document.getElementById('open-demo-modal');
    if (openDemo) openDemo.addEventListener('click', () => {
      const creds = A.getDemoCredentialsForRole(state.selectedRole.id);
      document.getElementById('demo-email').value = creds.email;
      document.getElementById('demo-password').value = creds.password;
      const m = document.getElementById('demo-modal');
      m.classList.remove('hidden');
      C.refreshIcons();
    });
    const closeDemo = document.getElementById('close-demo-modal');
    if (closeDemo) closeDemo.addEventListener('click', () => document.getElementById('demo-modal').classList.add('hidden'));
    root.querySelectorAll('[data-copy-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.getAttribute('data-copy-target'));
        navigator.clipboard && navigator.clipboard.writeText(target.value);
        btn.innerHTML = C.icon('check', 'w-4 h-4 text-emerald-400');
        C.refreshIcons();
        setTimeout(() => { btn.innerHTML = C.icon('copy', 'w-4 h-4'); C.refreshIcons(); }, 2000);
      });
    });
    const demoForm = document.getElementById('demo-form');
    demoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('demo-error');
      err.classList.add('hidden');
      const submit = document.getElementById('demo-submit');
      submit.disabled = true;
      submit.innerHTML = `${C.icon('loader-2', 'w-4 h-4 animate-spin text-white')}<span>Authenticating...</span>`;
      C.refreshIcons();
      try {
        const res = await window.authService.demoLogin(
          document.getElementById('demo-email').value,
          document.getElementById('demo-password').value,
          state.selectedRole.id
        );
        if (res.success) {
          document.getElementById('demo-modal').classList.add('hidden');
          handleAuthenticatedSuccess(state.selectedRole, res.user && res.user.email);
        }
      } catch (e2) {
        err.textContent = e2.message || 'Demo authentication failed. Please verify credentials.';
        err.classList.remove('hidden');
      } finally {
        submit.disabled = false;
        submit.innerHTML = `<span>Login</span>${C.icon('arrow-right', 'w-4 h-4')}`;
        C.refreshIcons();
      }
    });
  }

  // ---- Registration form ----
  const regForm = document.getElementById('register-form');
  if (regForm) {
    const toggle = (btnId, inputId) => {
      const b = document.getElementById(btnId);
      const i = document.getElementById(inputId);
      if (b) b.addEventListener('click', () => {
        i.type = i.type === 'password' ? 'text' : 'password';
        b.innerHTML = C.icon(i.type === 'password' ? 'eye' : 'eye-off', 'w-4 h-4');
        C.refreshIcons();
      });
    };
    toggle('toggle-reg-pw', 'reg-password');
    toggle('toggle-reg-cpw', 'reg-confirmpassword');
    document.getElementById('change-role-reg').addEventListener('click', () => navigate('/role-selection'));
    document.getElementById('go-login').addEventListener('click', () => navigate('/login'));

    const sameAddr = document.getElementById('reg-same-addr');
    const permAddr = document.getElementById('reg-permanent-addr');
    const tempAddr = document.getElementById('reg-temp-addr');
    sameAddr.addEventListener('change', () => {
      tempAddr.disabled = sameAddr.checked;
      tempAddr.classList.toggle('opacity-60', sameAddr.checked);
      tempAddr.classList.toggle('cursor-not-allowed', sameAddr.checked);
      tempAddr.value = sameAddr.checked ? permAddr.value : '';
    });
    permAddr.addEventListener('input', () => {
      if (sameAddr.checked) tempAddr.value = permAddr.value;
    });

    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const gErr = document.getElementById('reg-error');
      gErr.classList.add('hidden');
      // clear field errors
      ['firstName', 'lastName', 'dob', 'email', 'phone', 'permanentAddress', 'password', 'confirmPassword'].forEach((k) => {
        const el = document.getElementById('err-' + k);
        if (el) { el.classList.add('hidden'); el.textContent = ''; }
      });

      const fd = {
        firstName: document.getElementById('reg-firstname').value,
        middleName: document.getElementById('reg-middlename').value,
        lastName: document.getElementById('reg-lastname').value,
        dob: document.getElementById('reg-dob').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value,
        permanentAddress: permAddr.value,
        temporaryAddress: tempAddr.value,
        password: document.getElementById('reg-password').value,
        confirmPassword: document.getElementById('reg-confirmpassword').value,
        role: state.selectedRole.id,
      };

      const newErrors = {};
      if (!fd.firstName.trim()) newErrors.firstName = 'First Name is required.';
      if (!fd.lastName.trim()) newErrors.lastName = 'Last Name is required.';
      if (!fd.dob) newErrors.dob = 'Date of Birth is required.';
      if (!fd.email || !fd.email.includes('@')) newErrors.email = 'Enter a valid email address.';
      if (!fd.phone || fd.phone.trim().length < 7) newErrors.phone = 'Enter a valid phone number.';
      if (!fd.permanentAddress.trim()) newErrors.permanentAddress = 'Permanent Address is required.';
      if (!fd.password) newErrors.password = 'Password is required.';
      if (fd.password !== fd.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';

      if (Object.keys(newErrors).length > 0) {
        Object.entries(newErrors).forEach(([k, msg]) => {
          const el = document.getElementById('err-' + k);
          if (el) { el.textContent = msg; el.classList.remove('hidden'); }
        });
        return;
      }

      const submit = document.getElementById('reg-submit');
      submit.disabled = true;
      submit.innerHTML = `${C.icon('loader-2', 'w-4 h-4 animate-spin text-white')}<span>Processing Registration...</span>`;
      C.refreshIcons();
      try {
        const res = await window.authService.register(fd);
        if (res.success && res.maskedContact) {
          state.maskedContact = res.maskedContact;
          navigate('/register/otp');
        }
      } catch (e2) {
        gErr.textContent = e2.message || 'Registration failed. Please check your entries.';
        gErr.classList.remove('hidden');
      } finally {
        submit.disabled = false;
        submit.innerHTML = `<span>Next</span>${C.icon('arrow-right', 'w-4 h-4')}`;
        C.refreshIcons();
      }
    });
  }

  // ---- OTP verification ----
  const otpForm = document.getElementById('otp-form');
  if (otpForm) {
    const boxes = Array.from(root.querySelectorAll('[data-otp-box]'));
    boxes.forEach((box, idx) => {
      box.addEventListener('input', (e) => {
        const digit = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = digit.slice(-1);
        if (digit && idx < 5) boxes[idx + 1].focus();
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && idx > 0) boxes[idx - 1].focus();
      });
      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        for (let i = 0; i < data.length; i++) boxes[i].value = data[i];
        boxes[Math.min(data.length, 5)].focus();
      });
    });
    boxes[0] && boxes[0].focus();

    // 60s countdown
    let timerSeconds = 59;
    let timerActive = true;
    const timerLabel = document.getElementById('otp-timer-label');
    const timerEl = document.getElementById('otp-timer');
    const resendBtn = document.getElementById('otp-resend');
    const formatTimer = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    const tick = setInterval(() => {
      if (timerActive && timerSeconds > 0) {
        timerSeconds--;
        const cur = document.getElementById('otp-timer');
        if (cur) cur.textContent = formatTimer(timerSeconds);
      } else if (timerSeconds === 0) {
        timerActive = false;
        if (timerLabel) timerLabel.innerHTML = '<span class="text-rose-400 font-medium">Code expired</span>';
        resendBtn.disabled = false;
        resendBtn.className = 'inline-flex items-center gap-1 font-semibold transition-colors text-sky-400 hover:text-sky-300 cursor-pointer underline underline-offset-2';
      }
    }, 1000);

    document.getElementById('otp-back').addEventListener('click', () => {
      clearInterval(tick);
      navigate(path === '/login/otp' ? '/login' : '/register');
    });

    resendBtn.addEventListener('click', async () => {
      const err = document.getElementById('otp-error');
      const success = document.getElementById('otp-resend-success');
      err.classList.add('hidden');
      success.classList.add('hidden');
      try {
        await window.authService.resendOtp(state.maskedContact, path === '/login/otp' ? 'login' : 'registration');
        boxes.forEach((b) => (b.value = ''));
        timerSeconds = 59;
        timerActive = true;
        resendBtn.disabled = true;
        resendBtn.className = 'inline-flex items-center gap-1 font-semibold transition-colors text-slate-500 cursor-not-allowed';
        if (timerLabel) timerLabel.innerHTML = `Code expires in <span id="otp-timer" class="font-mono font-bold text-sky-400">00:59</span>`;
        success.textContent = 'New verification code sent.';
        success.classList.remove('hidden');
        boxes[0].focus();
        setTimeout(() => success.classList.add('hidden'), 3000);
      } catch (e2) {
        err.textContent = 'Failed to resend code. Please try again.';
        err.classList.remove('hidden');
      }
    });

    otpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('otp-error');
      err.classList.add('hidden');
      const code = boxes.map((b) => b.value).join('');
      if (code.length < 6) {
        err.textContent = 'Enter the complete 6-digit verification code.';
        err.classList.remove('hidden');
        return;
      }
      const submit = document.getElementById('otp-submit');
      submit.disabled = true;
      submit.innerHTML = `${C.icon('loader-2', 'w-4 h-4 animate-spin text-white')}<span>Verifying...</span>`;
      C.refreshIcons();
      try {
        const res = await window.authService.verifyOtp(code, path === '/login/otp' ? 'login' : 'registration', state.maskedContact);
        if (res.success) {
          clearInterval(tick);
          handleAuthenticatedSuccess(state.selectedRole);
        }
      } catch (e2) {
        err.textContent = e2.message || 'The verification code is incorrect. Please try again.';
        err.classList.remove('hidden');
      } finally {
        submit.disabled = false;
        submit.innerHTML = '<span>Verify &amp; Continue</span>';
        C.refreshIcons();
      }
    });
  }
}

/* ---------- Popstate ---------- */
window.addEventListener('popstate', () => {
  state.currentPath = window.location.pathname;
  render();
});

/* ---------- Init ---------- */
render();