import request from 'supertest';
import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, Job } from '../../src/models/index.js';

describe('Analytics API Integration Tests', () => {
  setupTestDB();

  let employerToken;
  let employerUser;
  let seekerToken;

  beforeEach(async () => {
    // Register employer
    const empRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Analytics Employer',
        email: 'employer.analytics@example.com',
        password: 'Password123!',
        role: 'employer',
        companyName: 'MetricsCorp',
      });

    employerToken = empRes.body.data.accessToken;
    employerUser = empRes.body.data.user;

    // Register seeker
    const seekRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Curious Seeker',
        email: 'seeker.analytics@example.com',
        password: 'Password123!',
        role: 'seeker',
      });

    seekerToken = seekRes.body.data.accessToken;

    // Create a job for the employer
    await Job.create({
      postedBy: employerUser._id,
      title: 'Cloud Architect',
      description: 'Designing distributed cloud architecture and infrastructure.',
      company: 'MetricsCorp',
      location: 'Remote',
      jobType: 'full-time',
      experienceLevel: 'senior',
      views: 200,
      applicationsCount: 8,
      status: 'active',
    });
  });

  describe('GET /api/v1/analytics/employer/summary', () => {
    it('should reject seeker with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/employer/summary')
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(res.status).toBe(403);
    });

    it('should return overview metrics and job performance for employer', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/employer/summary')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview.totalJobs).toBe(1);
      expect(res.body.data.overview.totalViews).toBe(200);
      expect(res.body.data.overview.totalApplications).toBe(8);
      expect(res.body.data.overview.overallConversionRate).toBe(4); // 8 / 200 * 100 = 4%
      expect(res.body.data.jobPerformance.length).toBe(1);
    });
  });

  describe('GET /api/v1/analytics/employer/funnel', () => {
    it('should return funnel stage progression and status distribution', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/employer/funnel')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.funnel)).toBe(true);
      expect(res.body.data.funnel.length).toBe(6);
    });
  });

  describe('GET /api/v1/analytics/employer/time-to-hire', () => {
    it('should return time-to-hire metrics for employer', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/employer/time-to-hire')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avgDaysToHire).toBeDefined();
    });
  });
});
