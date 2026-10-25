/**
 * Recursively cleans an object or value by stripping keys starting with '$' or containing '.'
 * to prevent NoSQL operator injection attacks (e.g., { "$gt": "" }).
 */
const sanitizeNoSql = (target) => {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map((item) => sanitizeNoSql(item));
  }

  const cleanObj = {};
  for (const [key, value] of Object.entries(target)) {
    // Strip keys starting with $ or containing .
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleanObj[key] = sanitizeNoSql(value);
  }
  return cleanObj;
};

/**
 * Basic XSS string sanitizer that escapes dangerous HTML characters in user input
 */
const sanitizeXss = (target) => {
  if (typeof target === 'string') {
    return target
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/onerror\s*=/gi, '')
      .replace(/onload\s*=/gi, '');
  }

  if (Array.isArray(target)) {
    return target.map((item) => sanitizeXss(item));
  }

  if (target && typeof target === 'object') {
    const cleanObj = {};
    for (const [key, value] of Object.entries(target)) {
      cleanObj[key] = sanitizeXss(value);
    }
    return cleanObj;
  }

  return target;
};

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 */
export const sanitizeInput = (req, _res, next) => {
  if (req.body) {
    req.body = sanitizeXss(sanitizeNoSql(req.body));
  }
  if (req.query) {
    req.query = sanitizeXss(sanitizeNoSql(req.query));
  }
  if (req.params) {
    req.params = sanitizeXss(sanitizeNoSql(req.params));
  }
  next();
};
