const { validationResult } = require('express-validator');

// Centralized request validation response.
// Routes register validation rules; this middleware turns failures into 400 JSON.
function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return res.status(400).json({ message: 'Validation failed', errors: result.array() });
}

module.exports = { handleValidation };
