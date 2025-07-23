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
import { ResetPasswordEmailProps } from '../types';

const ResetPasswordEmail: React.FC<ResetPasswordEmailProps> = ({ name, email, resetLink }) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 max-w-2xl bg-white">
            <Section className="px-12 py-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 text-2xl">🔒</span>
                </div>
                <Heading className="text-3xl font-bold text-gray-900">
                  Reset Your Password
                </Heading>
              </div>
              
              <Text className="text-gray-700 text-lg mb-4">
                Hi {name},
              </Text>
              
              <Text className="text-gray-700 text-lg mb-6">
                We received a request to reset your password for your Nuts account. If you didn't make this request, you can safely ignore this email.
              </Text>
              
              <Text className="text-gray-700 text-lg mb-8">
                To reset your password, click the button below:
              </Text>
              
              <div className="text-center mb-8">
                <Button
                  href={resetLink}
                  className="bg-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg"
                >
                  Reset Password
                </Button>
              </div>
              
              <Text className="text-gray-700 text-sm mb-8">
                This link will expire in 24 hours for your security.
              </Text>
              
              <Hr className="my-8 border-gray-200" />
              
              <Text className="text-gray-500 text-sm mb-2">
                If you're having trouble clicking the button, copy and paste the URL below into your web browser:
              </Text>
              
              <Text className="text-gray-400 text-xs break-all">
                {resetLink}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ResetPasswordEmail;