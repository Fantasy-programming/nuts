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
import { LowBalanceAlertEmailProps } from '../types';

const LowBalanceAlertEmail: React.FC<LowBalanceAlertEmailProps> = ({ 
  name, 
  email, 
  accountName, 
  currentBalance, 
  threshold, 
  currency = 'USD' 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const differenceFromThreshold = threshold - currentBalance;
  const percentageOfThreshold = (currentBalance / threshold) * 100;

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 max-w-2xl bg-white">
            <Section className="px-12 py-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-yellow-600 text-2xl">⚠️</span>
                </div>
                <Heading className="text-3xl font-bold text-gray-900">
                  Low Balance Alert
                </Heading>
              </div>
              
              <Text className="text-gray-700 text-lg mb-6">
                Hi {name},
              </Text>
              
              <Text className="text-gray-700 text-lg mb-8">
                Your <strong>{accountName}</strong> account balance has fallen below your set threshold. Here are the details:
              </Text>

              {/* Balance Details */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <Text className="text-gray-700 font-medium">Current Balance:</Text>
                    <Text className={`text-2xl font-bold ${currentBalance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatCurrency(currentBalance)}
                    </Text>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <Text className="text-gray-700 font-medium">Alert Threshold:</Text>
                    <Text className="text-lg font-semibold text-gray-900">
                      {formatCurrency(threshold)}
                    </Text>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <Text className="text-gray-700 font-medium">Difference:</Text>
                    <Text className="text-lg font-semibold text-red-600">
                      -{formatCurrency(differenceFromThreshold)}
                    </Text>
                  </div>

                  <div className="mt-4">
                    <Text className="text-sm text-gray-600 mb-2">
                      Balance vs. Threshold ({Math.round(percentageOfThreshold)}%)
                    </Text>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          percentageOfThreshold < 25 ? 'bg-red-500' : 
                          percentageOfThreshold < 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentageOfThreshold, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <Heading className="text-lg font-semibold text-blue-900 mb-4">
                  💡 What You Can Do
                </Heading>
                
                <div className="mb-4">
                  <div className="flex items-start mb-3">
                    <span className="text-blue-600 font-bold mr-3">•</span>
                    <Text className="text-blue-800">
                      <strong>Transfer funds</strong> from another account to avoid overdraft fees
                    </Text>
                  </div>
                  
                  <div className="flex items-start mb-3">
                    <span className="text-blue-600 font-bold mr-3">•</span>
                    <Text className="text-blue-800">
                      <strong>Review upcoming transactions</strong> to ensure sufficient funds
                    </Text>
                  </div>
                  
                  <div className="flex items-start mb-3">
                    <span className="text-blue-600 font-bold mr-3">•</span>
                    <Text className="text-blue-800">
                      <strong>Adjust your alert threshold</strong> if needed
                    </Text>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="text-blue-600 font-bold mr-3">•</span>
                    <Text className="text-blue-800">
                      <strong>Set up automatic transfers</strong> to prevent future low balances
                    </Text>
                  </div>
                </div>
              </div>

              {/* Warning for negative balances */}
              {currentBalance < 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                  <Heading className="text-lg font-semibold text-red-900 mb-3">
                    🚨 Negative Balance Alert
                  </Heading>
                  
                  <Text className="text-red-800 mb-3">
                    Your account currently has a negative balance. This may result in:
                  </Text>
                  
                  <div className="mb-2">
                    <Text className="text-red-700 mb-1">• Overdraft fees from your bank</Text>
                    <Text className="text-red-700 mb-1">• Declined transactions</Text>
                    <Text className="text-red-700">• Additional penalties</Text>
                  </div>
                  
                  <Text className="text-red-800 mt-3 font-medium">
                    Please take immediate action to resolve this.
                  </Text>
                </div>
              )}

              {/* Action Buttons */}
              <div className="text-center mb-8">
                <Button
                  href="https://nutsapp.ridyrich.engineer/accounts/transfer"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold mr-3"
                >
                  Transfer Funds
                </Button>
                
                <Button
                  href="https://nutsapp.ridyrich.engineer/settings/alerts"
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Manage Alerts
                </Button>
              </div>
              
              <Hr className="my-8 border-gray-200" />
              
              <Text className="text-gray-500 text-sm mb-2">
                This alert helps you avoid surprise charges and overdraft fees. You can adjust your alert settings anytime in your account preferences.
              </Text>
              
              <Text className="text-gray-500 text-sm">
                This is an automated alert from Nuts - your personal finance OS.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default LowBalanceAlertEmail;