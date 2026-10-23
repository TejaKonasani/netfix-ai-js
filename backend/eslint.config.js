// ESLint flat config (ESLint v9).
// Self-contained (no @eslint/js import) and intentionally permissive:
// the goal is to catch real bugs (undefined globals, duplicate keys,
// unreachable code) without failing CI on the large legacy codebase.
// Tighten the rules over time.
export default [
  {
    ignores: ["node_modules/**", "dist/**"],
  },
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        // Node + browser globals used across the codebase.
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        location: "readonly",
        history: "readonly",
        fetch: "readonly",
        console: "readonly",
        process: "readonly",
        require: "readonly",
        module: "writable",
        exports: "writable",
        __dirname: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        crypto: "readonly",
        atob: "readonly",
        btoa: "readonly",
        globalThis: "readonly",
      },
    },
    rules: {
      // Real bugs we want to catch.
      "no-undef": "warn",
      "no-unused-vars": "off",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-unreachable": "warn",
      "no-constant-condition": ["warn", { checkLoops: false }],
      // Relaxed for the legacy codebase.
      "no-console": "off",
      "no-empty": ["off"],
      "no-var": "off",
      "prefer-const": "off",
    },
  },
];