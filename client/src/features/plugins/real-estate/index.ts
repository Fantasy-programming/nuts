import { lazy } from 'react';
import { Home, Building, Map as MapIcon, LineChart } from 'lucide-react';
import type { PluginConfigExternal } from '../types';

import { PropertyValueChart } from './components/property-value-chart';
import { RentalIncomeChart } from './components/rental-income-chart';
import { MortgagePaymentChart } from './components/morgage-payment-chart';

const Overview = lazy(() => import('./pages/overview'));
const Map = lazy(() => import('./pages/map'));
const Properties = lazy(() => import('./pages/properties'));
const Analytics = lazy(() => import('./pages/analytics'));
const Settings = lazy(() => import('./pages/settings'));


// Export the plugin configuration
export default {
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
      component: lazy(() => import("./pages/overview")),
      subroutes: [
        {
          path: '/real-estate/properties',
          label: 'Properties',
          component: Properties,
          icon: Building
        },
        {
          path: '/real-estate/map',
          label: 'Map View',
          component: Map,
          icon: MapIcon
        },
        {
          path: '/real-estate/analytics',
          label: 'Analytics',
          component: Analytics,
          icon: LineChart
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
  settings: Settings,
} as PluginConfigExternal;

// Also export all components individually to support dynamic imports
export { Overview };
export { Properties };
export { Map };
export { Analytics };
export { Settings };
export { PropertyValueChart };
export { RentalIncomeChart };
export { MortgagePaymentChart };
