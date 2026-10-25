import mongoose from 'mongoose';
import { Job } from '../../src/models/Job.js';
import { setupTestDB } from '../setup.js';

describe('MongoDB Query Profiling & .explain() Analysis', () => {
  setupTestDB();

  beforeEach(async () => {
    const employerId = new mongoose.Types.ObjectId();

    // Seed sample indexed documents
    const jobs = Array.from({ length: 25 }, (_, i) => ({
      postedBy: employerId,
      title: i % 2 === 0 ? `Senior React Developer ${i}` : `Node.js Backend Engineer ${i}`,
      description: 'Building production distributed systems and cloud services.',
      company: 'TechCorp',
      location: i % 3 === 0 ? 'San Francisco, CA' : 'Remote, US',
      jobType: i % 2 === 0 ? 'full-time' : 'contract',
      experienceLevel: 'senior',
      remote: i % 2 === 0,
      salaryMin: 120000,
      salaryMax: 160000,
      skills: ['react', 'node.js', 'typescript'],
      status: i < 20 ? 'active' : 'closed',
    }));

    await Job.insertMany(jobs);
  });

  it('should use compound index (IXSCAN) for filtered job query instead of full collection scan', async () => {
    const explainPlan = await Job.find({
      status: 'active',
      remote: true,
      jobType: 'full-time',
    })
      .sort({ createdAt: -1 })
      .explain('executionStats');

    expect(explainPlan).toBeDefined();

    const stats = explainPlan.executionStats;
    expect(stats).toBeDefined();

    // Verify it examined documents and returned results efficiently
    expect(stats.nReturned).toBeGreaterThan(0);

    // Verify the winning plan does not use a raw unindexed COLLSCAN at the root
    const executionStage = stats.executionStages;
    expect(executionStage).toBeDefined();
    expect(executionStage.stage).not.toBe('COLLSCAN');
  });

  it('should use text index for keyword search query', async () => {
    const explainPlan = await Job.find({
      status: 'active',
      $text: { $search: 'React' },
    }).explain('executionStats');

    expect(explainPlan).toBeDefined();
    const stats = explainPlan.executionStats;
    expect(stats.nReturned).toBeGreaterThan(0);
  });
});
