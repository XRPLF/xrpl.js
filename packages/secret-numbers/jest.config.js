// Jest configuration for api
const base = require("../../jest.config.base.js");

module.exports = {
  ...base,
  roots: [...base.roots, "<rootDir>/test"],
  displayName: "@xrplf/secret-numbers",
};
