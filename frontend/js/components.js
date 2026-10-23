/* ============================================================
   NETFIX AI — Shared Components (converted from frontend/src/components/*.tsx)
   Landing page sections + reusable UI, as plain JS template functions.
   Icons: use <i data-lucide="name"></i>, refreshed via lucide.createIcons()
   ============================================================ */

const D = window.NETFIX_DATA;

/* ---------- Icon helper ---------- */
function icon(name, cls = '') {
  return `<i data-lucide="${name}" class="${cls}"></i>`;
}

/* ---------- Re-render Lucide icons after DOM update ---------- */
function refreshIcons() {
  if (window.lucide && window.lucide.createIcons) {
    window.lucide.createIcons();
  }
}

/* ---------- 3D tilt card (converted from NetfixCard.tsx) ---------- */
function attachTilt(container) {
  const cards = container.querySelectorAll('.netfix-card[data-tilt]');
  cards.forEach((card) => {
    let hovered = false;
    card.addEventListener('mousemove', (e) => {
      if (window.innerWidth < 768) return;
      hovered = true;
      card.classList.add('is-hovered');
      const rect = card.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const rotateX = ((mouseY - rect.height / 2) / (rect.height / 2)) * -7;
      const rotateY = ((mouseX - rect.width / 2) / (rect.width / 2)) * 7;
      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015,1.015,1.015)`;
      card.style.transition = 'transform 0.08s ease-out';
      const glare = card.querySelector('.netfix-card-glare');
      if (glare) {
        glare.style.background = `radial-gradient(circle at ${(mouseX / rect.width) * 100}% ${(mouseY / rect.height) * 100}%, rgba(0,184,255,0.3), transparent 65%)`;
        glare.style.opacity = '1';
      }
    });
    card.addEventListener('mouseleave', () => {
      hovered = false;
      card.classList.remove('is-hovered');
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
      card.style.transition = 'transform 0.4s ease-out';
      const glare = card.querySelector('.netfix-card-glare');
      if (glare) glare.style.opacity = '0';
    });
  });
}

/* ---------- NetfixCard wrapper ---------- */
function netfixCard(content, opts = {}) {
  const { onClick, tilt = true, className = '' } = opts;
  return `
    <div class="netfix-card-container" ${onClick ? 'data-card-click' : ''}>
      <div class="netfix-card ${tilt ? 'data-tilt' : ''} ${className}" ${tilt ? 'data-tilt' : ''}>
        <div class="netfix-card-particles"></div>
        <div class="netfix-card-lines"></div>
        <div class="netfix-card-glare" style="opacity:0"></div>
        <div class="netfix-card-corner netfix-card-corner-tl"></div>
        <div class="netfix-card-corner netfix-card-corner-tr"></div>
        <div class="netfix-card-corner netfix-card-corner-bl"></div>
        <div class="netfix-card-corner netfix-card-corner-br"></div>
        <div class="netfix-card-content">${content}</div>
      </div>
    </div>`;
}

/* ---------- BrandLogo (converted from BrandLogo.tsx) ---------- */
function brandLogo(size = 'md', showTagline = false, className = '') {
  const textSize = { sm: 'text-lg', md: 'text-xl sm:text-2xl', lg: 'text-2xl sm:text-3xl', hero: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl' }[size];
  const margSize = { sm: 'text-[9px] tracking-[0.25em]', md: 'text-[10px] sm:text-[11px] tracking-[0.28em]', lg: 'text-xs tracking-[0.3em]', hero: 'text-xs sm:text-sm tracking-[0.35em]' }[size];
  return `
    <div class="inline-flex flex-col select-none ${className}" data-brand-logo>
      <div class="flex items-center gap-1.5 leading-none">
        <span class="font-extrabold tracking-tight text-white ${textSize}">NETFIX</span>
        <span class="font-black tracking-tight ${textSize} text-[#00B8FF] drop-shadow-[0_0_12px_rgba(0,184,255,0.5)]">AI</span>
      </div>
      <span class="font-semibold uppercase text-slate-400/90 mt-1 transition-colors hover:text-slate-300 ${margSize}">MARG GROUP</span>
      ${showTagline ? `<span class="text-xs sm:text-sm text-slate-400 font-medium mt-1.5">Smarter Law. Stronger Decisions.</span>` : ''}
    </div>`;
}

/* ---------- VideoBackground ---------- */
function videoBackground() {
  return `
    <div class="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <video autoplay muted loop playsinline class="absolute inset-0 w-full h-full object-cover filter brightness-[0.65] contrast-[1.05]">
        <source src="/backend.mp4" type="video/mp4" />
      </video>
      <div class="absolute inset-0 bg-gradient-to-b from-[#020C16]/80 via-[#020C16]/82 to-[#020C16]/88"></div>
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,184,255,0.12),transparent_75%)]"></div>
    </div>`;
}

/* ---------- Navbar ---------- */
function navbar() {
  const links = D.NAV_LINKS.map((l) =>
    `<a href="${l.href}" data-nav-link="${l.href}" class="text-sm font-medium text-slate-300 hover:text-[#00B8FF] transition-colors duration-200">${l.label}</a>`
  ).join('');
  const mobileLinks = D.NAV_LINKS.map((l) =>
    `<a href="${l.href}" data-nav-link="${l.href}" class="px-4 py-3 rounded-lg text-base font-medium text-slate-200 hover:text-[#00B8FF] hover:bg-white/[0.07] transition-all min-h-[44px] flex items-center">${l.label}</a>`
  ).join('');

  return `
    <header id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#050B14]/40 backdrop-blur-md border-b border-white/5 py-4 sm:py-5">
      <div class="netfix-container">
        <div class="flex items-center justify-between h-14 sm:h-16">
          <div class="flex items-center flex-shrink-0">
            ${brandLogo('md')}
          </div>
          <nav aria-label="Main Navigation" class="hidden md:flex items-center space-x-6 lg:space-x-8">${links}</nav>
          <div class="hidden md:flex items-center">
            <button data-goto="/role-selection" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#00B8FF]/10 hover:bg-[#00B8FF]/20 border border-[#00B8FF]/30 hover:border-[#00B8FF]/60 shadow-[0_0_15px_rgba(0,184,255,0.2)] transition-all duration-200 focus:outline-none" aria-label="Login">
              ${icon('user', 'w-4 h-4 text-[#00B8FF]')}<span>Login</span>
            </button>
          </div>
          <div class="flex md:hidden items-center">
            <button id="mobile-menu-btn" type="button" aria-expanded="false" aria-label="Toggle navigation menu"
              class="p-2.5 rounded-lg text-slate-300 hover:text-white bg-white/[0.05] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#00B8FF] min-h-[44px] min-w-[44px] flex items-center justify-center">
              ${icon('menu', 'w-5 h-5')}
            </button>
          </div>
        </div>
      </div>
      <div id="mobile-menu" class="md:hidden hidden fixed inset-x-0 top-[65px] p-4 bg-[#050B14]/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div class="flex flex-col space-y-2 py-2">
          ${mobileLinks}
          <div class="pt-4 border-t border-white/10">
            <button data-goto="/role-selection" data-close-mobile class="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#00B8FF] hover:bg-[#0098D4] shadow-[0_0_20px_rgba(0,184,255,0.4)] transition-all flex items-center justify-center gap-2">
              ${icon('user', 'w-4 h-4 text-white')}<span>Login</span>
            </button>
          </div>
        </div>
      </div>
    </header>`;
}

/* ---------- Hero ---------- */
function hero() {
  return `
    <section class="relative min-h-[calc(100vh-80px)] pt-4 pb-6 sm:pt-6 sm:pb-8 lg:pt-8 lg:pb-10 flex flex-col justify-between overflow-hidden">
      <div class="absolute inset-0 z-0 pointer-events-none">
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-[#050B14]/30 to-[#050B14]/60"></div>
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,184,255,0.15),transparent_70%)]"></div>
      </div>
      <div class="relative z-10 netfix-container w-full my-auto">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div class="lg:col-span-7 flex flex-col justify-center space-y-5 sm:space-y-6">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/25 backdrop-blur-md w-fit">
              <span class="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
              <span class="text-[11px] sm:text-xs font-semibold tracking-widest text-sky-300 uppercase">ONE PLATFORM. INFINITE POSSIBILITIES.</span>
            </div>
            <div class="space-y-1.5">
              <div class="flex items-center gap-3">
                <h1 class="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-none">NETFIX <span class="text-[#00B8FF] drop-shadow-[0_0_20px_rgba(0,184,255,0.4)]">AI</span></h1>
              </div>
              <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">Smarter Law. Stronger Decisions.</h2>
            </div>
            <p class="text-sm sm:text-base md:text-lg text-slate-300 max-w-xl leading-relaxed font-normal">
              AI-powered intelligence for <span class="text-white font-medium">Tax</span>, <span class="text-white font-medium">Legal</span>, <span class="text-white font-medium">Litigation</span>, <span class="text-white font-medium">Corporate</span>, <span class="text-white font-medium">Property</span>, <span class="text-white font-medium">Projects</span> and <span class="text-white font-medium">Compliance</span>.
            </p>
            <div class="flex flex-wrap items-center gap-4 pt-1">
              <button data-goto="/role-selection" class="gradient-button group focus:outline-none focus:ring-2 focus:ring-[#00B8FF]" aria-label="Get Started">
                <span class="gradient-text !py-3 sm:!py-3.5 !px-6 sm:!px-7 !text-sm sm:!text-base"><span>Get Started</span>${icon('arrow-right', 'w-4 h-4 group-hover:translate-x-1 transition-transform text-sky-300')}</span>
              </button>
              <button data-scroll="#about" class="netfix-explore-btn group focus:outline-none focus:ring-2 focus:ring-[#00B8FF]/50" aria-label="Explore Platform">
                <span class="netfix-explore-inner !py-3 sm:!py-3.5 !px-6 sm:!px-7 !text-sm sm:!text-base"><span>Explore Platform</span>${icon('arrow-down', 'w-4 h-4 text-[#00B8FF] group-hover:translate-y-0.5 transition-transform')}</span>
              </button>
            </div>
            <div class="pt-3 sm:pt-4 flex flex-wrap items-center gap-3 sm:gap-4">
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-xs font-medium text-slate-300">${icon('sparkles', 'w-3.5 h-3.5 text-[#00B8FF]')}<span>Trusted Intelligence</span></div>
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-xs font-medium text-slate-300">${icon('shield-check', 'w-3.5 h-3.5 text-[#00B8FF]')}<span>Secure &amp; Compliant</span></div>
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-xs font-medium text-slate-300">${icon('building', 'w-3.5 h-3.5 text-[#00B8FF]')}<span>Built for Real Businesses</span></div>
            </div>
          </div>
          <div class="lg:col-span-5 relative flex items-end justify-center min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] max-h-[540px] w-full overflow-hidden self-end">
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(0,184,255,0.22),transparent_70%)] pointer-events-none"></div>
            <div class="relative z-10 w-full flex items-end justify-center">
              <img src="/ai_robot_transparent.png" alt="NETFIX AI Cybernetic Enterprise Assistant"
                class="max-h-[460px] sm:max-h-[500px] lg:max-h-[530px] w-auto object-contain object-bottom drop-shadow-[0_0_45px_rgba(0,184,255,0.45)] transition-transform duration-700 hover:scale-[1.02] pointer-events-none" />
              <div class="absolute top-2 right-0 sm:right-2 z-20 p-3 rounded-2xl bg-[#04121F]/85 border border-[#00B8FF]/40 backdrop-blur-md shadow-xl max-w-[170px] space-y-1 text-right select-none">
                <div class="text-[10px] font-bold text-white tracking-wider">ANALYZE</div>
                <div class="text-[10px] font-medium text-[#00B8FF]">RESEARCH</div>
                <div class="text-[10px] font-medium text-slate-300">COMPLIANCE</div>
                <div class="text-[9px] font-mono text-sky-400/90 pt-0.5">BETTER DECISIONS</div>
              </div>
              <div class="absolute top-10 left-0 sm:left-2 z-20 p-2.5 rounded-2xl bg-[#04121F]/85 border border-[#00B8FF]/40 backdrop-blur-md shadow-xl flex items-center gap-2 select-none">
                <div class="w-8 h-8 rounded-xl bg-[#00B8FF]/15 border border-[#00B8FF]/40 flex items-center justify-center text-[#00B8FF]">${icon('sparkles', 'w-4 h-4')}</div>
                <div class="text-[10px] font-bold text-white leading-tight"><div>LEGAL &amp; TAX</div><div class="text-[9px] font-normal text-[#00B8FF]">AI INTELLIGENCE</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="relative z-10 w-full pt-4 pb-1 text-center">
        <div class="inline-flex items-center gap-4">
          <div class="w-12 sm:w-20 h-[1px] bg-gradient-to-r from-transparent to-sky-500/40"></div>
          <span class="text-[10px] sm:text-[11px] font-mono tracking-widest text-slate-400/80 uppercase">HUMAN-CENTRIC AI. REAL-WORLD IMPACT.</span>
          <div class="w-12 sm:w-20 h-[1px] bg-gradient-to-l from-transparent to-sky-500/40"></div>
        </div>
      </div>
    </section>`;
}

/* ---------- About ---------- */
function about() {
  const wfIcon = { FileText: 'file-text', Brain: 'brain', UserCheck: 'user-check', CheckSquare: 'check-square' };
  const cards = D.ABOUT_WORKFLOW.map((item, index) => {
    const arrow = index < D.ABOUT_WORKFLOW.length - 1
      ? `<div class="hidden xl:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-sky-400/50">${icon('arrow-right', 'w-4 h-4')}</div>` : '';
    return `
      <div class="relative flex flex-col h-full">
        ${netfixCard(`
          <div class="h-full p-5 flex flex-col items-center text-center group">
            <div class="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(0,163,255,0.25)] transition-all">${icon(wfIcon[item.icon] || 'file-text', 'w-6 h-6 text-sky-400')}</div>
            <h3 class="text-sm font-bold text-white mb-2 leading-snug group-hover:text-[#00B8FF] transition-colors">${item.title}</h3>
            <p class="text-xs text-slate-300/80 leading-relaxed">${item.description}</p>
          </div>`)}
        ${arrow}
      </div>`;
  }).join('');

  return `
    <section id="about" class="relative py-10 sm:py-12 lg:py-14 border-t border-sky-400/10 overflow-hidden">
      <div class="absolute top-1/2 -left-48 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div class="absolute top-1/2 -right-48 -translate-y-1/2 w-96 h-96 bg-brand-blue/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div class="netfix-container relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div class="lg:col-span-5 space-y-6">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold tracking-widest text-sky-400 uppercase">ABOUT NETFIX AI</span>
              <span class="w-8 h-[1px] bg-sky-400/40"></span>
            </div>
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">One Intelligence Layer. <span class="bg-gradient-to-r from-sky-300 via-brand-cyan to-white bg-clip-text text-transparent">Every Business Decision.</span></h2>
            <div class="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              <p>NETFIX AI brings Tax, Legal, Litigation, Corporate, Property, Project and Compliance intelligence into one integrated platform.</p>
              <p class="text-slate-400">You submit a question or document, our specialized AI agents research and analyze the relevant information, a human expert reviews the output, and you receive a final, reliable answer, report or draft.</p>
            </div>
            <div class="pt-2">
              <button data-scroll="#roles" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-sky-400/30 transition-all duration-200 group min-h-[44px]">
                <span>Learn More About Us</span>${icon('arrow-right', 'w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform')}
              </button>
            </div>
          </div>
          <div class="lg:col-span-7 flex flex-col space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 relative">${cards}</div>
            <div class="flex items-center justify-center gap-3 pt-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              <span class="w-12 h-[1px] bg-slate-700"></span><span>HUMAN-CENTRIC AI. REAL-WORLD IMPACT.</span><span class="w-12 h-[1px] bg-slate-700"></span>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

/* ---------- Roles ---------- */
function roles() {
  const roleIcon = { users: 'users', 'trending-up': 'trending-up', scale: 'scale', building: 'building-2', home: 'home', 'shield-check': 'shield-check' };
  const cards = D.USER_ROLES.map((role) => {
    return netfixCard(`
      <div class="group relative flex flex-col p-5 h-full cursor-pointer">
        <div class="w-12 h-12 rounded-xl bg-[#00B8FF]/10 border border-[#00B8FF]/20 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-[#00B8FF]/20 group-hover:border-[#00B8FF]/40 transition-all">${icon(roleIcon[role.iconName] || 'users', 'w-6 h-6 text-[#00B8FF]')}</div>
        <h3 class="text-base font-bold text-white mb-2 leading-snug group-hover:text-[#00B8FF] transition-colors">${role.title}</h3>
        <p class="text-xs text-slate-300/80 leading-relaxed mb-6 flex-grow">${role.description}</p>
        <div class="mt-auto pt-2">
          <div class="w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:bg-[#00B8FF] group-hover:border-[#00B8FF] transition-all">${icon('arrow-right', 'w-3.5 h-3.5 text-slate-300 group-hover:text-white transition-colors')}</div>
        </div>
      </div>`, { onClick: true, tilt: false });
  }).join('');

  return `
    <section id="roles" class="relative py-10 sm:py-12 lg:py-14 border-t border-sky-400/10 overflow-hidden">
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-7xl h-72 bg-gradient-to-r from-sky-500/5 via-brand-cyan/5 to-sky-500/5 blur-3xl pointer-events-none"></div>
      <div class="netfix-container relative z-10">
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 lg:mb-10 gap-4">
          <div class="space-y-2">
            <span class="text-xs font-bold tracking-widest text-[#00B8FF] uppercase">BUILT FOR EVERY STAKEHOLDER</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Different Roles. A Unified Platform.</h2>
          </div>
          <div class="text-slate-400 text-sm max-w-md"><span>A tailored experience for everyone in the MARG Group ecosystem.</span></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3">${cards}</div>
      </div>
    </section>`;
}

/* ---------- HowItWorks ---------- */
function howItWorks() {
  const stepIcon = { 'user-check': 'user-check', 'file-text': 'file-text', cpu: 'cpu', 'user-round-check': 'users', 'check-circle': 'check-circle-2' };
  const cards = D.PROCESS_STEPS.map((step, index) => {
    const arrow = index < D.PROCESS_STEPS.length - 1
      ? `<div class="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-sky-400/40">${icon('arrow-right', 'w-4 h-4')}</div>` : '';
    return `
      <div class="relative flex flex-col h-full">
        ${netfixCard(`
          <div class="h-full p-5 group flex flex-col">
            <div class="flex items-center gap-2.5 mb-4">
              <span class="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10 text-xs font-mono font-bold text-sky-300">${step.step}</span>
              <div class="p-1.5 rounded-lg bg-sky-500/10 border border-sky-400/20 group-hover:scale-110 group-hover:bg-sky-500/20 transition-all">${icon(stepIcon[step.iconName] || 'user-check', 'w-5 h-5 text-sky-400')}</div>
            </div>
            <h3 class="text-sm font-bold text-white mb-2 leading-snug group-hover:text-sky-200 transition-colors">${step.title}</h3>
            <p class="text-xs text-slate-300/80 leading-relaxed mt-auto">${step.description}</p>
          </div>`)}
        ${arrow}
      </div>`;
  }).join('');

  return `
    <section id="how-it-works" class="relative py-10 sm:py-12 lg:py-14 border-t border-sky-400/10 overflow-hidden">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-96 bg-brand-electric/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div class="netfix-container relative z-10">
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 lg:mb-10 gap-4">
          <div class="space-y-2">
            <span class="text-xs font-bold tracking-widest text-sky-400 uppercase">FROM REQUEST TO DECISION</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">A Simple, Powerful Process.</h2>
          </div>
          <div class="text-slate-400 text-sm max-w-md"><span>Get from a question or document to a reviewed, usable result in just a few steps.</span></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-3 relative">${cards}</div>
      </div>
    </section>`;
}

/* ---------- FAQ ---------- */
function faq() {
  const leftFaqs = D.FAQ_ITEMS.slice(0, 4);
  const rightFaqs = D.FAQ_ITEMS.slice(4);
  const faqItem = (faq, num) => `
    <div class="rounded-2xl bg-[#091527]/60 hover:bg-[#0c1f38]/80 border border-white/[0.08] hover:border-sky-400/25 backdrop-blur-xl transition-all overflow-hidden">
      <button type="button" data-faq-toggle="${faq.id}" aria-expanded="false" class="w-full px-5 py-4 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 min-h-[56px]">
        <span class="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2.5">
          <span class="text-xs font-mono text-sky-400">${num}.</span>${faq.question}
        </span>
        <span class="faq-icon flex-shrink-0 w-7 h-7 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-300">${icon('plus', 'w-3.5 h-3.5')}</span>
      </button>
      <div id="faq-answer-${faq.id}" class="faq-answer hidden px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300/90 leading-relaxed border-t border-white/5">${faq.answer}</div>
    </div>`;
  return `
    <section id="faqs" class="relative py-10 sm:py-12 lg:py-14 border-t border-sky-400/10 overflow-hidden">
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div class="netfix-container relative z-10">
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 lg:mb-10 gap-4">
          <div class="space-y-2">
            <span class="text-xs font-bold tracking-widest text-sky-400 uppercase">FREQUENTLY ASKED QUESTIONS</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Questions? We've Got You Covered.</h2>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-slate-400 text-xs sm:text-sm hidden sm:inline">Still have questions? Feel free to contact us.</span>
            <button data-scroll="#contact" class="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-sky-400/30 backdrop-blur-md transition-all min-h-[40px]">Contact Team</button>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-start">
          <div class="space-y-2.5 sm:space-y-3">${leftFaqs.map((f, i) => faqItem(f, i + 1)).join('')}</div>
          <div class="space-y-2.5 sm:space-y-3">${rightFaqs.map((f, i) => faqItem(f, i + 5)).join('')}</div>
        </div>
      </div>
    </section>`;
}

/* ---------- Contact ---------- */
function contact() {
  const cIcon = { phone: 'phone', email: 'mail', whatsapp: 'message-square' };
  const cards = D.CONTACT_ITEMS.map((item) => {
    const iconWrap = item.type === 'whatsapp'
      ? `bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]`
      : `bg-sky-500/15 text-sky-400 border border-sky-400/25 group-hover:shadow-[0_0_20px_rgba(0,163,255,0.25)]`;
    return `
      <div data-contact="${item.type}" class="group relative flex items-center gap-4 p-5 sm:p-6 rounded-2xl bg-[#091527]/60 hover:bg-[#0c1f38]/90 border border-white/[0.08] hover:border-sky-400/35 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${iconWrap}">${icon(cIcon[item.type], 'w-6 h-6')}</div>
        <div class="flex-1 min-w-0">
          <span class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">${item.label}</span>
          <span class="block text-sm sm:text-base font-bold text-white truncate group-hover:text-sky-200 transition-colors">${item.value}</span>
          <span class="inline-flex items-center gap-1 text-[11px] text-sky-400/80 mt-1">${icon('copy', 'w-3 h-3 opacity-60')}<span>Click to ${item.type === 'whatsapp' ? 'connect' : 'copy'}</span></span>
        </div>
      </div>`;
  }).join('');
  return `
    <section id="contact" class="relative py-10 sm:py-12 lg:py-14 border-t border-sky-400/10 overflow-hidden">
      <div class="netfix-container relative z-10">
        <div class="mb-8 lg:mb-10">
          <span class="text-xs font-bold tracking-widest text-sky-400 uppercase">LET'S CONNECT</span>
          <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1 mb-2">Get in Touch</h2>
          <p class="text-slate-400 text-sm sm:text-base max-w-xl">For platform access, business enquiries or further information, reach out to the MARG Group team.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-4">${cards}</div>
      </div>
    </section>`;
}

/* ---------- Footer ---------- */
function footer() {
  const links = D.FOOTER_LINKS.map((l) =>
    `<a href="${l.href}" data-footer-link data-href="${l.href}" data-route="${l.isRoute}" class="text-xs sm:text-sm text-slate-400 hover:text-sky-300 transition-colors py-0.5">${l.label}</a>`
  ).join('');
  return `
    <footer class="relative bg-[#030712]/70 backdrop-blur-lg border-t border-sky-400/10 pt-10 pb-8 overflow-hidden">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-sky-400/40 to-transparent"></div>
      <div class="absolute bottom-0 left-1/3 w-80 h-32 bg-sky-500/5 blur-3xl pointer-events-none"></div>
      <div class="netfix-container relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/5">
          <div class="md:col-span-4 space-y-3">
            ${brandLogo('md', true)}
            <p class="text-xs text-slate-500 max-w-sm pt-1 leading-relaxed">Enterprise AI intelligence platform for Tax, Legal, Litigation, Corporate, Property, Projects and Compliance.</p>
          </div>
          <div class="md:col-span-5">
            <h4 class="text-xs font-bold uppercase tracking-widest text-slate-300 mb-4">Quick Links</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4">${links}</div>
          </div>
          <div class="md:col-span-3 space-y-4">
            <h4 class="text-xs font-bold uppercase tracking-widest text-slate-300">Follow Us</h4>
            <div class="flex items-center space-x-3">
              <a href="#contact" data-scroll="#contact" aria-label="LinkedIn" class="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-sky-500/20 border border-white/10 hover:border-sky-400/40 flex items-center justify-center text-slate-400 hover:text-sky-300 transition-all"><svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg></a>
              <a href="#contact" data-scroll="#contact" aria-label="Twitter / X" class="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-sky-500/20 border border-white/10 hover:border-sky-400/40 flex items-center justify-center text-slate-400 hover:text-sky-300 transition-all"><svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
              <a href="#contact" data-scroll="#contact" aria-label="YouTube" class="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-sky-500/20 border border-white/10 hover:border-sky-400/40 flex items-center justify-center text-slate-400 hover:text-sky-300 transition-all"><svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
            </div>
            <p class="text-[11px] text-slate-500">Stay connected with MARG Group digital initiatives and enterprise updates.</p>
          </div>
        </div>
        <div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 NETFIX AI. All rights reserved.</p>
          <p class="font-semibold text-slate-400 tracking-wider">A MARG GROUP Initiative</p>
        </div>
      </div>
      <div id="policy-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div class="w-full max-w-lg p-6 rounded-2xl bg-[#091527] border border-white/15 shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 id="policy-modal-title" class="text-lg font-bold text-white">Privacy Policy</h3>
            <button id="policy-modal-close" class="p-1 rounded-lg text-slate-400 hover:text-white bg-white/5">${icon('x', 'w-4 h-4')}</button>
          </div>
          <p class="text-sm text-slate-300 leading-relaxed">This document is being prepared for upcoming Phase releases in alignment with MARG Group enterprise governance standards and applicable regulatory compliance guidelines.</p>
          <div class="pt-2 text-right">
            <button id="policy-modal-close2" class="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-500 hover:bg-sky-400 transition-colors">Close</button>
          </div>
        </div>
      </div>
    </footer>`;
}

/* ---------- Full landing page ---------- */
function landingPage() {
  return `
    <div class="min-h-screen bg-[#050B14] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200 relative">
      ${videoBackground()}
      ${navbar()}
      <main class="flex-1 w-full relative z-10 pt-20">
        ${hero()}
        ${about()}
        ${roles()}
        ${howItWorks()}
        ${faq()}
        ${contact()}
      </main>
      ${footer()}
    </div>`;
}

window.NETFIX_COMPONENTS = {
  icon,
  refreshIcons,
  attachTilt,
  netfixCard,
  brandLogo,
  videoBackground,
  navbar,
  hero,
  about,
  roles,
  howItWorks,
  faq,
  contact,
  footer,
  landingPage,
};