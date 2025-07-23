const fastify = require('fastify')({ logger: true });
const { render } = require('@react-email/render');

// Import email templates
const welcomeTemplate = require('./templates/welcome');
const resetPasswordTemplate = require('./templates/reset-password');
const notificationTemplate = require('./templates/notification');

// Declare a route to generate email templates
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'mail-generator' };
});

// Welcome email template
fastify.post('/templates/welcome', async (request, reply) => {
  try {
    const { name, email } = request.body;
    
    if (!name || !email) {
      return reply.code(400).send({ 
        error: 'Missing required fields: name and email' 
      });
    }

    // Simple HTML template for now
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to Nuts</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #5469d4; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; background-color: #5469d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Nuts, ${name}!</h1>
        </div>
        <div class="content">
            <p>Thank you for joining Nuts - your personal finance OS. We're excited to help you take control of your financial journey.</p>
            <p>Here's what you can do with Nuts:</p>
            <ul>
                <li>Connect your bank accounts securely</li>
                <li>Track your transactions automatically</li>
                <li>Categorize and analyze your spending</li>
                <li>Set budgets and financial goals</li>
            </ul>
            <a href="https://nutsapp.ridyrich.engineer" class="button">Get Started</a>
            <p><small>If you have any questions, feel free to reach out to our support team.</small></p>
        </div>
    </div>
</body>
</html>`;
    
    return {
      template: 'welcome',
      html,
      subject: `Welcome to Nuts, ${name}!`
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate template', details: error.message });
  }
});

// Reset password email template
fastify.post('/templates/reset-password', async (request, reply) => {
  try {
    const { name, email, resetLink } = request.body;
    
    if (!name || !email || !resetLink) {
      return reply.code(400).send({ 
        error: 'Missing required fields: name, email, and resetLink' 
      });
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset Your Password - Nuts</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { font-size: 12px; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password for your Nuts account. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>This link will expire in 24 hours for your security.</p>
            <div class="footer">
                <p>If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
                <p>${resetLink}</p>
            </div>
        </div>
    </div>
</body>
</html>`;
    
    return {
      template: 'reset-password',
      html,
      subject: 'Reset Your Password - Nuts'
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate template', details: error.message });
  }
});

// Notification email template
fastify.post('/templates/notification', async (request, reply) => {
  try {
    const { name, email, title, message } = request.body;
    
    if (!name || !email || !title || !message) {
      return reply.code(400).send({ 
        error: 'Missing required fields: name, email, title, and message' 
      });
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { font-size: 12px; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>${message}</p>
            <div class="footer">
                <p>This is an automated notification from Nuts - your personal finance OS.</p>
                <p>If you have any questions, please contact our support team.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
    
    return {
      template: 'notification',
      html,
      subject: title
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate template', details: error.message });
  }
});

// Run the server!
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`Mail generator service listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();