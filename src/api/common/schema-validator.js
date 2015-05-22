'use strict';
const fs = require('fs');
const path = require('path');
const JaySchema = require('jayschema');
const formatJaySchemaErrors = require('jayschema-error-messages');

const baseDir = path.join(__dirname, './schemas');

module.exports = (function() {
  const validator = new JaySchema();
  const validate = validator.validate;

  // If schema is valid, return true. Otherwise
  // return array of validation errors
  validator.validate = function() {
    const errors = validate.apply(validator, arguments);
    return {
      err: errors,
      errors: formatJaySchemaErrors(errors),
      isValid: errors.length === 0
    };
  };

  validator.isValid = function() {
    return validator.validate.apply(validator, arguments).isValid;
  };

  // Load Schemas
  fs.readdirSync(baseDir).filter(function(fileName) {
    return /^[\w\s]+\.json$/.test(fileName);
  })
  .map(function(fileName) {
    try {
      return JSON.parse(fs.readFileSync(path.join(baseDir, fileName), 'utf8'));
    } catch (e) {
      throw new Error('Failed to parse schema: ' + fileName);
    }
  })
  .forEach(function(schema) {
    schema.id = schema.title;
    validator.register(schema);
  });

  return validator;
})();
