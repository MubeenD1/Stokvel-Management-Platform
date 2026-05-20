module.exports = {
  testEnvironment: "node",

  clearMocks: true,

  collectCoverage: true,

  // Force Jest to list out every single checked test line cleanly
  verbose: true,

  // Silence console.log and console.error output using our script
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Tailored specifically to match your exact directory tree layout
  collectCoverageFrom: [
    "controllers/**/*.js",     
    "src/controllers/**/*.js",   
    "src/utils/**/*.js",        
    "!**/node_modules/**"   
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
