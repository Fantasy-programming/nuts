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
import { NotificationEmailProps } from '../types';

const NotificationEmail: React.FC<NotificationEmailProps> = ({ name, email, title, message }) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 max-w-2xl bg-white">
            <Section className="px-12 py-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 text-2xl">🔔</span>
                </div>
                <Heading className="text-3xl font-bold text-gray-900">
                  {title}
                </Heading>
              </div>
              
              <Text className="text-gray-700 text-lg mb-4">
                Hi {name},
              </Text>
              
              <Text className="text-gray-700 text-lg mb-8">
                {message}
              </Text>
              
              <Hr className="my-8 border-gray-200" />
              
              <Text className="text-gray-500 text-sm mb-2">
                This is an automated notification from Nuts - your personal finance OS.
              </Text>
              
              <Text className="text-gray-500 text-sm">
                If you have any questions, please contact our support team.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default NotificationEmail;