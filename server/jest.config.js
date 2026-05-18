module.exports = {
  testEnvironment: "node",

  clearMocks: true,

  collectCoverage: true,

  // Tailored specifically to match your exact directory tree layout
  collectCoverageFrom: [
    "controllers/**/*.js",       // Matches root controllers (auth, contribution, payfast, payout, role)
    "src/controllers/**/*.js",   // Matches src controllers (analytics, group, sarb)
    "src/utils/**/*.js",         // Matches src utils & services (analyticsService, inviteCode, notificationService, sarbService)
    "!**/node_modules/**"        // Ignores dependencies completely
  ],

  coverageDirectory: "coverage",

  coverageReporters: ["text", "lcov", "html"],

  testMatch: ["**/tests/**/*.test.js"],

  coverageThreshold: {
    global: {
      statements: 20,
      branches: 20,
      functions: 20,
      lines: 20
    }
  }
};