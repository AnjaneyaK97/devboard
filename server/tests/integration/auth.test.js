import request from 'supertest';
import app from '../../src/app.js';
import { setupTestDB, createTestUser } from '../setup.js';
import { User } from '../../src/models/index.js';

describe('Auth & RBAC Integration Tests', () => {
  setupTestDB();

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a job seeker and return tokens', async () => {
      const payload = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'SecurePassword123!',
        role: 'seeker',
        skills: ['react', 'node.js'],
        experienceYears: 4,
      };

      const res = await request(app).post('/api/v1/auth/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.user.role).toBe('seeker');
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data).toHaveProperty('accessToken');

      // Verify cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken');
    });

    it('should require companyName when registering as an employer', async () => {
      const payload = {
        name: 'John Employer',
        email: 'john@employer.com',
        password: 'SecurePassword123!',
        role: 'employer',
        // missing companyName
      };

      const res = await request(app).post('/api/v1/auth/register').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should prevent registration with duplicate email', async () => {
      await createTestUser({ email: 'duplicate@test.com' });

      const payload = {
        name: 'Duplicate User',
        email: 'duplicate@test.com',
        password: 'SecurePassword123!',
        role: 'seeker',
      };

      const res = await request(app).post('/api/v1/auth/register').send(payload);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should authenticate user with valid credentials', async () => {
      await createTestUser({ email: 'login_test@example.com', password: 'CorrectPassword123!' });

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'login_test@example.com',
        password: 'CorrectPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe('login_test@example.com');
    });

    it('should reject invalid password', async () => {
      await createTestUser({ email: 'wrong_pass@example.com', password: 'CorrectPassword123!' });

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'wrong_pass@example.com',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should rotate refresh token and provide new access token', async () => {
      // 1. Register to get initial tokens and cookie
      const regRes = await request(app).post('/api/v1/auth/register').send({
        name: 'Refresh User',
        email: 'refresh_test@example.com',
        password: 'Password123!',
        role: 'seeker',
      });

      const cookies = regRes.headers['set-cookie'];

      // 2. Call refresh using the cookie
      const refRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies);

      expect(refRes.status).toBe(200);
      expect(refRes.body.success).toBe(true);
      expect(refRes.body.data).toHaveProperty('accessToken');
      expect(refRes.headers['set-cookie']).toBeDefined();
    });

    it('should detect token reuse and invalidate all sessions', async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send({
        name: 'Reuse User',
        email: 'reuse_test@example.com',
        password: 'Password123!',
        role: 'seeker',
      });

      const initialCookie = regRes.headers['set-cookie'];

      // First refresh consumes the token
      await request(app).post('/api/v1/auth/refresh').set('Cookie', initialCookie);

      // Replay attack: attempting to reuse old consumed token
      const attackRes = await request(app).post('/api/v1/auth/refresh').set('Cookie', initialCookie);
      expect(attackRes.status).toBe(401);

      // Verify all tokens were purged from DB
      const user = await User.findOne({ email: 'reuse_test@example.com' });
      expect(user.refreshTokens.length).toBe(0);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user for authenticated request', async () => {
      const { authHeader, user } = await createTestUser();

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(user.email);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/auth/profile', () => {
    it('should update user bio, location, and skills', async () => {
      const { authHeader } = await createTestUser();

      const res = await request(app)
        .patch('/api/v1/auth/profile')
        .set('Authorization', authHeader)
        .send({
          bio: 'Passionate full-stack developer',
          location: 'San Francisco, CA',
          skills: ['typescript', 'react', 'graphql'],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.bio).toBe('Passionate full-stack developer');
      expect(res.body.data.user.location).toBe('San Francisco, CA');
      expect(res.body.data.user.skills).toEqual(['typescript', 'react', 'graphql']);
    });
  });
});
