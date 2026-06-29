module.exports = {
  env: {
    browser: false,
    es2024: true,
    node: true,
    jest: true
  },
  extends: ["eslint:recommended", "plugin:node/recommended", "prettier"],
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: "module"
  },
  rules: {
    "no-console": "warn",
    "node/no-unsupported-features/es-syntax": [
      "error",
      {"ignores": ["modules"]}
    ]
  }
};
