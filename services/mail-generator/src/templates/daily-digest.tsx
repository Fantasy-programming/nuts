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
import { DailyDigestEmailProps } from '../types';

const DailyDigestEmail: React.FC<DailyDigestEmailProps> = ({ 
  name, 
  email, 
  date, 
  balanceSummary, 
  transactions, 
  insights 
}) => {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'spending': return '💸';
      case 'saving': return '💰';
      case 'income': return '📈';
      case 'warning': return '⚠️';
      default: return '📊';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'spending': return 'text-red-600';
      case 'saving': return 'text-green-600';
      case 'income': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 max-w-3xl bg-white">
            <Section className="px-8 py-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-2xl">📊</span>
                </div>
                <Heading className="text-3xl font-bold text-gray-900">
                  Your Daily Financial Digest
                </Heading>
                <Text className="text-gray-600 text-lg">
                  {formatDate(date)}
                </Text>
              </div>
              
              <Text className="text-gray-700 text-lg mb-8">
                Good morning {name},
              </Text>
              
              <Text className="text-gray-700 mb-8">
                Here's your comprehensive overview of yesterday's financial activity, delivered fresh to your inbox!
              </Text>

              {/* Balance Summary */}
              <Section className="mb-8">
                <Heading className="text-2xl font-semibold text-gray-900 mb-6">
                  💰 Balance Summary
                </Heading>
                
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <div className="text-center">
                    <Text className="text-3xl font-bold text-gray-900 mb-2">
                      {formatCurrency(balanceSummary.totalBalance, balanceSummary.currency)}
                    </Text>
                    <Text className="text-gray-600">Total Balance</Text>
                    
                    {balanceSummary.change !== 0 && (
                      <div className={`mt-2 ${balanceSummary.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <Text className="font-medium">
                          {balanceSummary.change > 0 ? '+' : ''}{formatCurrency(balanceSummary.change, balanceSummary.currency)}
                        </Text>
                        <Text className="text-sm">vs. previous day</Text>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  {balanceSummary.accounts.map((account, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <Text className="font-medium text-gray-900">{account.name}</Text>
                          <Text className="text-sm text-gray-600">{account.type}</Text>
                        </div>
                        <Text className="font-semibold text-gray-900">
                          {formatCurrency(account.balance, balanceSummary.currency)}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Recent Transactions */}
              <Section className="mb-8">
                <Heading className="text-2xl font-semibold text-gray-900 mb-6">
                  💳 Transaction Highlights
                </Heading>
                
                <div className="mb-4">
                  {transactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Text className="font-medium text-gray-900">{transaction.description}</Text>
                          <div className="flex items-center mt-1">
                            <Text className="text-sm text-gray-600 mr-4">{transaction.category}</Text>
                            <Text className="text-sm text-gray-600 mr-4">{transaction.account}</Text>
                            <Text className="text-sm text-gray-600">{formatDate(transaction.date)}</Text>
                          </div>
                        </div>
                        <Text className={`font-semibold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {transaction.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount), balanceSummary.currency)}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
                
                {transactions.length > 5 && (
                  <Text className="text-center text-gray-600 mt-4">
                    ... and {transactions.length - 5} more transactions
                  </Text>
                )}
              </Section>

              {/* Insights */}
              <Section className="mb-8">
                <Heading className="text-2xl font-semibold text-gray-900 mb-6">
                  🔍 Financial Insights
                </Heading>
                
                <div className="mb-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">{getInsightIcon(insight.type)}</span>
                        <div className="flex-1">
                          <Text className={`font-medium ${getInsightColor(insight.type)}`}>
                            {insight.title}
                          </Text>
                          <Text className="text-gray-700 mt-1">{insight.message}</Text>
                          {insight.value && (
                            <Text className="text-sm text-gray-600 mt-1">
                              {formatCurrency(insight.value, balanceSummary.currency)}
                            </Text>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Call to Action */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center mb-8">
                <Text className="text-blue-900 font-medium mb-4">
                  📱 Monitor your account activity throughout the day to track money movement across all connected accounts and catch any errors or unwanted charges.
                </Text>
                <Button
                  href="https://nutsapp.ridyrich.engineer/dashboard"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg"
                >
                  View Full Dashboard
                </Button>
              </div>
              
              <Hr className="my-8 border-gray-200" />
              
              <Text className="text-gray-500 text-sm mb-2">
                This daily digest is delivered every morning to help you stay on top of your finances. 
                Want to adjust your digest preferences?
              </Text>
              
              <Text className="text-gray-500 text-sm">
                <Button
                  href="https://nutsapp.ridyrich.engineer/settings/notifications"
                  className="text-blue-600 underline"
                >
                  Manage Email Preferences
                </Button>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default DailyDigestEmail;