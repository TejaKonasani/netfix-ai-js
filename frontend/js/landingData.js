/* ============================================================
   NETFIX AI — Landing Data (converted from frontend/src/data/landingData.ts)
   ============================================================ */

const DOMAINS = [
  { name: 'Tax', icon: 'Calculator' },
  { name: 'Legal', icon: 'Scale' },
  { name: 'Litigation', icon: 'Gavel' },
  { name: 'Corporate', icon: 'Building2' },
  { name: 'Property', icon: 'Home' },
  { name: 'Projects', icon: 'Briefcase' },
  { name: 'Compliance', icon: 'ShieldCheck' },
];

const TRUST_BADGES = [
  { label: 'Trusted Intelligence', icon: 'Sparkles' },
  { label: 'Secure & Compliant', icon: 'Shield' },
  { label: 'Built for Real Businesses', icon: 'Building' },
];

const ABOUT_WORKFLOW = [
  {
    step: '01',
    title: 'Your Question or Document',
    description: 'Submit complex business queries, legal questions, tax records, or contractual documents.',
    icon: 'FileText',
  },
  {
    step: '02',
    title: 'AI Agents Research & Analyze',
    description: 'Specialized domain AI agents retrieve relevant laws, regulations, and cross-domain data.',
    icon: 'Brain',
  },
  {
    step: '03',
    title: 'Human Review',
    description: 'Qualified subject-matter specialists validate, refine, and verify generated outputs.',
    icon: 'UserCheck',
  },
  {
    step: '04',
    title: 'Final Answer, Report or Draft',
    description: 'Receive an actionable, enterprise-ready intelligence report, summary, or drafted filing.',
    icon: 'CheckSquare',
  },
];

const USER_ROLES = [
  {
    id: 'employee',
    title: 'Internal Employee',
    description: 'Handle assigned client cases, documents, tax matters, legal work and AI-assisted tasks.',
    iconName: 'users',
    dashboardRoute: '/employee/dashboard',
  },
  {
    id: 'management',
    title: 'Management / Executive',
    description: 'Monitor firm-wide operations, analytics, risk, workload and strategic insights.',
    iconName: 'trending-up',
    dashboardRoute: '/management/dashboard',
  },
  {
    id: 'advocate',
    title: 'Advocate / External Counsel',
    description: 'Work on assigned cases, research legal matters, review drafts and collaborate with teams.',
    iconName: 'scale',
    dashboardRoute: '/advocate/dashboard',
  },
  {
    id: 'client',
    title: 'Client',
    description: 'Submit requests, upload documents, track cases and access reviewed reports.',
    iconName: 'building',
    dashboardRoute: '/client/dashboard',
  },
  {
    id: 'tenant-vendor',
    title: 'Tenant / Buyer / Vendor',
    description: 'Access property or project information, submit requests and receive updates.',
    iconName: 'home',
    dashboardRoute: '/tenant/dashboard',
  },
  {
    id: 'regulator',
    title: 'Regulator / Auditor',
    description: 'Access explicitly shared compliance records and audit information through controlled access.',
    iconName: 'shield-check',
    dashboardRoute: '/regulator/dashboard',
  },
  {
    id: 'admin',
    title: 'Admin / System Administrator',
    description: 'Platform overview, user management, AI operations, access governance, system audit trail, and settings.',
    iconName: 'shield-check',
    dashboardRoute: '/admin/dashboard',
  },
];

const QUICK_GUIDE_STEPS = [
  { step: '01', title: 'Choose your role', description: 'Select the role that matches how you will use the platform.' },
  { step: '02', title: 'Create your account', description: 'Enter your details and create your password.' },
  { step: '03', title: 'Verify your identity', description: 'Confirm your email or phone using the OTP we send you.' },
  { step: '04', title: 'Access NETFIX AI', description: 'After verification, continue to your role-specific workspace.' },
];

const PROCESS_STEPS = [
  { step: '01', title: 'Choose your role', description: 'Sign up to the platform as your appropriate user type.', iconName: 'user-check' },
  { step: '02', title: 'Submit a question or document', description: 'Upload your files or enter your query.', iconName: 'file-text' },
  { step: '03', title: 'AI agents analyze and process', description: 'Relevant laws, rules and data are researched.', iconName: 'cpu' },
  { step: '04', title: 'Human review validates the output', description: 'Our experts review and refine the AI-generated result.', iconName: 'user-round-check' },
  { step: '05', title: 'Use the final answer, report or draft', description: 'Access and download your completed output.', iconName: 'check-circle' },
];

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'What is NETFIX AI?',
    answer: 'NETFIX AI is an AI-powered integrated business intelligence platform developed in association with MARG GROUP. It combines specialized domain intelligence across Tax, Legal, Litigation, Corporate, Property, Projects, and Compliance into a unified, human-validated ecosystem.',
  },
  {
    id: 'faq-2',
    question: 'Who can use NETFIX AI?',
    answer: 'The platform is purpose-built for diverse enterprise stakeholders: internal team employees, corporate executives, external advocates and counsel, clients, property buyers/tenants/vendors, and regulators or auditors.',
  },
  {
    id: 'faq-3',
    question: 'Is my data secure?',
    answer: 'Yes. NETFIX AI is designed with strict enterprise-grade privacy, role-based access isolation, and encrypted document storage. Data access is segmented strictly by verified permissions and organizational policy.',
  },
  {
    id: 'faq-4',
    question: 'How does the AI-generated output get reviewed?',
    answer: 'Every AI agent output passes through a structured human-in-the-loop workflow. Domain specialists and qualified professionals validate the analysis, citations, and draft materials before the final deliverable is issued.',
  },
  {
    id: 'faq-5',
    question: 'What can I submit to the platform?',
    answer: 'Users can submit specific questions or upload relevant documents such as tax returns, contracts, regulatory notices, litigation filings, and property documents for rapid AI synthesis and professional verification.',
  },
  {
    id: 'faq-6',
    question: 'How do I get started?',
    answer: 'Getting started is straightforward. Click on "Get Started" to select your designated stakeholder role and request an onboarding invitation tailored to your specific operational needs.',
  },
  {
    id: 'faq-7',
    question: 'Is there a cost to use the platform?',
    answer: 'Access and pricing may depend on the service, organization and user type. Final details will be provided by MARG Group.',
  },
];

const CONTACT_ITEMS = [
  { type: 'phone', label: 'Phone', value: '+91 XXXXX XXXXX', actionText: 'Call Support' },
  { type: 'email', label: 'Email', value: 'contact@example.com', actionText: 'Send Email' },
  { type: 'whatsapp', label: 'WhatsApp', value: 'Chat with us', actionText: 'Connect on WhatsApp' },
];

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Roles', href: '#roles' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQs', href: '#faqs' },
  { label: 'Contact', href: '#contact' },
];

const FOOTER_LINKS = [
  { label: 'Sign Up', href: '/role-selection', isRoute: true },
  { label: 'Login', href: '/role-selection', isRoute: true },
  { label: 'About', href: '#about', isRoute: false },
  { label: 'Contact', href: '#contact', isRoute: false },
  { label: 'FAQs', href: '#faqs', isRoute: false },
  { label: 'Privacy Policy', href: '#privacy', isRoute: false },
  { label: 'Terms of Service', href: '#terms', isRoute: false },
];

// Expose globally
window.NETFIX_DATA = {
  DOMAINS,
  TRUST_BADGES,
  ABOUT_WORKFLOW,
  USER_ROLES,
  QUICK_GUIDE_STEPS,
  PROCESS_STEPS,
  FAQ_ITEMS,
  CONTACT_ITEMS,
  NAV_LINKS,
  FOOTER_LINKS,
};