import { Home, Building, Map, LineChart } from 'lucide-react';
import { RealEstateOverview } from './pages/overview';
import { RealEstateProperties } from './pages/properties';
import { RealEstateMap } from './pages/map';
import { RealEstateAnalytics } from './pages/analytics';
import { RealEstateSettings } from './pages/settings';
import { PropertyValueChart } from './components/property-value-chart';
import { RentalIncomeChart } from './components/rental-income-chart';
import { MortgagePaymentChart } from './components/morgage-payment-chart';
import { PluginInterface } from '@/lib/plugin-system';

export const realEstatePlugin : PluginInterface = {
  id: 'real-estate',
  name: 'Real Estate',
  description: 'Track and manage your real estate investments',
  version: '1.0.0',
  author: 'Finance Dashboard Team',
  icon: Home,
  routes: [
    {
      path: '/real-estate',
      label: 'Real Estate',
      icon: Home,
      component: RealEstateOverview,
      subroutes: [
        {
          path: '/real-estate/properties',
          label: 'Properties',
          component: RealEstateProperties,
        },
        {
          path: '/real-estate/map',
          label: 'Map View',
          component: RealEstateMap,
        },
        {
          path: '/real-estate/analytics',
          label: 'Analytics',
          component: RealEstateAnalytics,
        },
      ],
    },
  ],
  charts: [
    {
      id: 'property-value',
      type: 'property-value',
      title: 'Property Value',
      component: PropertyValueChart,
      defaultSize: 2,
    },
    {
      id: 'rental-income',
      type: 'rental-income',
      title: 'Rental Income',
      component: RentalIncomeChart,
      defaultSize: 1,
    },
    {
      id: 'mortgage-payment',
      type: 'mortgage-payment',
      title: 'Mortgage Payments',
      component: MortgagePaymentChart,
      defaultSize: 1,
    },
  ],
  settings: RealEstateSettings,
};
