import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { render } from '@react-email/render';
import * as React from 'react';

// Import email templates
import WelcomeEmail from './templates/welcome.js';
import ResetPasswordEmail from './templates/reset-password.js';
import NotificationEmail from './templates/notification.js';
import OTPEmail from './templates/otp.js';
import WhatsNewEmail from './templates/whats-new.js';
import SecurityEmail from './templates/security.js';
import DailyDigestEmail from './templates/daily-digest.js';
import LowBalanceAlertEmail from './templates/low-balance-alert.js';

import {
  WelcomeEmailProps,
  ResetPasswordEmailProps,
  NotificationEmailProps,
  OTPEmailProps,
  WhatsNewEmailProps,
  SecurityEmailProps,
  DailyDigestEmailProps,
  LowBalanceAlertEmailProps,
  EmailResponse
} from './types';

const app: FastifyInstance = fastify({ logger: true });

// Health check endpoint
app.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  return { status: 'ok', service: 'mail-generator' };
});

// Welcome email template
app.post<{ Body: WelcomeEmailProps }>('/templates/welcome', async (request, reply) => {
  try {
    const { name, email } = request.body;
    
    if (!name || !email) {
      return reply.code(400).send({ 
        error: 'Missing required fields: name and email' 
      });
    }

    const emailElement = React.createElement(WelcomeEmail, { name, email });
    const html = await render(emailElement);
    
    const response: EmailResponse = {
      template: 'welcome',
      html,
      subject: `Welcome to Nuts, ${name}!`
    };

    return response;
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate template', details: error.message });
  }
});

// Reset password email template
app.post<{ Body: ResetPasswordEmailProps }>('/templates/reset-password', async (request, reply) => {
  try {
    const { name, email, resetLink } = request.body;
    
    if (!name || !email || !resetLink) {
      return reply.code(400).send({ 
        error: 'Missing required fields: name, email, and resetLink' 
      });
    }

    const emailElement = React.createElement(ResetPasswordEmail, { name, email, resetLink });
    const html = await render(emailElement);
    
    const response: EmailResponse = {
      template: 'reset-password',
      html,
      subject: 'Reset Your Password - Nuts'
    };

    return response;
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate template', details: error.message });
  }
});

// Notification email template
app.post<{ Body: NotificationEmailProps }>('/templates/notification', async (request, reply) => {
  try {
    const { name, email, title, message } = request.body;
    
    if (!name || !email || !title || !message) {
      return reply.code(400).send({ 
        error: 'Missing required fields: name, email, title, and message' 
      });
    }

    const emailElement = React.createElement(NotificationEmail, { name, email, title, message });
    const html = await render(emailElement);
    
    const response: EmailResponse = {
      template: 'notification',
      html,
      subject: title
    };

    return response;
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate template', details: error.message });
  }
});

// OTP email template
app.post<{ Body: OTPEmailProps }>('/templates/otp', async (request, reply) => {
  try {
    const { name, email, otpCode, expiresIn = '10 minutes' } = request.body;
    
    if (!name || !email || !otpCode) {
      return reply.code(400).send({ 
        error: 'Missing required fields: name, email, and otpCode' 
      });
    }

    const emailElement = React.createElement(OTPEmail, { name, email, otpCode, expiresIn });
    const html = await render(emailElement);
    
    const response: EmailResponse = {
      template: 'otp',
      html,
      subject: 'Your One-Time Password - Nuts'
    };

    return response;
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate template', details: error.message });
  }
});

// What's new email template
app.post<{ Body: WhatsNewEmailProps }>('/templates/whats-new', async (request, reply) => {
  try {
    const { name, email, features, version } = request.body;
    
    if (!name || !email || !features || !Array.isArray(features)) {
      return reply.code(400).send({ 
        error: 'Missing required fields: name, email, and features (array)' 
      });
    }

    const emailElement = React.createElement(WhatsNewEmail, { name, email, features, version });
    const html = await render(emailElement);
    
    const response: EmailResponse = {
      template: 'whats-new',
      html,
      subject: `What's New in Nuts${version ? ` v${version}` : ''}`
    };

    return response;
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate template', details: error.message });
  }
});

// Security email template
app.post<{ Body: SecurityEmailProps }>('/templates/security', async (request, reply) => {
  try {
    const { name, email, deviceInfo, location, timestamp } = request.body;
    
    if (!name || !email || !deviceInfo || !timestamp) {
      return reply.code(400).send({ 
        error: 'Missing required fields: name, email, deviceInfo, and timestamp' 
      });
    }

    const emailElement = React.createElement(SecurityEmail, { name, email, deviceInfo, location, timestamp });
    const html = await render(emailElement);
    
    const response: EmailResponse = {
      template: 'security',
      html,
      subject: 'New Device Access - Nuts Security Alert'
    };

    return response;
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate template', details: error.message });
  }
});

// Daily digest email template
app.post<{ Body: DailyDigestEmailProps }>('/templates/daily-digest', async (request, reply) => {
  try {
    const { name, email, date, balanceSummary, transactions, insights } = request.body;
    
    if (!name || !email || !date || !balanceSummary || !transactions || !insights) {
      return reply.code(400).send({ 
        error: 'Missing required fields: name, email, date, balanceSummary, transactions, and insights' 
      });
    }

    const emailElement = React.createElement(DailyDigestEmail, { 
      name, email, date, balanceSummary, transactions, insights 
    });
    const html = await render(emailElement);
    
    const response: EmailResponse = {
      template: 'daily-digest',
      html,
      subject: `Your Daily Financial Digest - ${date}`
    };

    return response;
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate template', details: error.message });
  }
});

// Low balance alert email template
app.post<{ Body: LowBalanceAlertEmailProps }>('/templates/low-balance-alert', async (request, reply) => {
  try {
    const { name, email, accountName, currentBalance, threshold, currency = 'USD' } = request.body;
    
    if (!name || !email || !accountName || currentBalance === undefined || threshold === undefined) {
      return reply.code(400).send({ 
        error: 'Missing required fields: name, email, accountName, currentBalance, and threshold' 
      });
    }

    const emailElement = React.createElement(LowBalanceAlertEmail, { 
      name, email, accountName, currentBalance, threshold, currency 
    });
    const html = await render(emailElement);
    
    const response: EmailResponse = {
      template: 'low-balance-alert',
      html,
      subject: `Low Balance Alert - ${accountName}`
    };

    return response;
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate template', details: error.message });
  }
});

// Start the server
const start = async (): Promise<void> => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    app.log.info(`Mail generator service listening on ${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();