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
import { SecurityEmailProps } from '../types';

const SecurityEmail: React.FC<SecurityEmailProps> = ({ name, email, deviceInfo, location, timestamp }) => {
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 max-w-2xl bg-white">
            <Section className="px-12 py-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 text-2xl">🛡️</span>
                </div>
                <Heading className="text-3xl font-bold text-gray-900">
                  New Device Access Detected
                </Heading>
              </div>
              
              <Text className="text-gray-700 text-lg mb-6">
                Hi {name},
              </Text>
              
              <Text className="text-gray-700 text-lg mb-8">
                We detected a new device accessing your Nuts account. If this was you, you can safely ignore this email. If not, please take immediate action.
              </Text>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                <Heading className="text-lg font-semibold text-gray-900 mb-4">
                  Access Details
                </Heading>
                
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <Text className="text-gray-600 font-medium">Device Type:</Text>
                    <Text className="text-gray-900">{deviceInfo.deviceType}</Text>
                  </div>
                  
                  {deviceInfo.browser && (
                    <div className="flex justify-between mb-2">
                      <Text className="text-gray-600 font-medium">Browser:</Text>
                      <Text className="text-gray-900">{deviceInfo.browser}</Text>
                    </div>
                  )}
                  
                  {deviceInfo.os && (
                    <div className="flex justify-between mb-2">
                      <Text className="text-gray-600 font-medium">Operating System:</Text>
                      <Text className="text-gray-900">{deviceInfo.os}</Text>
                    </div>
                  )}
                  
                  {location && (
                    <div className="flex justify-between mb-2">
                      <Text className="text-gray-600 font-medium">Location:</Text>
                      <Text className="text-gray-900">{location}</Text>
                    </div>
                  )}
                  
                  <div className="flex justify-between mb-2">
                    <Text className="text-gray-600 font-medium">Time:</Text>
                    <Text className="text-gray-900">{formatTimestamp(timestamp)}</Text>
                  </div>
                  
                  {deviceInfo.ipAddress && (
                    <div className="flex justify-between">
                      <Text className="text-gray-600 font-medium">IP Address:</Text>
                      <Text className="text-gray-900">{deviceInfo.ipAddress}</Text>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                <Heading className="text-lg font-semibold text-red-900 mb-4">
                  ⚠️ Didn't recognize this activity?
                </Heading>
                
                <Text className="text-red-800 mb-4">
                  If you didn't sign in from this device, your account may be compromised. Take these steps immediately:
                </Text>
                
                <div className="mb-4">
                  <Text className="text-red-700 mb-1">• Change your password immediately</Text>
                  <Text className="text-red-700 mb-1">• Enable two-factor authentication</Text>
                  <Text className="text-red-700 mb-1">• Review your account activity</Text>
                  <Text className="text-red-700">• Contact our support team</Text>
                </div>
              </div>
              
              <div className="text-center mb-8">
                <Button
                  href="https://nutsapp.ridyrich.engineer/security"
                  className="bg-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg mr-4"
                >
                  Secure My Account
                </Button>
              </div>
              
              <Hr className="my-8 border-gray-200" />
              
              <Text className="text-gray-500 text-sm mb-2">
                This is an automated security alert from Nuts. We continuously monitor your account for suspicious activity.
              </Text>
              
              <Text className="text-gray-500 text-sm">
                For questions about account security, contact our support team immediately.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SecurityEmail;