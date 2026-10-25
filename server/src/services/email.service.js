import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

class EmailService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      logger.info(`SMTP Transporter initialized for ${env.SMTP_HOST}:${env.SMTP_PORT}`);
    } else {
      // In development/test mode without credentials, log emails without failing
      this.transporter = {
        sendMail: async (options) => {
          logger.info(`[MOCK EMAIL SENT] To: ${options.to} | Subject: "${options.subject}"`);
          return { messageId: `mock-${Date.now()}` };
        },
      };
      logger.debug('Mock email transporter initialized (SMTP credentials not provided)');
    }
  }

  /**
   * Enqueue an email task so API calls return without waiting for SMTP transport
   */
  enqueueEmail(mailOptions, retries = 3) {
    this.queue.push({
      mailOptions: {
        from: mailOptions.from || env.EMAIL_FROM,
        ...mailOptions,
      },
      retries,
      attempt: 0,
    });

    setImmediate(() => this.processQueue());
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      task.attempt += 1;

      try {
        await this.transporter.sendMail(task.mailOptions);
        logger.debug(`Email delivered to ${task.mailOptions.to}: "${task.mailOptions.subject}"`);
      } catch (err) {
        logger.error(`Failed to send email to ${task.mailOptions.to} (Attempt ${task.attempt}/${task.retries}):`, err.message);
        if (task.attempt < task.retries) {
          this.queue.push(task); // Requeue for next cycle
        } else {
          logger.error(`Email discarded after ${task.retries} failed attempts to ${task.mailOptions.to}`);
        }
      }
    }

    this.isProcessing = false;
  }

  // --- Transactional Templates ---

  sendWelcomeEmail(user) {
    const subject = 'Welcome to DevBoard — Elevate Your Tech Career';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0d9488; margin-bottom: 16px;">Welcome to DevBoard, ${user.name}!</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Your ${user.role === 'employer' ? 'employer' : 'job seeker'} account has been created.
          ${user.role === 'employer' ? 'You can now post job opportunities and manage candidate pipelines seamlessly.' : 'Upload your resume, find matching tech roles, and track your applications in real time.'}
        </p>
        <div style="margin: 24px 0;">
          <a href="${env.CLIENT_URL}" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Go to DevBoard
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">If you have any questions, simply reply to this email.</p>
      </div>
    `;

    this.enqueueEmail({
      to: user.email,
      subject,
      html,
      text: `Welcome to DevBoard, ${user.name}! Start exploring at ${env.CLIENT_URL}`,
    });
  }

  sendApplicationSubmittedEmail(applicant, job) {
    const subject = `Application Received: ${job.title} at ${job.company}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0d9488; margin-bottom: 16px;">Application Submitted Successfully</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Hi ${applicant.name}, you have successfully applied for <strong>${job.title}</strong> at <strong>${job.company}</strong>.
        </p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          The hiring team has received your application and resume. You can track your application status anytime from your seeker dashboard.
        </p>
        <div style="margin: 24px 0;">
          <a href="${env.CLIENT_URL}/dashboard/seeker" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View My Applications
          </a>
        </div>
      </div>
    `;

    this.enqueueEmail({
      to: applicant.email,
      subject,
      html,
      text: `Hi ${applicant.name}, your application for ${job.title} at ${job.company} was submitted successfully. Track status at ${env.CLIENT_URL}/dashboard/seeker`,
    });
  }

  sendApplicationReceivedEmployerEmail(employer, applicant, job, applicationId) {
    const subject = `New Applicant for ${job.title}: ${applicant.name}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0d9488; margin-bottom: 16px;">New Candidate Application</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          <strong>${applicant.name}</strong> (${applicant.email}) just applied for your role: <strong>${job.title}</strong>.
        </p>
        <div style="margin: 24px 0;">
          <a href="${env.CLIENT_URL}/dashboard/employer?job=${job._id || job.id}&app=${applicationId}" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Review in Kanban Pipeline
          </a>
        </div>
      </div>
    `;

    this.enqueueEmail({
      to: employer.email,
      subject,
      html,
      text: `Candidate ${applicant.name} applied for ${job.title}. Review at ${env.CLIENT_URL}/dashboard/employer`,
    });
  }

  sendStatusUpdatedEmail(applicant, job, newStatus, note = '') {
    const readableStatus = newStatus.replace('_', ' ').toUpperCase();
    const subject = `Application Status Update: ${job.title} (${readableStatus})`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0d9488; margin-bottom: 16px;">Application Update: ${readableStatus}</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Hi ${applicant.name}, the status of your application for <strong>${job.title}</strong> at <strong>${job.company}</strong> has changed to:
          <span style="font-weight: 700; color: #0d9488;"> ${readableStatus}</span>.
        </p>
        ${note ? `<p style="background: #f8fafc; border-left: 4px solid #0d9488; padding: 12px; font-size: 14px; color: #334155;"><em>"${note}"</em></p>` : ''}
        <div style="margin: 24px 0;">
          <a href="${env.CLIENT_URL}/dashboard/seeker" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Application Details
          </a>
        </div>
      </div>
    `;

    this.enqueueEmail({
      to: applicant.email,
      subject,
      html,
      text: `Hi ${applicant.name}, your application for ${job.title} at ${job.company} is now ${readableStatus}. ${note ? `Note: "${note}"` : ''}`,
    });
  }

  sendJobAlertEmail(user, searchTitle, job) {
    const subject = `Job Alert: New opportunity matching "${searchTitle}"`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0d9488; margin-bottom: 16px;">New Matching Job Opportunity</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Hi ${user.name}, a new job listing matches your saved search: <strong>"${searchTitle}"</strong>.
        </p>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <h3 style="margin-top: 0; color: #0f172a;">${job.title}</h3>
          <p style="margin: 4px 0; color: #64748b;">${job.company} • ${job.location} • ${job.jobType}</p>
          <p style="margin: 8px 0 0; color: #334155; font-size: 14px;">$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}/yr</p>
        </div>
        <div style="margin: 24px 0;">
          <a href="${env.CLIENT_URL}/jobs/${job._id || job.id}" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Job & Apply
          </a>
        </div>
      </div>
    `;

    this.enqueueEmail({
      to: user.email,
      subject,
      html,
      text: `New job matching your alert: ${job.title} at ${job.company}. View at ${env.CLIENT_URL}/jobs/${job._id || job.id}`,
    });
  }
}

export const emailService = new EmailService();
