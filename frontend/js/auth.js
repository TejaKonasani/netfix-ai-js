/* ============================================================
   NETFIX AI — Auth Components (converted from frontend/src/components/auth/*.tsx)
   RoleSelection, LoginForm, RegistrationForm, OTPVerification,
   QuickGuideModal, AuthBackground, AuthHeader.
   ============================================================ */

const C = window.NETFIX_COMPONENTS;
const D = window.NETFIX_DATA;

const roleIconMap = { users: 'users', 'trending-up': 'trending-up', scale: 'scale', building: 'building-2', home: 'home', 'shield-check': 'shield-check' };

function roleIconSvg(iconName, cls) {
  return C.icon(roleIconMap[iconName] || 'users', cls);
}

/* ---------- AuthBackground ---------- */
function authBackground() {
  return `
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <div class="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#050B14] to-[#081525]"></div>
      <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(0,163,255,0.12),transparent_70%)] blur-3xl animate-pulse-slow"></div>
      <div class="absolute top-1/3 -left-48 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,210,255,0.08),transparent_70%)] blur-3xl"></div>
      <div class="absolute bottom-0 -right-48 w-[700px] h-[600px] bg-[radial-gradient(circle,rgba(0,112,243,0.1),transparent_70%)] blur-3xl"></div>
      <div class="absolute inset-0 opacity-[0.025]" style="background-image: radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px); background-size: 32px 32px;"></div>
      <div class="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#030712] to-transparent opacity-80"></div>
      <div class="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#030712] to-transparent opacity-80"></div>
    </div>`;
}

/* ---------- AuthHeader ---------- */
function authHeader() {
  return `
    <header class="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
      <div class="hover:opacity-90 transition-opacity">${C.brandLogo('md')}</div>
      <div class="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md text-xs text-slate-300 font-medium select-none">
        ${C.icon('shield-check', 'w-3.5 h-3.5 text-[#00B8FF]')}
        <span>Secure</span><span class="text-slate-600">|</span><span>Intelligent</span><span class="text-slate-600">|</span><span>Compliant</span>
      </div>
    </header>`;
}

/* ---------- QuickGuideModal ---------- */
function quickGuideModal() {
  const steps = D.QUICK_GUIDE_STEPS.map((s) => `
    <div class="flex items-start gap-3">
      <span class="px-2.5 py-1 rounded-md bg-[#00B8FF]/20 border border-[#00B8FF]/30 text-xs font-mono font-bold text-[#00B8FF] flex-shrink-0">${s.step}</span>
      <div>
        <div class="text-sm font-semibold text-white">${s.title}</div>
        <div class="text-xs text-slate-400">${s.description}</div>
      </div>
    </div>`).join('');
  return `
    <div id="quick-guide-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div class="w-full max-w-md p-6 rounded-2xl bg-[#091527] border border-white/15 shadow-2xl space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-white">Quick Guide</h3>
          <button id="quick-guide-close" class="p-1 rounded-lg text-slate-400 hover:text-white bg-white/5">${C.icon('x', 'w-4 h-4')}</button>
        </div>
        <div class="space-y-4">${steps}</div>
        <div class="pt-2 text-right">
          <button id="quick-guide-close2" class="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-500 hover:bg-sky-400 transition-colors">Got it</button>
        </div>
      </div>
    </div>`;
}

/* ---------- RoleSelection ---------- */
function roleSelection(selectedRole) {
  const cards = D.USER_ROLES.map((role) => {
    const isSelected = selectedRole && selectedRole.id === role.id;
    return `
      <div data-role-card="${role.id}" role="button" tabindex="0" aria-selected="${isSelected}"
        class="group relative flex flex-col p-5 rounded-2xl backdrop-blur-2xl transition-all duration-300 cursor-pointer outline-none ${
          isSelected
            ? 'bg-[#04121F]/90 border-2 border-[#00B8FF] shadow-[0_0_30px_rgba(0,184,255,0.25)] -translate-y-1'
            : 'bg-[#04121F]/60 hover:bg-[#04121F]/90 border border-white/[0.1] hover:border-[#00B8FF]/40 shadow-xl hover:-translate-y-1'
        } focus-visible:ring-2 focus-visible:ring-[#00B8FF]">
        ${isSelected ? `<div class="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-[#00B8FF] text-[#050B14] flex items-center justify-center font-bold shadow-md">${C.icon('check', 'w-3.5 h-3.5 stroke-[3]')}</div>` : ''}
        <div class="w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 transition-all ${
          isSelected ? 'bg-[#00B8FF]/20 border border-[#00B8FF]/50 shadow-[0_0_15px_rgba(0,184,255,0.3)]' : 'bg-[#00B8FF]/10 border border-[#00B8FF]/20 group-hover:bg-[#00B8FF]/20 group-hover:border-[#00B8FF]/40'
        }">${roleIconSvg(role.iconName, `w-6 h-6 transition-transform group-hover:scale-110 ${isSelected ? 'text-brand-cyan' : 'text-sky-400'}`)}</div>
        <h3 class="text-base sm:text-lg font-bold text-white mb-1.5 leading-snug group-hover:text-[#00B8FF] transition-colors">${role.title}</h3>
        <p class="text-xs sm:text-sm text-slate-300/90 leading-relaxed mb-4 flex-grow">${role.description}</p>
        <div class="mt-auto pt-2 flex items-center justify-between border-t border-white/5">
          <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider group-hover:text-[#00B8FF]">${isSelected ? 'Selected' : 'Select Role'}</span>
          <div class="w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-[#00B8FF] text-white' : 'bg-white/[0.04] text-slate-400 group-hover:bg-[#00B8FF]/20 group-hover:text-[#00B8FF]'}">${C.icon('arrow-right', 'w-3 h-3')}</div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="netfix-container py-4 sm:py-6 flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
      <div class="text-center max-w-2xl mx-auto mb-6 sm:mb-8 space-y-1.5">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/25 backdrop-blur-md w-fit mx-auto">
          <span class="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
          <span class="text-[10px] sm:text-[11px] font-semibold tracking-widest text-sky-300 uppercase">GET STARTED</span>
        </div>
        <h1 class="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">Choose Your Role</h1>
        <p class="text-xs sm:text-sm text-slate-300">Select the role that best describes how you'll use NETFIX AI.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 w-full mb-6 max-w-6xl">${cards}</div>
      <div id="role-prompt-error" class="hidden mb-3 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl">Please select a role to continue.</div>
      <div class="w-full max-w-sm flex flex-col items-center gap-3">
        <button id="role-continue-btn" ${selectedRole ? '' : 'disabled'} class="w-full py-3 px-6 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 min-h-[46px] ${
          selectedRole ? 'text-white bg-[#00B8FF] hover:bg-[#0098D4] shadow-[0_0_25px_rgba(0,184,255,0.4)] hover:shadow-[0_0_35px_rgba(0,184,255,0.6)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer' : 'text-slate-500 bg-white/[0.04] border border-white/10 cursor-not-allowed opacity-60'
        }"><span>Continue</span>${C.icon('arrow-right', 'w-4 h-4')}</button>
        <div class="flex items-center gap-2 text-xs text-slate-400 pt-0.5">
          <span>Don't know how to register?</span>
          <button id="open-quick-guide" class="inline-flex items-center gap-1 font-semibold text-[#00B8FF] hover:text-sky-300 transition-colors focus:outline-none focus:underline">${C.icon('help-circle', 'w-3.5 h-3.5')}<span>Use Quick Guide</span></button>
        </div>
      </div>
      ${quickGuideModal()}
    </div>`;
}

/* ---------- LoginForm ---------- */
function getDemoCredentialsForRole(roleId) {
  switch (roleId) {
    case 'employee': return { email: 'demo.employee@netfixai.test', password: 'Demo123' };
    case 'management': return { email: 'demo.management@netfixai.test', password: 'Demo123' };
    case 'advocate': return { email: 'demo.advocate@netfixai.test', password: 'Demo123' };
    case 'client': return { email: 'demo.client@netfixai.test', password: 'Demo123' };
    case 'tenant': case 'tenant-vendor': return { email: 'demo.tenant@netfixai.test', password: 'Demo123' };
    case 'regulator': return { email: 'demo.regulator@netfixai.test', password: 'Demo123' };
    default: return { email: 'demo.client@netfixai.test', password: 'Demo123' };
  }
}

function loginForm(selectedRole) {
  return `
    <div class="w-full max-w-md mx-auto px-4 py-4">
      <div class="p-6 sm:p-8 rounded-3xl bg-[#04121F]/85 border border-[#00B8FF]/35 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,184,255,0.14)] space-y-5 relative">
        <div class="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-[#00B8FF]/80 pointer-events-none"></div>
        <div class="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-[#00B8FF]/80 pointer-events-none"></div>
        <div class="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-[#00B8FF]/80 pointer-events-none"></div>
        <div class="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-[#00B8FF]/80 pointer-events-none"></div>

        <div class="space-y-3">
          <div class="space-y-1">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Welcome back</h1>
            <p class="text-xs sm:text-sm text-slate-300">Sign in to your NETFIX AI workspace.</p>
          </div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00B8FF]/10 border border-[#00B8FF]/30 text-xs font-semibold text-[#00B8FF]">
            <span class="w-2 h-2 rounded-full bg-[#00B8FF] animate-pulse"></span><span>● ${selectedRole.title}</span>
          </div>
        </div>

        <div id="login-error" class="hidden p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-300"></div>

        <form id="login-form" class="space-y-4">
          <div class="space-y-1.5">
            <label for="login-email" class="block text-xs font-semibold text-slate-300">Email ID</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">${C.icon('mail', 'w-4 h-4')}</div>
              <input id="login-email" type="email" required placeholder="Enter your email address" class="w-full pl-10 pr-4 py-3 rounded-xl bg-[#041828]/75 border border-[#00B8FF]/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/30 transition-all min-h-[44px]" />
            </div>
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label for="login-password" class="block text-xs font-semibold text-slate-300">Password</label>
              <button type="button" id="forgot-pw" class="text-[11px] font-medium text-[#00B8FF] hover:text-sky-300 transition-colors">Forgot password?</button>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">${C.icon('lock', 'w-4 h-4')}</div>
              <input id="login-password" type="password" required placeholder="Enter your password" class="w-full pl-10 pr-11 py-3 rounded-xl bg-[#041828]/75 border border-[#00B8FF]/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/30 transition-all min-h-[44px]" />
              <button type="button" id="toggle-login-pw" aria-label="Show password" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors">${C.icon('eye', 'w-4 h-4')}</button>
            </div>
          </div>
          <div class="pt-2">
            <button type="submit" id="login-submit" class="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-[#00B8FF] hover:bg-[#0098D4] shadow-[0_0_25px_rgba(0,184,255,0.4)] hover:shadow-[0_0_35px_rgba(0,184,255,0.6)] transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-70 cursor-pointer hover:scale-[1.01] active:scale-[0.98]">
              <span>Next</span>${C.icon('arrow-right', 'w-4 h-4')}
            </button>
          </div>
        </form>

        <div class="text-center pt-1">
          <button id="change-role-login" class="text-xs font-semibold text-[#00B8FF] hover:text-sky-300 transition-colors">Change Role</button>
        </div>

        <div class="pt-3 border-t border-white/10 text-center text-xs text-slate-400">
          <span>New user? </span>
          <button id="go-register" class="font-bold text-[#00B8FF] hover:text-sky-300 transition-colors ml-1">Register</button>
        </div>

        <div class="relative flex items-center justify-center my-2">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-white/10"></div></div>
          <span class="relative px-3 bg-[#04121F] text-[10px] font-semibold tracking-wider text-slate-400 uppercase">OR</span>
        </div>

        <div>
          <button id="open-demo-modal" class="w-full py-3 px-5 rounded-xl font-bold text-xs text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 border border-[#00B8FF]/40 hover:border-[#00B8FF] shadow-[0_0_15px_rgba(0,184,255,0.15)] transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer hover:scale-[1.01]">
            ${C.icon('flask-conical', 'w-4 h-4 text-[#00B8FF]')}<span>Demo Login</span>
          </button>
        </div>
      </div>

      <!-- Demo Login Modal -->
      <div id="demo-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div class="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#04121F] border border-[#00B8FF]/50 shadow-[0_0_50px_rgba(0,184,255,0.25)] space-y-5 text-left">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-[#00B8FF]/20 border border-[#00B8FF]/40 flex items-center justify-center text-[#00B8FF]">${C.icon('flask-conical', 'w-5 h-5')}</div>
              <div>
                <h2 class="text-xl font-bold text-white tracking-tight">Demo Login</h2>
                <p class="text-xs text-slate-300">Use the demo credentials below to sign in as a <span class="text-[#00B8FF] font-semibold">${selectedRole.title}</span>.</p>
              </div>
            </div>
            <button id="close-demo-modal" class="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors">${C.icon('x', 'w-5 h-5')}</button>
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-semibold text-slate-300">Role</label>
            <div class="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#041828] border border-[#00B8FF]/30 text-sm text-white font-medium">
              <div class="flex items-center gap-2">${C.icon('lock', 'w-3.5 h-3.5 text-[#00B8FF]')}<span>${selectedRole.title}</span></div>
              <span class="text-[10px] font-mono text-sky-400 uppercase bg-sky-500/10 px-2 py-0.5 rounded">Locked</span>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-[#00B8FF]/10 border border-[#00B8FF]/25 flex items-start gap-2 text-xs text-sky-200">
            ${C.icon('info', 'w-4 h-4 text-[#00B8FF] shrink-0 mt-0.5')}
            <span>These are development accounts for testing only. All authentication and role permissions are enforced.</span>
          </div>
          <div id="demo-error" class="hidden p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-300"></div>
          <form id="demo-form" class="space-y-4">
            <div class="space-y-1">
              <label class="block text-xs font-semibold text-slate-300">Email</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">${C.icon('mail', 'w-4 h-4')}</div>
                <input id="demo-email" type="email" required class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#041828] border border-[#00B8FF]/30 text-sm text-white focus:outline-none focus:border-[#00B8FF] font-mono" />
                <button type="button" data-copy-target="demo-email" title="Copy Email" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white">${C.icon('copy', 'w-4 h-4')}</button>
              </div>
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-semibold text-slate-300">Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">${C.icon('lock', 'w-4 h-4')}</div>
                <input id="demo-password" type="text" required class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#041828] border border-[#00B8FF]/30 text-sm text-white focus:outline-none focus:border-[#00B8FF] font-mono" />
                <button type="button" data-copy-target="demo-password" title="Copy Password" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white">${C.icon('copy', 'w-4 h-4')}</button>
              </div>
            </div>
            <div class="pt-2">
              <button type="submit" id="demo-submit" class="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-[#00B8FF] hover:bg-[#0098D4] shadow-[0_0_25px_rgba(0,184,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer">
                <span>Login</span>${C.icon('arrow-right', 'w-4 h-4')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
}

/* ---------- RegistrationForm ---------- */
function registrationForm(selectedRole) {
  const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-[#041828]/75 border border-[#00B8FF]/25 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-2 focus:ring-[#00B8FF]/30 transition-all';
  return `
    <div class="w-full max-w-3xl mx-auto px-4 py-4">
      <div class="p-6 sm:p-9 rounded-3xl bg-[#04121F]/85 border border-[#00B8FF]/35 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,184,255,0.14)] space-y-6 relative">
        <div class="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-[#00B8FF]/80 pointer-events-none"></div>
        <div class="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-[#00B8FF]/80 pointer-events-none"></div>
        <div class="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-[#00B8FF]/80 pointer-events-none"></div>
        <div class="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-[#00B8FF]/80 pointer-events-none"></div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span class="px-2.5 py-1 rounded-lg bg-[#00B8FF]/20 text-[#00B8FF] font-mono border border-[#00B8FF]/30">01 Details</span>
              <span class="text-slate-600">→</span><span class="text-slate-500 font-mono">02 Verify</span>
              <span class="text-slate-600">→</span><span class="text-slate-500 font-mono">03 Complete</span>
            </div>
          </div>
          <div class="space-y-1">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-1">Create your NETFIX AI account</h1>
            <p class="text-xs sm:text-sm text-slate-300">Enter your details to get started with the platform.</p>
            <div class="pt-2">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00B8FF]/10 border border-[#00B8FF]/30 text-xs font-semibold text-[#00B8FF]">
                <span class="w-2 h-2 rounded-full bg-[#00B8FF] animate-pulse"></span><span>● ${selectedRole.title}</span>
              </div>
            </div>
          </div>
        </div>

        <div id="reg-error" class="hidden p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-300"></div>

        <form id="register-form" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label for="reg-firstname" class="block text-xs font-semibold text-slate-300">First Name <span class="text-[#00B8FF]">*</span></label>
              <input id="reg-firstname" type="text" required placeholder="Teja" class="${inputCls}" />
              <p id="err-firstname" class="hidden text-[11px] text-rose-400"></p>
            </div>
            <div class="space-y-1.5">
              <label for="reg-middlename" class="block text-xs font-semibold text-slate-300">Middle Name <span class="text-slate-500 font-normal">(Optional)</span></label>
              <input id="reg-middlename" type="text" placeholder="Kumar" class="${inputCls}" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label for="reg-lastname" class="block text-xs font-semibold text-slate-300">Last Name <span class="text-[#00B8FF]">*</span></label>
              <input id="reg-lastname" type="text" required placeholder="Reddy" class="${inputCls}" />
              <p id="err-lastname" class="hidden text-[11px] text-rose-400"></p>
            </div>
            <div class="space-y-1.5">
              <label for="reg-dob" class="block text-xs font-semibold text-slate-300">Date of Birth <span class="text-[#00B8FF]">*</span></label>
              <input id="reg-dob" type="date" required max="${new Date().toISOString().split('T')[0]}" class="${inputCls}" />
              <p id="err-dob" class="hidden text-[11px] text-rose-400"></p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label for="reg-email" class="block text-xs font-semibold text-slate-300">Email ID <span class="text-[#00B8FF]">*</span></label>
              <input id="reg-email" type="email" required placeholder="teja@example.com" class="${inputCls}" />
              <p id="err-email" class="hidden text-[11px] text-rose-400"></p>
            </div>
            <div class="space-y-1.5">
              <label for="reg-phone" class="block text-xs font-semibold text-slate-300">Phone Number <span class="text-[#00B8FF]">*</span></label>
              <div class="flex gap-2">
                <select id="reg-cc" aria-label="Country code" class="px-3 py-2.5 rounded-xl bg-[#041828] border border-[#00B8FF]/25 text-sm text-slate-200 focus:outline-none focus:border-[#00B8FF]">
                  <option value="+91">🇮🇳 +91</option><option value="+1">🇺🇸 +1</option><option value="+44">🇬🇧 +44</option><option value="+971">🇦🇪 +971</option>
                </select>
                <input id="reg-phone" type="tel" required placeholder="98765 43210" class="${inputCls}" />
              </div>
              <p id="err-phone" class="hidden text-[11px] text-rose-400"></p>
            </div>
          </div>
          <div class="space-y-1.5">
            <label for="reg-permanent-addr" class="block text-xs font-semibold text-slate-300">Permanent Address <span class="text-[#00B8FF]">*</span></label>
            <textarea id="reg-permanent-addr" rows="2" required placeholder="123, MG Road, Bengaluru, Karnataka - 560001" class="${inputCls} resize-none"></textarea>
            <p id="err-permanentAddress" class="hidden text-[11px] text-rose-400"></p>
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label for="reg-temp-addr" class="block text-xs font-semibold text-slate-300">Temporary Address</label>
              <label class="inline-flex items-center gap-2 cursor-pointer text-xs text-[#00B8FF] hover:text-sky-300">
                <input id="reg-same-addr" type="checkbox" class="rounded bg-white/10 border-white/20 text-[#00B8FF] focus:ring-[#00B8FF] focus:ring-offset-0" />
                <span>Same as permanent address</span>
              </label>
            </div>
            <textarea id="reg-temp-addr" rows="2" placeholder="123, MG Road, Bengaluru, Karnataka - 560001" class="${inputCls} resize-none"></textarea>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label for="reg-password" class="block text-xs font-semibold text-slate-300">Create Password <span class="text-[#00B8FF]">*</span></label>
              <div class="relative">
                <input id="reg-password" type="password" required placeholder="••••••••••••" class="${inputCls} pl-4 pr-11" />
                <button type="button" id="toggle-reg-pw" aria-label="Show password" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors">${C.icon('eye', 'w-4 h-4')}</button>
              </div>
              <p id="err-password" class="hidden text-[11px] text-rose-400"></p>
            </div>
            <div class="space-y-1.5">
              <label for="reg-confirmpassword" class="block text-xs font-semibold text-slate-300">Confirm Password <span class="text-[#00B8FF]">*</span></label>
              <div class="relative">
                <input id="reg-confirmpassword" type="password" required placeholder="••••••••••••" class="${inputCls} pl-4 pr-11" />
                <button type="button" id="toggle-reg-cpw" aria-label="Show confirm password" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors">${C.icon('eye', 'w-4 h-4')}</button>
              </div>
              <p id="err-confirmPassword" class="hidden text-[11px] text-rose-400"></p>
            </div>
          </div>
          <div class="pt-2">
            <button type="submit" id="reg-submit" class="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-[#00B8FF] hover:bg-[#0098D4] shadow-[0_0_25px_rgba(0,184,255,0.4)] hover:shadow-[0_0_35px_rgba(0,184,255,0.6)] transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-70 cursor-pointer hover:scale-[1.01] active:scale-[0.98]">
              <span>Next</span>${C.icon('arrow-right', 'w-4 h-4')}
            </button>
          </div>
        </form>

        <div class="text-center pt-1">
          <button id="change-role-reg" class="text-xs font-semibold text-[#00B8FF] hover:text-sky-300 transition-colors">Change Role</button>
        </div>
        <div class="pt-3 border-t border-white/10 text-center text-xs text-slate-400">
          <span>Already registered? </span>
          <button id="go-login" class="font-bold text-[#00B8FF] hover:text-sky-300 transition-colors ml-1">Login</button>
        </div>
      </div>
    </div>`;
}

/* ---------- OTPVerification ---------- */
function otpVerification(mode, selectedRole, maskedContact) {
  const boxes = [0, 1, 2, 3, 4, 5].map((i) =>
    `<input type="text" inputmode="numeric" maxlength="1" data-otp-box="${i}" class="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono text-white bg-white/[0.04] border border-white/10 rounded-xl focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40 transition-all shadow-inner" />`
  ).join('');
  return `
    <div class="w-full max-w-md mx-auto px-4 py-6">
      <div class="p-6 sm:p-8 rounded-3xl bg-[#091527]/80 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-6">
        <div class="flex items-center justify-between">
          <button id="otp-back" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors">${C.icon('arrow-left', 'w-3.5 h-3.5')}<span>Back to ${mode === 'login' ? 'Login' : 'Registration'}</span></button>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-xs font-semibold text-sky-300"><span>${selectedRole.title}</span></div>
        </div>
        <div class="text-center space-y-2 pt-2">
          <div class="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-400/30 text-sky-400 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(0,163,255,0.25)]">${C.icon('shield-check', 'w-7 h-7')}</div>
          <h1 class="text-2xl font-extrabold text-white tracking-tight pt-1">${mode === 'login' ? 'Verify Your Login' : 'Verify Your Account'}</h1>
          <p class="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto">We've sent a verification code to your registered contact:</p>
          <div class="font-mono text-xs font-bold text-sky-300 bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-lg inline-block my-1">${maskedContact || 't***@example.com'}</div>
        </div>
        <div id="otp-error" class="hidden p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-300 text-center"></div>
        <div id="otp-resend-success" class="hidden p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-300 text-center"></div>
        <form id="otp-form" class="space-y-6">
          <div class="flex items-center justify-center gap-2 sm:gap-3">${boxes}</div>
          <div class="flex items-center justify-between text-xs text-slate-400 px-1">
            <span id="otp-timer-label">Code expires in <span id="otp-timer" class="font-mono font-bold text-sky-400">00:59</span></span>
            <button type="button" id="otp-resend" disabled class="inline-flex items-center gap-1 font-semibold transition-colors text-slate-500 cursor-not-allowed">${C.icon('refresh-cw', 'w-3 h-3')}<span>Resend code</span></button>
          </div>
          <button type="submit" id="otp-submit" class="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-sky-500 via-brand-electric to-brand-cyan hover:from-sky-400 hover:to-brand-cyan shadow-[0_0_30px_rgba(0,163,255,0.35)] hover:shadow-[0_0_40px_rgba(0,210,255,0.5)] transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-70 cursor-pointer">
            <span>Verify &amp; Continue</span>
          </button>
        </form>
        <div class="pt-2 text-center text-[11px] text-slate-500">Your account will be authenticated upon successful verification.</div>
      </div>
    </div>`;
}

/* ---------- Full auth page ---------- */
function authPage(route, selectedRole, maskedContact) {
  let content = '';
  if (route === '/role-selection') content = roleSelection(selectedRole);
  else if (route === '/login') content = selectedRole ? loginForm(selectedRole) : roleSelection(selectedRole);
  else if (route === '/register') content = selectedRole ? registrationForm(selectedRole) : roleSelection(selectedRole);
  else if (route === '/login/otp') content = selectedRole ? otpVerification('login', selectedRole, maskedContact) : roleSelection(selectedRole);
  else if (route === '/register/otp') content = selectedRole ? otpVerification('registration', selectedRole, maskedContact) : roleSelection(selectedRole);

  return `
    <div class="min-h-screen bg-[#050B14] text-slate-100 flex flex-col font-sans relative selection:bg-sky-500/30 selection:text-sky-200 overflow-x-hidden">
      ${authBackground()}
      ${authHeader()}
      <main class="relative z-10 flex-1 flex flex-col justify-center py-6 sm:py-10">${content}</main>
    </div>`;
}

window.NETFIX_AUTH = {
  authBackground,
  authHeader,
  quickGuideModal,
  roleSelection,
  loginForm,
  registrationForm,
  otpVerification,
  authPage,
  getDemoCredentialsForRole,
};