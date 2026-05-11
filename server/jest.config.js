module.exports = {
  testEnvironment: "node",

  clearMocks: true,

  collectCoverage: true,

  collectCoverageFrom: [
    "src/controllers/groupController.js",
    "controllers/**.js"
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