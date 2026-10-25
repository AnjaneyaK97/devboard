import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  User,
  Job,
  Application,
  SavedJob,
  SavedSearch,
  Notification,
  AuditLog,
} from '../models/index.js';
import { ROLES } from '../constants/roles.js';
import { JOB_STATUS, APPLICATION_STATUS } from '../constants/status.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const seedDatabase = async (customUri = null) => {
  try {
    const uri = customUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devboard';
    logger.info(`Connecting to MongoDB for seeding: ${uri}`);
    await mongoose.connect(uri);
    logger.info('Connected to database.');

    // 1. Clear existing collections
    logger.info('Purging existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
      SavedJob.deleteMany({}),
      SavedSearch.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    // 2. Hash common password
    const hashedPassword = await bcrypt.hash('Password123!', 12);
    const adminHashedPassword = await bcrypt.hash('Admin123!', 12);

    // 3. Create Users
    logger.info('Creating users (Admin, Employers, Job Seekers)...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@devboard.io',
      password: adminHashedPassword,
      role: ROLES.ADMIN,
      isActive: true,
    });

    const employerStripe = await User.create({
      name: 'Stripe Engineering Talent',
      email: 'recruiter@stripe.com',
      password: hashedPassword,
      role: ROLES.EMPLOYER,
      companyName: 'Stripe',
      companyWebsite: 'https://stripe.com',
      companyLogo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=128&auto=format&fit=crop&q=80',
      location: 'San Francisco, CA',
      bio: 'Financial infrastructure for the internet. Millions of companies use Stripe software to accept payments.',
      isActive: true,
    });

    const employerAirbnb = await User.create({
      name: 'Airbnb Talent Acquisition',
      email: 'recruiter@airbnb.com',
      password: hashedPassword,
      role: ROLES.EMPLOYER,
      companyName: 'Airbnb',
      companyWebsite: 'https://airbnb.com',
      companyLogo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=128&auto=format&fit=crop&q=80',
      location: 'San Francisco, CA',
      bio: 'Belong anywhere. We build real-time marketplace infrastructure serving millions of travelers worldwide.',
      isActive: true,
    });

    const employerDatadog = await User.create({
      name: 'Datadog Recruiting',
      email: 'recruiter@datadog.com',
      password: hashedPassword,
      role: ROLES.EMPLOYER,
      companyName: 'Datadog',
      companyWebsite: 'https://datadoghq.com',
      companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&auto=format&fit=crop&q=80',
      location: 'New York, NY',
      bio: 'Monitoring and security platform for cloud applications. Processing trillions of events daily.',
      isActive: true,
    });

    // Job Seekers
    const seekerAlex = await User.create({
      name: 'Alex Rivera',
      email: 'alex.dev@gmail.com',
      password: hashedPassword,
      role: ROLES.SEEKER,
      skills: ['react', 'node.js', 'typescript', 'mongodb', 'docker', 'graphql'],
      experienceYears: 6,
      location: 'Austin, TX',
      bio: 'Full-stack engineer passionate about reactive state, clean architecture, and distributed services.',
      resumeUrl: '/uploads/resumes/sample_alex_resume.pdf',
      isActive: true,
    });

    const seekerSarah = await User.create({
      name: 'Sarah Chen',
      email: 'sarah.cloud@gmail.com',
      password: hashedPassword,
      role: ROLES.SEEKER,
      skills: ['kubernetes', 'docker', 'aws', 'terraform', 'golang', 'linux'],
      experienceYears: 5,
      location: 'Seattle, WA',
      bio: 'DevOps & SRE specialist with a track record of 99.99% service level objectives in multi-cloud Kubernetes clusters.',
      resumeUrl: '/uploads/resumes/sample_sarah_resume.pdf',
      isActive: true,
    });

    const seekerMarcus = await User.create({
      name: 'Marcus Vance',
      email: 'marcus.ai@gmail.com',
      password: hashedPassword,
      role: ROLES.SEEKER,
      skills: ['python', 'pytorch', 'langchain', 'fastapi', 'docker', 'postgresql'],
      experienceYears: 4,
      location: 'New York, NY',
      bio: 'Applied AI engineer designing retrieval-augmented generation pipelines and fine-tuned embeddings.',
      resumeUrl: '/uploads/resumes/sample_marcus_resume.pdf',
      isActive: true,
    });

    const seekerElena = await User.create({
      name: 'Elena Rostova',
      email: 'elena.frontend@gmail.com',
      password: hashedPassword,
      role: ROLES.SEEKER,
      skills: ['react', 'next.js', 'typescript', 'tailwind', 'redux', 'jest'],
      experienceYears: 7,
      location: 'Remote, US',
      bio: 'Staff Frontend Engineer focusing on design systems, micro-frontends, and web performance optimization.',
      resumeUrl: '/uploads/resumes/sample_elena_resume.pdf',
      isActive: true,
    });

    const seekerJordan = await User.create({
      name: 'Jordan Miller',
      email: 'jordan.backend@gmail.com',
      password: hashedPassword,
      role: ROLES.SEEKER,
      skills: ['node.js', 'express', 'postgresql', 'redis', 'rabbitmq', 'docker'],
      experienceYears: 3,
      location: 'Chicago, IL',
      bio: 'Backend systems developer focused on ACID transaction integrity, Redis caching layers, and high-throughput APIs.',
      resumeUrl: '/uploads/resumes/sample_jordan_resume.pdf',
      isActive: true,
    });

    // 4. Create Jobs
    logger.info('Seeding realistic job postings...');
    const jobsData = [
      {
        postedBy: employerStripe._id,
        title: 'Staff Full-Stack Payments Engineer',
        description:
          'Stripe is looking for a Staff Engineer to architect our next-generation checkout flow. You will build high-reliability Node.js and TypeScript microservices handling hundreds of millions in payment volume with sub-100ms latency.',
        company: 'Stripe',
        location: 'San Francisco, CA',
        jobType: 'full-time',
        experienceLevel: 'lead',
        salaryMin: 210000,
        salaryMax: 260000,
        skills: ['typescript', 'node.js', 'react', 'distributed systems', 'postgresql'],
        remote: true,
        views: 248,
        status: JOB_STATUS.ACTIVE,
      },
      {
        postedBy: employerStripe._id,
        title: 'Senior Frontend Infrastructure Engineer',
        description:
          'Help build the core frontend foundation that powers all Stripe dashboards. You will drive React component architecture, build tools, code-splitting, and accessibility standards across engineering squads.',
        company: 'Stripe',
        location: 'Remote, US',
        jobType: 'full-time',
        experienceLevel: 'senior',
        salaryMin: 180000,
        salaryMax: 225000,
        skills: ['react', 'typescript', 'webpack', 'tailwind', 'performance'],
        remote: true,
        views: 312,
        status: JOB_STATUS.ACTIVE,
      },
      {
        postedBy: employerStripe._id,
        title: 'Backend Systems Reliability Engineer',
        description:
          'Maintain 99.999% availability on Stripe core transaction processing ledger. Experience with Redis clusters, high-concurrency Node.js/Go services, and distributed consensus algorithms required.',
        company: 'Stripe',
        location: 'San Francisco, CA',
        jobType: 'full-time',
        experienceLevel: 'senior',
        salaryMin: 195000,
        salaryMax: 240000,
        skills: ['node.js', 'golang', 'redis', 'postgresql', 'docker'],
        remote: false,
        views: 145,
        status: JOB_STATUS.ACTIVE,
      },
      {
        postedBy: employerAirbnb._id,
        title: 'Lead Platform Architect',
        description:
          'Lead architectural strategy for Airbnb multi-tenant cloud platform. You will guide technical roadmaps for booking workflows, service discovery, and database partitioning.',
        company: 'Airbnb',
        location: 'San Francisco, CA',
        jobType: 'full-time',
        experienceLevel: 'lead',
        salaryMin: 220000,
        salaryMax: 280000,
        skills: ['kubernetes', 'aws', 'distributed systems', 'golang', 'terraform'],
        remote: true,
        views: 420,
        status: JOB_STATUS.ACTIVE,
      },
      {
        postedBy: employerAirbnb._id,
        title: 'Full-Stack Product Engineer — Guest Search',
        description:
          'Transform the travel discovery experience. Work with React, Redux Toolkit, and Node.js to deliver instantaneous map-based search results to over 100M active monthly users.',
        company: 'Airbnb',
        location: 'Remote, US',
        jobType: 'full-time',
        experienceLevel: 'mid',
        salaryMin: 145000,
        salaryMax: 185000,
        skills: ['react', 'node.js', 'typescript', 'graphql', 'mongodb'],
        remote: true,
        views: 520,
        status: JOB_STATUS.ACTIVE,
      },
      {
        postedBy: employerAirbnb._id,
        title: 'Mobile React Native Specialist',
        description:
          'Create fluid, native-feeling mobile experiences for hosts and guests. Deep understanding of JavaScript event loops, native bridge optimizations, and offline sync.',
        company: 'Airbnb',
        location: 'Seattle, WA',
        jobType: 'contract',
        experienceLevel: 'senior',
        salaryMin: 160000,
        salaryMax: 190000,
        skills: ['react native', 'typescript', 'redux', 'ios', 'android'],
        remote: true,
        views: 180,
        status: JOB_STATUS.ACTIVE,
      },
      {
        postedBy: employerDatadog._id,
        title: 'Senior Cloud Observability & SRE',
        description:
          'Design telemetry collectors and real-time dashboard analytics that aggregate petabytes of logs per minute. Hands-on experience with Kubernetes operators and Prometheus required.',
        company: 'Datadog',
        location: 'New York, NY',
        jobType: 'full-time',
        experienceLevel: 'senior',
        salaryMin: 185000,
        salaryMax: 230000,
        skills: ['kubernetes', 'docker', 'golang', 'terraform', 'aws'],
        remote: true,
        views: 290,
        status: JOB_STATUS.ACTIVE,
      },
      {
        postedBy: employerDatadog._id,
        title: 'AI / Machine Learning Engineer',
        description:
          'Build predictive anomaly detection algorithms for enterprise application health. You will develop time-series machine learning models and integrate them with high-throughput streaming pipelines.',
        company: 'Datadog',
        location: 'New York, NY',
        jobType: 'full-time',
        experienceLevel: 'mid',
        salaryMin: 165000,
        salaryMax: 205000,
        skills: ['python', 'pytorch', 'fastapi', 'docker', 'machine learning'],
        remote: false,
        views: 340,
        status: JOB_STATUS.ACTIVE,
      },
      {
        postedBy: employerDatadog._id,
        title: 'Frontend Visualization Engineer (Data & Canvas)',
        description:
          'Help millions of engineers diagnose outages through real-time SVG and Canvas data charts. Strong grasp of D3.js, WebGL, Recharts, and React memory profiling.',
        company: 'Datadog',
        location: 'Remote, US',
        jobType: 'full-time',
        experienceLevel: 'senior',
        salaryMin: 175000,
        salaryMax: 215000,
        skills: ['react', 'typescript', 'd3.js', 'recharts', 'tailwind'],
        remote: true,
        views: 210,
        status: JOB_STATUS.ACTIVE,
      },
      {
        postedBy: employerStripe._id,
        title: 'Junior Backend Software Engineer',
        description:
          'Exciting entry opportunity for aspiring backend engineers to learn from world-class payments architects. Clean code practices and familiarity with REST APIs.',
        company: 'Stripe',
        location: 'Austin, TX',
        jobType: 'full-time',
        experienceLevel: 'entry',
        salaryMin: 95000,
        salaryMax: 125000,
        skills: ['javascript', 'node.js', 'express', 'sql', 'git'],
        remote: false,
        views: 450,
        status: JOB_STATUS.ACTIVE,
      },
      {
        postedBy: employerAirbnb._id,
        title: 'Contract Security Engineer — Pentesting & AppSec',
        description:
          'Conduct vulnerability assessments, OWASP audit reviews, and static code analysis across our customer-facing web endpoints.',
        company: 'Airbnb',
        location: 'Remote, US',
        jobType: 'contract',
        experienceLevel: 'senior',
        salaryMin: 170000,
        salaryMax: 210000,
        skills: ['cybersecurity', 'owasp', 'python', 'docker', 'linux'],
        remote: true,
        views: 110,
        status: JOB_STATUS.ACTIVE,
      },
      {
        postedBy: employerDatadog._id,
        title: 'Legacy API Maintenance Engineer (Archived)',
        description: 'Maintaining legacy data ingest pipelines.',
        company: 'Datadog',
        location: 'New York, NY',
        jobType: 'part-time',
        experienceLevel: 'mid',
        salaryMin: 80000,
        salaryMax: 100000,
        skills: ['node.js', 'python'],
        remote: true,
        views: 45,
        status: JOB_STATUS.CLOSED,
      },
    ];

    const createdJobs = await Job.insertMany(jobsData);
    logger.info(`Inserted ${createdJobs.length} jobs.`);

    // 5. Create Applications with Lifecycles
    logger.info('Creating applications across Kanban lifecycle stages...');
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const appsToInsert = [
      // Job 1 (Stripe Staff Full-Stack)
      {
        job: createdJobs[0]._id,
        applicant: seekerAlex._id,
        resumeUrl: seekerAlex.resumeUrl,
        coverNote: 'I have 6 years building distributed payment flows with Node and React. Excited for Stripe checkout.',
        status: APPLICATION_STATUS.INTERVIEW,
        matchScore: 92,
        createdAt: new Date(now - 8 * day),
        statusHistory: [
          { status: APPLICATION_STATUS.APPLIED, changedBy: seekerAlex._id, at: new Date(now - 8 * day) },
          { status: APPLICATION_STATUS.UNDER_REVIEW, changedBy: employerStripe._id, at: new Date(now - 6 * day) },
          { status: APPLICATION_STATUS.SHORTLISTED, changedBy: employerStripe._id, at: new Date(now - 4 * day) },
          { status: APPLICATION_STATUS.INTERVIEW, changedBy: employerStripe._id, at: new Date(now - 2 * day), note: 'Technical deep-dive scheduled' },
        ],
      },
      {
        job: createdJobs[0]._id,
        applicant: seekerElena._id,
        resumeUrl: seekerElena.resumeUrl,
        coverNote: 'Staff Frontend Engineer eager to optimize Stripe payment experiences.',
        status: APPLICATION_STATUS.OFFERED,
        matchScore: 88,
        createdAt: new Date(now - 14 * day),
        statusHistory: [
          { status: APPLICATION_STATUS.APPLIED, changedBy: seekerElena._id, at: new Date(now - 14 * day) },
          { status: APPLICATION_STATUS.UNDER_REVIEW, changedBy: employerStripe._id, at: new Date(now - 12 * day) },
          { status: APPLICATION_STATUS.SHORTLISTED, changedBy: employerStripe._id, at: new Date(now - 9 * day) },
          { status: APPLICATION_STATUS.INTERVIEW, changedBy: employerStripe._id, at: new Date(now - 5 * day) },
          { status: APPLICATION_STATUS.OFFERED, changedBy: employerStripe._id, at: new Date(now - 1 * day), note: 'Formal offer sent at $240k' },
        ],
      },
      {
        job: createdJobs[0]._id,
        applicant: seekerJordan._id,
        resumeUrl: seekerJordan.resumeUrl,
        coverNote: 'Strong Node.js and PostgreSQL background.',
        status: APPLICATION_STATUS.UNDER_REVIEW,
        matchScore: 74,
        createdAt: new Date(now - 3 * day),
        statusHistory: [
          { status: APPLICATION_STATUS.APPLIED, changedBy: seekerJordan._id, at: new Date(now - 3 * day) },
          { status: APPLICATION_STATUS.UNDER_REVIEW, changedBy: employerStripe._id, at: new Date(now - 1 * day) },
        ],
      },
      // Job 2 (Stripe Senior Frontend)
      {
        job: createdJobs[1]._id,
        applicant: seekerElena._id,
        resumeUrl: seekerElena.resumeUrl,
        coverNote: 'Deep frontend architecture and design systems experience.',
        status: APPLICATION_STATUS.HIRED,
        matchScore: 98,
        createdAt: new Date(now - 20 * day),
        statusHistory: [
          { status: APPLICATION_STATUS.APPLIED, changedBy: seekerElena._id, at: new Date(now - 20 * day) },
          { status: APPLICATION_STATUS.UNDER_REVIEW, changedBy: employerStripe._id, at: new Date(now - 18 * day) },
          { status: APPLICATION_STATUS.SHORTLISTED, changedBy: employerStripe._id, at: new Date(now - 15 * day) },
          { status: APPLICATION_STATUS.INTERVIEW, changedBy: employerStripe._id, at: new Date(now - 10 * day) },
          { status: APPLICATION_STATUS.OFFERED, changedBy: employerStripe._id, at: new Date(now - 5 * day) },
          { status: APPLICATION_STATUS.HIRED, changedBy: employerStripe._id, at: new Date(now - 2 * day), note: 'Welcome aboard Elena!' },
        ],
      },
      {
        job: createdJobs[1]._id,
        applicant: seekerAlex._id,
        resumeUrl: seekerAlex.resumeUrl,
        status: APPLICATION_STATUS.SHORTLISTED,
        matchScore: 85,
        createdAt: new Date(now - 5 * day),
        statusHistory: [
          { status: APPLICATION_STATUS.APPLIED, changedBy: seekerAlex._id, at: new Date(now - 5 * day) },
          { status: APPLICATION_STATUS.UNDER_REVIEW, changedBy: employerStripe._id, at: new Date(now - 3 * day) },
          { status: APPLICATION_STATUS.SHORTLISTED, changedBy: employerStripe._id, at: new Date(now - 1 * day) },
        ],
      },
      // Job 4 (Airbnb Lead Architect)
      {
        job: createdJobs[3]._id,
        applicant: seekerSarah._id,
        resumeUrl: seekerSarah.resumeUrl,
        coverNote: 'Extensive multi-cluster Kubernetes architecting experience.',
        status: APPLICATION_STATUS.INTERVIEW,
        matchScore: 94,
        createdAt: new Date(now - 7 * day),
        statusHistory: [
          { status: APPLICATION_STATUS.APPLIED, changedBy: seekerSarah._id, at: new Date(now - 7 * day) },
          { status: APPLICATION_STATUS.UNDER_REVIEW, changedBy: employerAirbnb._id, at: new Date(now - 5 * day) },
          { status: APPLICATION_STATUS.INTERVIEW, changedBy: employerAirbnb._id, at: new Date(now - 2 * day) },
        ],
      },
      // Job 5 (Airbnb Guest Search)
      {
        job: createdJobs[4]._id,
        applicant: seekerAlex._id,
        resumeUrl: seekerAlex.resumeUrl,
        coverNote: 'Passionate about instant reactive marketplace search.',
        status: APPLICATION_STATUS.HIRED,
        matchScore: 90,
        createdAt: new Date(now - 18 * day),
        statusHistory: [
          { status: APPLICATION_STATUS.APPLIED, changedBy: seekerAlex._id, at: new Date(now - 18 * day) },
          { status: APPLICATION_STATUS.UNDER_REVIEW, changedBy: employerAirbnb._id, at: new Date(now - 15 * day) },
          { status: APPLICATION_STATUS.SHORTLISTED, changedBy: employerAirbnb._id, at: new Date(now - 12 * day) },
          { status: APPLICATION_STATUS.INTERVIEW, changedBy: employerAirbnb._id, at: new Date(now - 8 * day) },
          { status: APPLICATION_STATUS.OFFERED, changedBy: employerAirbnb._id, at: new Date(now - 4 * day) },
          { status: APPLICATION_STATUS.HIRED, changedBy: employerAirbnb._id, at: new Date(now - 1 * day) },
        ],
      },
      {
        job: createdJobs[4]._id,
        applicant: seekerJordan._id,
        resumeUrl: seekerJordan.resumeUrl,
        status: APPLICATION_STATUS.APPLIED,
        matchScore: 70,
        createdAt: new Date(now - 1 * day),
        statusHistory: [
          { status: APPLICATION_STATUS.APPLIED, changedBy: seekerJordan._id, at: new Date(now - 1 * day) },
        ],
      },
      // Job 7 (Datadog Observability SRE)
      {
        job: createdJobs[6]._id,
        applicant: seekerSarah._id,
        resumeUrl: seekerSarah.resumeUrl,
        coverNote: 'Experienced building large-scale Prometheus and Kubernetes clusters.',
        status: APPLICATION_STATUS.HIRED,
        matchScore: 96,
        createdAt: new Date(now - 16 * day),
        statusHistory: [
          { status: APPLICATION_STATUS.APPLIED, changedBy: seekerSarah._id, at: new Date(now - 16 * day) },
          { status: APPLICATION_STATUS.UNDER_REVIEW, changedBy: employerDatadog._id, at: new Date(now - 14 * day) },
          { status: APPLICATION_STATUS.SHORTLISTED, changedBy: employerDatadog._id, at: new Date(now - 10 * day) },
          { status: APPLICATION_STATUS.INTERVIEW, changedBy: employerDatadog._id, at: new Date(now - 6 * day) },
          { status: APPLICATION_STATUS.OFFERED, changedBy: employerDatadog._id, at: new Date(now - 3 * day) },
          { status: APPLICATION_STATUS.HIRED, changedBy: employerDatadog._id, at: new Date(now - 1 * day) },
        ],
      },
      // Job 8 (Datadog AI/ML)
      {
        job: createdJobs[7]._id,
        applicant: seekerMarcus._id,
        resumeUrl: seekerMarcus.resumeUrl,
        coverNote: 'Experienced in PyTorch time-series modeling and LLM pipelines.',
        status: APPLICATION_STATUS.INTERVIEW,
        matchScore: 95,
        createdAt: new Date(now - 6 * day),
        statusHistory: [
          { status: APPLICATION_STATUS.APPLIED, changedBy: seekerMarcus._id, at: new Date(now - 6 * day) },
          { status: APPLICATION_STATUS.UNDER_REVIEW, changedBy: employerDatadog._id, at: new Date(now - 4 * day) },
          { status: APPLICATION_STATUS.SHORTLISTED, changedBy: employerDatadog._id, at: new Date(now - 3 * day) },
          { status: APPLICATION_STATUS.INTERVIEW, changedBy: employerDatadog._id, at: new Date(now - 1 * day) },
        ],
      },
    ];

    const insertedApps = await Application.insertMany(appsToInsert);
    logger.info(`Inserted ${insertedApps.length} candidate applications.`);

    // Synchronize applicationsCount on jobs
    for (const job of createdJobs) {
      const count = await Application.countDocuments({ job: job._id });
      await Job.findByIdAndUpdate(job._id, { applicationsCount: count });
    }

    // 6. Seed Saved Jobs & Searches
    logger.info('Seeding saved bookmarks and search alerts...');
    await SavedJob.create([
      { user: seekerAlex._id, job: createdJobs[0]._id },
      { user: seekerAlex._id, job: createdJobs[1]._id },
      { user: seekerElena._id, job: createdJobs[8]._id },
      { user: seekerSarah._id, job: createdJobs[3]._id },
    ]);

    await SavedSearch.create([
      {
        user: seekerAlex._id,
        title: 'Senior React Remote',
        criteria: { keyword: 'React', remote: true, salaryMin: 150000 },
        alertFrequency: 'immediate',
      },
      {
        user: seekerSarah._id,
        title: 'Kubernetes SRE Roles',
        criteria: { keyword: 'Kubernetes', remote: true, salaryMin: 175000 },
        alertFrequency: 'immediate',
      },
      {
        user: seekerMarcus._id,
        title: 'AI Machine Learning NYC',
        criteria: { keyword: 'PyTorch', location: 'New York', salaryMin: 160000 },
        alertFrequency: 'daily',
      },
    ]);

    // 7. Seed Notifications
    logger.info('Seeding notification history...');
    await Notification.create([
      {
        user: seekerAlex._id,
        type: 'status_updated',
        title: 'Application Advanced: INTERVIEW',
        message: 'Stripe has invited you for a technical interview for Staff Full-Stack Payments Engineer.',
        link: '/dashboard/seeker',
        read: false,
      },
      {
        user: seekerElena._id,
        type: 'status_updated',
        title: 'Offer Extended: Stripe',
        message: 'Congratulations! An offer has been extended for Senior Frontend Infrastructure Engineer.',
        link: '/dashboard/seeker',
        read: true,
      },
      {
        user: employerStripe._id,
        type: 'application_received',
        title: 'New Applicant: Alex Rivera',
        message: 'Alex Rivera applied for Staff Full-Stack Payments Engineer (Match Score: 92%).',
        link: `/dashboard/employer?job=${createdJobs[0]._id}`,
        read: false,
      },
      {
        user: employerDatadog._id,
        type: 'application_received',
        title: 'New Applicant: Marcus Vance',
        message: 'Marcus Vance applied for AI / Machine Learning Engineer (Match Score: 95%).',
        link: `/dashboard/employer?job=${createdJobs[7]._id}`,
        read: false,
      },
    ]);

    // 8. Seed Audit Logs
    logger.info('Seeding immutable audit logs...');
    await AuditLog.create([
      {
        actor: admin._id,
        action: 'PLATFORM_INITIALIZED',
        entity: 'User',
        entityId: admin._id,
      },
      {
        actor: employerStripe._id,
        action: 'JOB_CREATED',
        entity: 'Job',
        entityId: createdJobs[0]._id,
        meta: { title: createdJobs[0].title, company: 'Stripe' },
      },
      {
        actor: seekerAlex._id,
        action: 'APPLICATION_SUBMITTED',
        entity: 'Application',
        entityId: insertedApps[0]._id,
        meta: { jobTitle: createdJobs[0].title },
      },
      {
        actor: employerStripe._id,
        action: 'APPLICATION_STATUS_UPDATED',
        entity: 'Application',
        entityId: insertedApps[0]._id,
        meta: { oldStatus: 'applied', newStatus: 'interview' },
      },
    ]);

    logger.info('====================================================');
    logger.info(' DevBoard database successfully seeded!');
    logger.info('====================================================');
    logger.info(' Demo Accounts:');
    logger.info(' - Admin:    admin@devboard.io / Admin123!');
    logger.info(' - Employer: recruiter@stripe.com / Password123!');
    logger.info(' - Employer: recruiter@airbnb.com / Password123!');
    logger.info(' - Employer: recruiter@datadog.com / Password123!');
    logger.info(' - Seeker:   alex.dev@gmail.com / Password123!');
    logger.info(' - Seeker:   sarah.cloud@gmail.com / Password123!');
    logger.info(' - Seeker:   marcus.ai@gmail.com / Password123!');
    logger.info('====================================================');

    await mongoose.disconnect();
    logger.info('Seeding connection closed.');
  } catch (err) {
    logger.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Auto-run if executed directly via node src/seeds/seed.js
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}
