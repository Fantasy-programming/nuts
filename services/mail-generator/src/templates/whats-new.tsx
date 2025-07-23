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
  Img,
  Tailwind,
} from '@react-email/components';
import { WhatsNewEmailProps } from '../types';

const WhatsNewEmail: React.FC<WhatsNewEmailProps> = ({ name, email, features, version }) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 max-w-2xl bg-white">
            <Section className="px-12 py-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 text-2xl">✨</span>
                </div>
                <Heading className="text-3xl font-bold text-gray-900">
                  What's New in Nuts{version ? ` v${version}` : ''}
                </Heading>
              </div>
              
              <Text className="text-gray-700 text-lg mb-8">
                Hi {name},
              </Text>
              
              <Text className="text-gray-700 text-lg mb-8">
                We're excited to share the latest improvements and features we've added to make your financial management even better!
              </Text>
              
              <div className="mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 mb-6">
                    {feature.imageUrl && (
                      <Img
                        src={feature.imageUrl}
                        alt={feature.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <Heading className="text-xl font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </Heading>
                    <Text className="text-gray-700">
                      {feature.description}
                    </Text>
                  </div>
                ))}
              </div>
              
              <div className="text-center mb-8">
                <Button
                  href="https://nutsapp.ridyrich.engineer"
                  className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg"
                >
                  Explore New Features
                </Button>
              </div>
              
              <Hr className="my-8 border-gray-200" />
              
              <Text className="text-gray-500 text-sm mb-2">
                We're constantly working to improve your experience with Nuts. Stay tuned for more updates!
              </Text>
              
              <Text className="text-gray-500 text-sm">
                Have feedback about these new features? We'd love to hear from you.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WhatsNewEmail;