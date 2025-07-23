const React = require('react');
const {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
} = require('@react-email/components');

const ResetPasswordEmail = ({ name, email, resetLink }) => {
  return React.createElement(Html, null,
    React.createElement(Head, null),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container },
        React.createElement(Section, { style: section },
          React.createElement(Heading, { style: h1 }, "Reset Your Password"),
          React.createElement(Text, { style: text },
            `Hi ${name},`
          ),
          React.createElement(Text, { style: text },
            "We received a request to reset your password for your Nuts account. If you didn't make this request, you can safely ignore this email."
          ),
          React.createElement(Text, { style: text },
            "To reset your password, click the button below:"
          ),
          React.createElement(Button, { 
            style: button,
            href: resetLink
          }, "Reset Password"),
          React.createElement(Text, { style: text },
            "This link will expire in 24 hours for your security."
          ),
          React.createElement(Hr, { style: hr }),
          React.createElement(Text, { style: footer },
            "If you're having trouble clicking the button, copy and paste the URL below into your web browser:"
          ),
          React.createElement(Text, { style: footer },
            resetLink
          )
        )
      )
    )
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const section = {
  padding: '0 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  marginBottom: '16px',
};

const button = {
  backgroundColor: '#dc3545',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'block',
  width: '200px',
  padding: '12px 0',
  margin: '24px 0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  marginBottom: '8px',
};

module.exports = ResetPasswordEmail;