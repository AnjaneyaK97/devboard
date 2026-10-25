import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seedDatabase } from '../../src/seeds/seed.js';
import { User, Job, Application, SavedJob, SavedSearch, Notification, AuditLog } from '../../src/models/index.js';

describe('Seed Script Unit Test', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
  }, 30000);

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('should successfully execute seedDatabase and create users, jobs, applications, and logs', async () => {
    const uri = mongoServer.getUri();
    await seedDatabase(uri);

    // Reconnect to verify seeded data in memory
    await mongoose.connect(uri);

    const [userCount, jobCount, appCount, savedJobCount, savedSearchCount, notifCount, auditCount] =
      await Promise.all([
        User.countDocuments({}),
        Job.countDocuments({}),
        Application.countDocuments({}),
        SavedJob.countDocuments({}),
        SavedSearch.countDocuments({}),
        Notification.countDocuments({}),
        AuditLog.countDocuments({}),
      ]);

    expect(userCount).toBe(9); // 1 admin + 3 employers + 5 seekers
    expect(jobCount).toBe(12);
    expect(appCount).toBeGreaterThanOrEqual(10);
    expect(savedJobCount).toBeGreaterThanOrEqual(1);
    expect(savedSearchCount).toBeGreaterThanOrEqual(1);
    expect(notifCount).toBeGreaterThanOrEqual(1);
    expect(auditCount).toBeGreaterThanOrEqual(1);

    // Verify admin user
    const admin = await User.findOne({ role: 'admin' });
    expect(admin).not.toBeNull();
    expect(admin.email).toBe('admin@devboard.io');

    await mongoose.disconnect();
  }, 30000);
});
