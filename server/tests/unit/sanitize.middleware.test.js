import { jest } from '@jest/globals';
import { sanitizeInput } from '../../src/middleware/sanitize.middleware.js';

describe('Sanitize Middleware Unit Tests', () => {
  it('should strip NoSQL operator keys ($gt, $ne, etc.) from req.body', () => {
    const req = {
      body: {
        email: { $gt: '' },
        password: 'ValidPassword123!',
        nested: {
          $where: 'sleep(1000)',
          safeField: 'hello',
        },
      },
      query: {},
      params: {},
    };
    const next = jest.fn();

    sanitizeInput(req, {}, next);

    expect(req.body.email).toEqual({});
    expect(req.body.password).toBe('ValidPassword123!');
    expect(req.body.nested).toEqual({ safeField: 'hello' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should strip keys containing dots from req.query to prevent prototype pollution', () => {
    const req = {
      body: {},
      query: {
        'user.role': 'admin',
        keyword: 'developer',
      },
      params: {},
    };
    const next = jest.fn();

    sanitizeInput(req, {}, next);

    expect(req.query['user.role']).toBeUndefined();
    expect(req.query.keyword).toBe('developer');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should sanitize script tags and dangerous event handlers from string inputs', () => {
    const req = {
      body: {
        coverNote: 'Hello <script>alert("xss")</script> I am excited for this role.',
        bio: '<img src="x" onerror="stealCookies()">Experienced software architect',
        link: 'javascript:void(0)',
      },
      query: {},
      params: {},
    };
    const next = jest.fn();

    sanitizeInput(req, {}, next);

    expect(req.body.coverNote).not.toContain('<script>');
    expect(req.body.coverNote).toContain('Hello  I am excited for this role.');
    expect(req.body.bio).not.toContain('onerror=');
    expect(req.body.link).not.toContain('javascript:');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
