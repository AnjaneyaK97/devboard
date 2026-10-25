import request from 'supertest';
import app from '../../src/app.js';
import { setupTestDB, createTestUser } from '../setup.js';
import { Job, Application } from '../../src/models/index.js';

describe('Application Lifecycle & Workflow Integration Tests', () => {
  setupTestDB();

  let employerUser;
  let employerToken;
  let otherEmployerToken;
  let seekerUser;
  let seekerToken;
  let otherSeekerToken;
  let activeJob;

  beforeEach(async () => {
    // 1. Create primary employer
    const emp = await createTestUser({
      name: 'Tech Lead Recruiter',
      email: 'recruiter@techlead.com',
      role: 'employer',
      companyName: 'TechLead Co',
    });
    employerUser = emp.user;
    employerToken = emp.authHeader;

    // 2. Create secondary employer
    const otherEmp = await createTestUser({
      name: 'Other Recruiter',
      email: 'recruiter@other.com',
      role: 'employer',
      companyName: 'Other Corp',
    });
    otherEmployerToken = otherEmp.authHeader;

    // 3. Create primary seeker
    const seeker = await createTestUser({
      name: 'Alice Developer',
      email: 'alice@seeker.com',
      role: 'seeker',
      skills: ['react', 'node.js', 'typescript'],
      experienceYears: 4,
    });
    seekerUser = seeker.user;
    seekerToken = seeker.authHeader;

    // 4. Create secondary seeker
    const otherSeeker = await createTestUser({
      name: 'Bob Candidate',
      email: 'bob@seeker.com',
      role: 'seeker',
    });
    otherSeekerToken = otherSeeker.authHeader;

    // 5. Create an active job posting
    activeJob = await Job.create({
      title: 'Senior Full-Stack Engineer',
      description: 'Looking for a solid engineer with React and Node.js background.',
      company: 'TechLead Co',
      location: 'San Francisco, CA',
      jobType: 'full-time',
      experienceLevel: 'senior',
      salaryMin: 140000,
      salaryMax: 180000,
      skills: ['react', 'node.js'],
      postedBy: employerUser._id,
      status: 'active',
    });
  });

  describe('POST /api/v1/applications (Apply)', () => {
    it('should submit an application, compute match score, and record initial status history', async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', seekerToken)
        .send({
          jobId: activeJob._id.toString(),
          resumeUrl: 'https://cdn.devboard.io/resumes/alice_resume.pdf',
          resumeOriginalName: 'alice_resume.pdf',
          coverNote: 'I have 4 years of hands-on experience in React and Node.js.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application.status).toBe('applied');
      expect(res.body.data.application.matchScore).toBe(100); // 2 out of 2 skills matched
      expect(res.body.data.application.statusHistory.length).toBe(1);
      expect(res.body.data.application.statusHistory[0].status).toBe('applied');

      // Verify job applications count incremented
      const updatedJob = await Job.findById(activeJob._id);
      expect(updatedJob.applicationsCount).toBe(1);
    });

    it('should prevent duplicate applications with 409 Conflict', async () => {
      // First application
      await request(app)
        .post('/api/v1/applications')
        .set('Authorization', seekerToken)
        .send({
          jobId: activeJob._id.toString(),
          resumeUrl: 'https://cdn.devboard.io/resumes/alice_resume.pdf',
        });

      // Duplicate attempt
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', seekerToken)
        .send({
          jobId: activeJob._id.toString(),
          resumeUrl: 'https://cdn.devboard.io/resumes/alice_resume.pdf',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already applied/i);
    });

    it('should forbid employers from applying to their own job', async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', employerToken)
        .send({
          jobId: activeJob._id.toString(),
          resumeUrl: 'https://cdn.devboard.io/resumes/employer_resume.pdf',
        });

      expect(res.status).toBe(403); // restricted to seeker
    });

    it('should reject application to non-active jobs', async () => {
      const closedJob = await Job.create({
        title: 'Archived Role',
        description: 'Old role no longer hiring.',
        company: 'TechLead Co',
        location: 'Remote',
        jobType: 'full-time',
        experienceLevel: 'entry',
        skills: ['python'],
        postedBy: employerUser._id,
        status: 'closed',
      });

      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', seekerToken)
        .send({
          jobId: closedJob._id.toString(),
          resumeUrl: 'https://cdn.devboard.io/resumes/alice_resume.pdf',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/no longer accepting applications/i);
    });
  });

  describe('GET /api/v1/applications/my', () => {
    it('should list all applications for the logged-in seeker', async () => {
      await request(app)
        .post('/api/v1/applications')
        .set('Authorization', seekerToken)
        .send({
          jobId: activeJob._id.toString(),
          resumeUrl: 'https://cdn.devboard.io/resumes/alice_resume.pdf',
        });

      const res = await request(app)
        .get('/api/v1/applications/my')
        .set('Authorization', seekerToken);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].job.title).toBe('Senior Full-Stack Engineer');
    });
  });

  describe('GET /api/v1/applications/job/:jobId (Owner-restricted)', () => {
    it('should allow the job owner to view applicants', async () => {
      await request(app)
        .post('/api/v1/applications')
        .set('Authorization', seekerToken)
        .send({
          jobId: activeJob._id.toString(),
          resumeUrl: 'https://cdn.devboard.io/resumes/alice_resume.pdf',
        });

      const res = await request(app)
        .get(`/api/v1/applications/job/${activeJob._id}`)
        .set('Authorization', employerToken);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].applicant.name).toBe('Alice Developer');
    });

    it('should forbid a foreign employer from viewing applicants (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/applications/job/${activeJob._id}`)
        .set('Authorization', otherEmployerToken);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/forbidden/i);
    });
  });

  describe('PATCH /api/v1/applications/:id/status (Status Transitions & History)', () => {
    let application;

    beforeEach(async () => {
      const appRes = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', seekerToken)
        .send({
          jobId: activeJob._id.toString(),
          resumeUrl: 'https://cdn.devboard.io/resumes/alice_resume.pdf',
        });
      application = appRes.body.data.application;
    });

    it('should transition status and append to statusHistory timeline', async () => {
      // 1. Move to interview
      const res = await request(app)
        .patch(`/api/v1/applications/${application._id}/status`)
        .set('Authorization', employerToken)
        .send({
          status: 'interview',
          note: 'Scheduled technical round with engineering team',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.application.status).toBe('interview');
      expect(res.body.data.application.statusHistory.length).toBe(2);
      expect(res.body.data.application.statusHistory[1].status).toBe('interview');
      expect(res.body.data.application.statusHistory[1].note).toBe(
        'Scheduled technical round with engineering team'
      );
    });

    it('should forbid foreign employer from updating applicant status', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${application._id}/status`)
        .set('Authorization', otherEmployerToken)
        .send({ status: 'shortlisted' });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/applications/:id/withdraw (Withdrawal)', () => {
    let application;

    beforeEach(async () => {
      const appRes = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', seekerToken)
        .send({
          jobId: activeJob._id.toString(),
          resumeUrl: 'https://cdn.devboard.io/resumes/alice_resume.pdf',
        });
      application = appRes.body.data.application;
    });

    it('should allow candidate to withdraw application and decrement job counter', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${application._id}/withdraw`)
        .set('Authorization', seekerToken)
        .send({ note: 'Accepted another offer' });

      expect(res.status).toBe(200);
      expect(res.body.data.application.status).toBe('withdrawn');

      // Verify job applications count decremented
      const updatedJob = await Job.findById(activeJob._id);
      expect(updatedJob.applicationsCount).toBe(0);
    });

    it('should forbid other candidates from withdrawing someone else’s application', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${application._id}/withdraw`)
        .set('Authorization', otherSeekerToken);

      expect(res.status).toBe(403);
    });
  });
});
