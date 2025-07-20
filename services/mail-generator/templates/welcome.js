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

const WelcomeEmail = ({ name, email }) => {
  const component = React.createElement(Html, null,
    React.createElement(Head, null),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container },
        React.createElement(Section, { style: section },
          React.createElement(Heading, { style: h1 }, `Welcome to Nuts, ${name}!`),
          React.createElement(Text, { style: text },
            "Thank you for joining Nuts - your personal finance OS. We're excited to help you take control of your financial journey."
          ),
          React.createElement(Text, { style: text },
            "Here's what you can do with Nuts:"
          ),
          React.createElement(Text, { style: text },
            "• Connect your bank accounts securely"
          ),
          React.createElement(Text, { style: text },
            "• Track your transactions automatically"
          ),
          React.createElement(Text, { style: text },
            "• Categorize and analyze your spending"
          ),
          React.createElement(Text, { style: text },
            "• Set budgets and financial goals"
          ),
          React.createElement(Button, { 
            style: button,
            href: "https://nutsapp.ridyrich.engineer"
          }, "Get Started"),
          React.createElement(Hr, { style: hr }),
          React.createElement(Text, { style: footer },
            "If you have any questions, feel free to reach out to our support team."
          )
        )
      )
    )
  );
  
  return component;
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
};

const list = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  paddingLeft: '20px',
};

const listItem = {
  marginBottom: '8px',
};

const button = {
  backgroundColor: '#5469d4',
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
};

module.exports = WelcomeEmail;