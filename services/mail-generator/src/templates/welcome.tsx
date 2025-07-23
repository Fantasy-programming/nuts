import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Tailwind,
} from '@react-email/components';
import { WelcomeEmailProps } from '../types';

const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ name, email }) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 max-w-2xl bg-white">
            <Section className="px-12 py-8">
              <Heading className="text-3xl font-bold text-gray-900 mb-8">
                Welcome to Nuts, {name}!
              </Heading>
              
              <Text className="text-gray-700 text-lg mb-6">
                Thank you for joining Nuts - your personal finance OS. We're excited to help you take control of your financial journey.
              </Text>
              
              <Text className="text-gray-700 text-lg mb-4">
                Here's what you can do with Nuts:
              </Text>
              
              <div className="mb-8">
                <Text className="text-gray-700 flex items-start mb-3">
                  <span className="text-green-500 mr-2">✓</span>
                  Connect your bank accounts securely
                </Text>
                <Text className="text-gray-700 flex items-start mb-3">
                  <span className="text-green-500 mr-2">✓</span>
                  Track your transactions automatically
                </Text>
                <Text className="text-gray-700 flex items-start mb-3">
                  <span className="text-green-500 mr-2">✓</span>
                  Categorize and analyze your spending
                </Text>
                <Text className="text-gray-700 flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Set budgets and financial goals
                </Text>
              </div>
              
              <Button
                href="https://nutsapp.ridyrich.engineer"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg"
              >
                Get Started
              </Button>
              
              <Hr className="my-8 border-gray-200" />
              
              <Text className="text-gray-500 text-sm">
                If you have any questions, feel free to reach out to our support team.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;