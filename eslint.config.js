const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-inline-comments": "off",
      "no-shadow": "off",
      "no-empty": "off"
    }
  }
];