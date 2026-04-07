// jest.config.mjs
export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "services/**/*.js",
    "middlewares/**/*.js",
  ],
  coverageReporters: ["text", "lcov"],
  coverageThreshold: {
    global: { lines: 80, statements: 80, functions: 80, branches: 60 },
  },
};
