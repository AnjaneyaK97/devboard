import mongoose from 'mongoose';
import {
  getEmployerSummary,
  getEmployerFunnel,
  getTimeToHire,
} from '../../src/services/analytics.service.js';
import { Job, Application, User } from '../../src/models/index.js';
import { APPLICATION_STATUS } from '../../src/constants/status.js';
import { setupTestDB } from '../setup.js';

describe('Analytics Aggregation Pipelines Unit Tests', () => {
  setupTestDB();

  let employerId;
  let candidate1;
  let candidate2;
  let job1;
  let job2;

  beforeEach(async () => {
    employerId = new mongoose.Types.ObjectId();

    // Create candidates
    candidate1 = await User.create({
      name: 'Dev One',
      email: 'dev1@example.com',
      password: 'Password123!',
      role: 'seeker',
    });

    candidate2 = await User.create({
      name: 'Dev Two',
      email: 'dev2@example.com',
      password: 'Password123!',
      role: 'seeker',
    });

    // Create jobs for employer
    job1 = await Job.create({
      postedBy: employerId,
      title: 'Fullstack Architect',
      description: 'Designing distributed microservices and event-driven architecture.',
      company: 'DataCorp',
      location: 'Remote',
      jobType: 'full-time',
      experienceLevel: 'lead',
      views: 100,
      applicationsCount: 2,
      status: 'active',
    });

    job2 = await Job.create({
      postedBy: employerId,
      title: 'Frontend Engineer',
      description: 'Building modern interfaces with React and Tailwind.',
      company: 'DataCorp',
      location: 'Remote',
      jobType: 'full-time',
      experienceLevel: 'senior',
      views: 50,
      applicationsCount: 1,
      status: 'closed',
    });

    // Create applications with statusHistory
    const appDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const hireDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago (8 days to hire)

    await Application.create({
      job: job1._id,
      applicant: candidate1._id,
      resumeUrl: '/uploads/resumes/dev1.pdf',
      status: APPLICATION_STATUS.HIRED,
      createdAt: appDate,
      statusHistory: [
        { status: APPLICATION_STATUS.APPLIED, changedBy: candidate1._id, at: appDate },
        { status: APPLICATION_STATUS.UNDER_REVIEW, changedBy: employerId, at: new Date(appDate.getTime() + 1000 * 3600 * 24) },
        { status: APPLICATION_STATUS.SHORTLISTED, changedBy: employerId, at: new Date(appDate.getTime() + 1000 * 3600 * 48) },
        { status: APPLICATION_STATUS.INTERVIEW, changedBy: employerId, at: new Date(appDate.getTime() + 1000 * 3600 * 72) },
        { status: APPLICATION_STATUS.OFFERED, changedBy: employerId, at: new Date(appDate.getTime() + 1000 * 3600 * 120) },
        { status: APPLICATION_STATUS.HIRED, changedBy: employerId, at: hireDate },
      ],
    });

    await Application.create({
      job: job1._id,
      applicant: candidate2._id,
      resumeUrl: '/uploads/resumes/dev2.pdf',
      status: APPLICATION_STATUS.INTERVIEW,
      createdAt: appDate,
      statusHistory: [
        { status: APPLICATION_STATUS.APPLIED, changedBy: candidate2._id, at: appDate },
        { status: APPLICATION_STATUS.UNDER_REVIEW, changedBy: employerId, at: new Date(appDate.getTime() + 1000 * 3600 * 24) },
        { status: APPLICATION_STATUS.INTERVIEW, changedBy: employerId, at: new Date(appDate.getTime() + 1000 * 3600 * 72) },
      ],
    });
  });

  describe('getEmployerSummary', () => {
    it('should aggregate total jobs, active/closed counts, views, and overall conversion rate', async () => {
      const { overview, jobPerformance } = await getEmployerSummary(employerId);

      expect(overview.totalJobs).toBe(2);
      expect(overview.activeJobs).toBe(1);
      expect(overview.closedJobs).toBe(1);
      expect(overview.totalViews).toBe(150);
      expect(overview.totalApplications).toBe(3);
      expect(overview.overallConversionRate).toBe(2); // (3 / 150) * 100 = 2.0%

      expect(jobPerformance.length).toBe(2);
      const perfJob1 = jobPerformance.find((p) => p._id.toString() === job1._id.toString());
      expect(perfJob1.conversionRate).toBe(2); // 2 apps / 100 views = 2%
    });

    it('should return empty zeros if employer has no jobs', async () => {
      const nonExistent = new mongoose.Types.ObjectId();
      const { overview, jobPerformance } = await getEmployerSummary(nonExistent);

      expect(overview.totalJobs).toBe(0);
      expect(overview.totalViews).toBe(0);
      expect(overview.overallConversionRate).toBe(0);
      expect(jobPerformance).toEqual([]);
    });
  });

  describe('getEmployerFunnel', () => {
    it('should compute cumulative funnel stages and stage dropoff rates', async () => {
      const { funnel, totalApplications } = await getEmployerFunnel(employerId, job1._id);

      expect(totalApplications).toBe(2);
      expect(funnel).toBeDefined();

      const appliedStage = funnel.find((s) => s.stage === 'Applied');
      const interviewStage = funnel.find((s) => s.stage === 'Interview');
      const hiredStage = funnel.find((s) => s.stage === 'Hired');

      expect(appliedStage.count).toBe(2);
      expect(interviewStage.count).toBe(2); // both reached interview
      expect(hiredStage.count).toBe(1); // 1 reached hired
      expect(hiredStage.conversionRate).toBe(50); // 1 / 2 = 50%
    });
  });

  describe('getTimeToHire', () => {
    it('should calculate time to hire duration in days correctly', async () => {
      const result = await getTimeToHire(employerId, job1._id);

      expect(result.totalHires).toBe(1);
      expect(result.avgDaysToHire).toBeCloseTo(8, 0); // ~8 days between appDate and hireDate
      expect(result.recentHires.length).toBe(1);
      expect(result.recentHires[0].applicantName).toBe('Dev One');
      expect(result.recentHires[0].jobTitle).toBe('Fullstack Architect');
    });

    it('should return zeros when there are no hired candidates', async () => {
      const result = await getTimeToHire(employerId, job2._id);
      expect(result.totalHires).toBe(0);
      expect(result.avgDaysToHire).toBe(0);
    });
  });
});
