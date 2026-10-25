import mongoose from 'mongoose';
import {
  createSavedSearch,
  getUserSavedSearches,
  deleteSavedSearch,
  evaluateAndNotifySavedSearches,
} from '../../src/services/savedSearch.service.js';
import { SavedSearch } from '../../src/models/SavedSearch.js';
import { Notification } from '../../src/models/Notification.js';
import { User } from '../../src/models/User.js';
import { setupTestDB } from '../setup.js';

describe('SavedSearch Service & Alert Evaluator Unit Tests', () => {
  setupTestDB();

  let seekerUser;
  let employerUser;

  beforeEach(async () => {

    seekerUser = await User.create({
      name: 'Alert Seeker',
      email: 'seeker-alert@example.com',
      password: 'Password123!',
      role: 'seeker',
      skills: ['react', 'node.js'],
      isActive: true,
    });

    employerUser = await User.create({
      name: 'Tech Boss',
      email: 'employer-boss@example.com',
      password: 'Password123!',
      role: 'employer',
      companyName: 'ScaleTech',
      isActive: true,
    });
  });

  it('should create and retrieve saved search preferences', async () => {
    const search = await createSavedSearch(seekerUser._id, {
      title: 'Senior Frontend Remote',
      criteria: {
        keyword: 'Frontend',
        remote: true,
        salaryMin: 120000,
      },
      alertFrequency: 'immediate',
    });

    expect(search).toBeDefined();
    expect(search.title).toBe('Senior Frontend Remote');
    expect(search.criteria.remote).toBe(true);

    const list = await getUserSavedSearches(seekerUser._id);
    expect(list.length).toBe(1);
    expect(list[0].title).toBe('Senior Frontend Remote');
  });

  it('should delete a saved search', async () => {
    const search = await createSavedSearch(seekerUser._id, {
      title: 'DevOps Alert',
      criteria: { keyword: 'kubernetes' },
    });

    await deleteSavedSearch(search._id, seekerUser._id);
    const list = await getUserSavedSearches(seekerUser._id);
    expect(list.length).toBe(0);
  });

  it('should match a new job against criteria and create a notification for the seeker', async () => {
    await createSavedSearch(seekerUser._id, {
      title: 'Fullstack React Roles',
      criteria: {
        keyword: 'React',
        remote: true,
      },
      alertFrequency: 'immediate',
    });

    const matchingJob = {
      _id: new mongoose.Types.ObjectId(),
      postedBy: employerUser._id,
      title: 'Senior React Developer',
      description: 'Building modern interfaces with React and Redux',
      company: 'ScaleTech',
      location: 'Remote, US',
      jobType: 'full-time',
      experienceLevel: 'senior',
      remote: true,
      salaryMin: 130000,
      salaryMax: 160000,
      skills: ['react', 'typescript'],
    };

    await evaluateAndNotifySavedSearches(matchingJob);

    // Verify Notification was generated
    const notifications = await Notification.find({ user: seekerUser._id });
    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe('job_alert');
    expect(notifications[0].title).toContain('Job Alert: Senior React Developer');
    expect(notifications[0].message).toContain('ScaleTech posted a new role');
  });

  it('should NOT trigger notification when criteria does not match', async () => {
    await createSavedSearch(seekerUser._id, {
      title: 'Python Only',
      criteria: {
        keyword: 'Django',
        remote: false,
      },
      alertFrequency: 'immediate',
    });

    const nonMatchingJob = {
      _id: new mongoose.Types.ObjectId(),
      postedBy: employerUser._id,
      title: 'Java Engineer',
      description: 'Enterprise Spring Boot applications',
      company: 'ScaleTech',
      location: 'New York, NY',
      jobType: 'full-time',
      experienceLevel: 'mid',
      remote: true,
      salaryMin: 100000,
      salaryMax: 120000,
      skills: ['java', 'spring'],
    };

    await evaluateAndNotifySavedSearches(nonMatchingJob);

    const notifications = await Notification.find({ user: seekerUser._id });
    expect(notifications.length).toBe(0);
  });

  it('should NOT notify the employer who posted the job if they saved a search', async () => {
    await createSavedSearch(employerUser._id, {
      title: 'Employer Own Search',
      criteria: { keyword: 'React' },
      alertFrequency: 'immediate',
    });

    const job = {
      _id: new mongoose.Types.ObjectId(),
      postedBy: employerUser._id,
      title: 'React Dev',
      description: 'React role',
      company: 'ScaleTech',
      remote: true,
      salaryMin: 100000,
      salaryMax: 150000,
      skills: ['react'],
    };

    await evaluateAndNotifySavedSearches(job);

    const notifications = await Notification.find({ user: employerUser._id });
    expect(notifications.length).toBe(0);
  });
});
