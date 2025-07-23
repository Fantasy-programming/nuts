const React = require('react');
const {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
} = require('@react-email/components');

const NotificationEmail = ({ name, email, title, message }) => {
  return React.createElement(Html, null,
    React.createElement(Head, null),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container },
        React.createElement(Section, { style: section },
          React.createElement(Heading, { style: h1 }, title),
          React.createElement(Text, { style: text },
            `Hi ${name},`
          ),
          React.createElement(Text, { style: text },
            message
          ),
          React.createElement(Hr, { style: hr }),
          React.createElement(Text, { style: footer },
            "This is an automated notification from Nuts - your personal finance OS."
          ),
          React.createElement(Text, { style: footer },
            "If you have any questions, please contact our support team."
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

module.exports = NotificationEmail;