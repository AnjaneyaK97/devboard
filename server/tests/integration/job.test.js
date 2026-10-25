import request from 'supertest';
import app from '../../src/app.js';
import { setupTestDB, createTestUser } from '../setup.js';
import { Job } from '../../src/models/index.js';

describe('Job CRUD & Search Integration Tests', () => {
  setupTestDB();

  let employerUser;
  let employerToken;
  let seekerUser;
  let seekerToken;
  let otherEmployerToken;

  beforeEach(async () => {
    // 1. Create primary employer
    const emp = await createTestUser({
      name: 'Acme Tech Recruiter',
      email: 'recruiter@acme.com',
      role: 'employer',
      companyName: 'Acme Technologies',
    });
    employerUser = emp.user;
    employerToken = emp.authHeader;

    // 2. Create another employer (for owner-restriction testing)
    const otherEmp = await createTestUser({
      name: 'Beta Corp Recruiter',
      email: 'recruiter@beta.com',
      role: 'employer',
      companyName: 'Beta Corp',
    });
    otherEmployerToken = otherEmp.authHeader;

    // 3. Create job seeker
    const seeker = await createTestUser({
      name: 'John Seeker',
      email: 'john@seeker.com',
      role: 'seeker',
    });
    seekerUser = seeker.user;
    seekerToken = seeker.authHeader;
  });

  describe('POST /api/v1/jobs', () => {
    const validJob = {
      title: 'Senior React Developer',
      description: 'We are seeking an experienced React engineer with strong TypeScript and Node.js skills.',
      company: 'Acme Technologies',
      location: 'Remote, US',
      jobType: 'full-time',
      experienceLevel: 'senior',
      salaryMin: 120000,
      salaryMax: 160000,
      skills: ['react', 'typescript', 'node.js', 'tailwindcss'],
      remote: true,
    };

    it('should allow an employer to create a job listing', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', employerToken)
        .send(validJob);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.job.title).toBe('Senior React Developer');
      expect(res.body.data.job.postedBy).toBe(employerUser._id.toString());
      expect(res.body.data.job.skills).toContain('react');
    });

    it('should forbid a job seeker from creating a job (403)', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', seekerToken)
        .send(validJob);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden/i);
    });

    it('should reject invalid salary ranges (min > max)', async () => {
      const invalidSalaryJob = {
        ...validJob,
        salaryMin: 200000,
        salaryMax: 100000,
      };

      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', employerToken)
        .send(invalidSalaryJob);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/jobs (Search, Filters, Pagination)', () => {
    beforeEach(async () => {
      // Seed sample jobs
      await Job.create([
        {
          title: 'Full-Stack Node.js Engineer',
          description: 'Building distributed microservices and GraphQL APIs with Node.js and MongoDB.',
          company: 'Acme Technologies',
          location: 'San Francisco, CA',
          jobType: 'full-time',
          experienceLevel: 'mid',
          salaryMin: 110000,
          salaryMax: 140000,
          skills: ['node.js', 'mongodb', 'docker'],
          remote: false,
          status: 'active',
          postedBy: employerUser._id,
        },
        {
          title: 'Lead Python Backend Engineer',
          description: 'Architecting machine learning pipelines and FastAPI microservices.',
          company: 'DataFlow Inc',
          location: 'New York, NY',
          jobType: 'contract',
          experienceLevel: 'lead',
          salaryMin: 160000,
          salaryMax: 200000,
          skills: ['python', 'fastapi', 'postgresql'],
          remote: true,
          status: 'active',
          postedBy: employerUser._id,
        },
        {
          title: 'Frontend React UI/UX Specialist',
          description: 'Creating delightful accessible user interfaces with React and Tailwind CSS.',
          company: 'DesignWorks',
          location: 'Austin, TX',
          jobType: 'full-time',
          experienceLevel: 'senior',
          salaryMin: 130000,
          salaryMax: 160000,
          skills: ['react', 'tailwindcss', 'figma'],
          remote: true,
          status: 'active',
          postedBy: employerUser._id,
        },
      ]);
    });

    it('should return all active jobs with pagination metadata', async () => {
      const res = await request(app).get('/api/v1/jobs?page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.pagination.totalPages).toBe(2);
      expect(res.body.pagination.hasNextPage).toBe(true);
    });

    it('should filter jobs by remote status', async () => {
      const res = await request(app).get('/api/v1/jobs?remote=true');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      res.body.data.forEach((job) => expect(job.remote).toBe(true));
    });

    it('should filter jobs by jobType and experienceLevel', async () => {
      const res = await request(app).get('/api/v1/jobs?jobType=contract&experienceLevel=lead');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Lead Python Backend Engineer');
    });

    it('should filter by skills', async () => {
      const res = await request(app).get('/api/v1/jobs?skills=react');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].skills).toContain('react');
    });
  });

  describe('GET /api/v1/jobs/:id', () => {
    it('should retrieve job details with company and user status', async () => {
      const job = await Job.create({
        title: 'DevOps Cloud Engineer',
        description: 'Manage AWS infrastructure with Terraform and Kubernetes.',
        company: 'CloudNova',
        location: 'Seattle, WA',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['aws', 'kubernetes', 'terraform'],
        postedBy: employerUser._id,
      });

      const res = await request(app)
        .get(`/api/v1/jobs/${job._id}`)
        .set('Authorization', seekerToken);

      expect(res.status).toBe(200);
      expect(res.body.data.job.title).toBe('DevOps Cloud Engineer');
      expect(res.body.data.job.hasApplied).toBe(false);
      expect(res.body.data.job.isSaved).toBe(false);
    });

    it('should return 404 for invalid job ID', async () => {
      const res = await request(app).get('/api/v1/jobs/65f123456789abcdef012345');
      expect(res.status).toBe(404);
    });
  });

  describe('Owner Restrictions (PUT & DELETE)', () => {
    let ownedJob;

    beforeEach(async () => {
      ownedJob = await Job.create({
        title: 'Original Title',
        description: 'Original description for testing owner restrictions.',
        company: 'Acme Technologies',
        location: 'Denver, CO',
        jobType: 'full-time',
        experienceLevel: 'entry',
        skills: ['javascript'],
        postedBy: employerUser._id,
      });
    });

    it('should allow the owner employer to update their job', async () => {
      const res = await request(app)
        .put(`/api/v1/jobs/${ownedJob._id}`)
        .set('Authorization', employerToken)
        .send({ title: 'Updated Engineer Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.job.title).toBe('Updated Engineer Title');
    });

    it('should forbid another employer from updating someone else’s job', async () => {
      const res = await request(app)
        .put(`/api/v1/jobs/${ownedJob._id}`)
        .set('Authorization', otherEmployerToken)
        .send({ title: 'Malicious Update' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/forbidden/i);
    });

    it('should allow owner employer to delete their job', async () => {
      const res = await request(app)
        .delete(`/api/v1/jobs/${ownedJob._id}`)
        .set('Authorization', employerToken);

      expect(res.status).toBe(200);
      const check = await Job.findById(ownedJob._id);
      expect(check).toBeNull();
    });

    it('should forbid another employer from deleting someone else’s job', async () => {
      const res = await request(app)
        .delete(`/api/v1/jobs/${ownedJob._id}`)
        .set('Authorization', otherEmployerToken);

      expect(res.status).toBe(403);
      const check = await Job.findById(ownedJob._id);
      expect(check).not.toBeNull();
    });
  });

  describe('POST /api/v1/jobs/:id/view', () => {
    it('should increment job views count', async () => {
      const job = await Job.create({
        title: 'View Counter Test',
        description: 'Testing view increment logic on job postings.',
        company: 'ViewCorp',
        location: 'Remote',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['sql'],
        postedBy: employerUser._id,
        views: 10,
      });

      const res = await request(app).post(`/api/v1/jobs/${job._id}/view`);

      expect(res.status).toBe(200);
      expect(res.body.data.views).toBe(11);
    });
  });
});
