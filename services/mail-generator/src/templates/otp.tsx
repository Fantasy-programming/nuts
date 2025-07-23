import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Tailwind,
} from '@react-email/components';
import { OTPEmailProps } from '../types';

const OTPEmail: React.FC<OTPEmailProps> = ({ name, email, otpCode, expiresIn = '10 minutes' }) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 max-w-2xl bg-white">
            <Section className="px-12 py-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-2xl">🔐</span>
                </div>
                <Heading className="text-3xl font-bold text-gray-900">
                  Your One-Time Password
                </Heading>
              </div>
              
              <Text className="text-gray-700 text-lg mb-6">
                Hi {name},
              </Text>
              
              <Text className="text-gray-700 text-lg mb-8">
                Here's your one-time password (OTP) to verify your identity:
              </Text>
              
              <div className="text-center mb-8">
                <div className="inline-block bg-gray-100 border-2 border-dashed border-gray-300 px-8 py-6 rounded-lg">
                  <Text className="text-4xl font-mono font-bold text-gray-900 tracking-widest">
                    {otpCode}
                  </Text>
                </div>
              </div>
              
              <div className="mb-8">
                <Text className="text-amber-800 text-sm font-medium mb-2">
                  ⚠️ Important Security Information
                </Text>
                <Text className="text-amber-700 text-sm mb-1">
                  • This code will expire in {expiresIn}
                </Text>
                <Text className="text-amber-700 text-sm mb-1">
                  • Never share this code with anyone
                </Text>
                <Text className="text-amber-700 text-sm">
                  • Nuts will never ask for this code via phone or email
                </Text>
              </div>
              
              <Hr className="my-8 border-gray-200" />
              
              <Text className="text-gray-500 text-sm mb-2">
                If you didn't request this code, please ignore this email or contact our support team immediately.
              </Text>
              
              <Text className="text-gray-500 text-sm">
                This is an automated security message from Nuts.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OTPEmail;