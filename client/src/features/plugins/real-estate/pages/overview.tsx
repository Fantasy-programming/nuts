import { useRealEstateStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Home,
  DollarSign,
  PiggyBank,
  ArrowUpRight,
  Building,
} from 'lucide-react';
import React, { useCallback, useMemo } from 'react';


interface ChartValues {
  name: string,
  value: number
}

interface MExpData {
  name: string,
  mortgage: number,
  income: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function Overview() {
  const properties = useRealEstateStore(state => state.properties);
  const totalValue = useRealEstateStore(state => state.totalValue);
  const totalEquity = useRealEstateStore(state => state.totalEquity);
  const totalDebt = useRealEstateStore(state => state.totalDebt);
  const totalRentalIncome = useRealEstateStore(state => state.totalRentalIncome)


  const propertyValueData = useMemo(() => {
  return properties.map(property => ({
    name: property.name,
    value: property.currentValue
  }));
}, [properties]);

const equityDebtData = useMemo(() => [
  { name: 'Equity', value: totalEquity },
  { name: 'Debt', value: totalDebt }
], [totalEquity, totalDebt]);



  const monthlyExpenseData = useMemo(() => { 
  return properties.map((property) => ({
    name: property.name,
    mortgage: property.mortgage?.monthlyPayment || 0,
    income: property.type === 'rental' ? property.rental?.monthlyRent || 0 : 0,
  }));
}, [properties]);

  const valueFormatter = useCallback(
    (value: string) => [`$${value.toLocaleString()}`, 'Value'],
    []
  );

  const pieChartLabelFormatter = useCallback(
  ({ name, percent }: {name: string, percent: number}) => `${name}: ${(percent * 100).toFixed(0)}%`,
  []
);




  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Real Estate Overview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Property Value</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {properties.length} properties
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEquity.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-500">
              <ArrowUpRight className="mr-1 h-4 w-4" />
              {totalEquity > 0 ? ((totalEquity / totalValue) * 100).toFixed(1) : 0}% of value
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDebt.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {totalDebt > 0 ? ((totalDebt / totalValue) * 100).toFixed(1) : 0}% of value
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rental Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRentalIncome.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-500">
              <ArrowUpRight className="mr-1 h-4 w-4" />
              ${(totalRentalIncome * 12).toLocaleString()} annually
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="value" className="space-y-4">
        <TabsList>
          <TabsTrigger value="value">Property Value</TabsTrigger>
          <TabsTrigger value="equity">Equity & Debt</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>
        <TabsContent value="value" className="space-y-4">
          <PropertyValueChart data={propertyValueData} labelFormatter={pieChartLabelFormatter} chartValueFormatter={valueFormatter} />
        </TabsContent>
        <TabsContent value="equity" className="space-y-4">
                    <EquityChart data={equityDebtData} labelFormatter={pieChartLabelFormatter} chartValueFormatter={valueFormatter} />
        </TabsContent>
        <TabsContent value="cashflow" className="space-y-4">
          <CashFlowChart data={monthlyExpenseData} chartValueFormatter={valueFormatter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PVChartInterface {
  data: ChartValues[],
  labelFormatter: ({ name, percent }: { name: string; percent: number }) => string,
  chartValueFormatter:  (value: string) => string[] 
}


const PropertyValueChart = React.memo(({data, labelFormatter, chartValueFormatter}: PVChartInterface) => {
   return (<Card>
    <CardHeader>
      <CardTitle>Property Value Distribution</CardTitle>
    </CardHeader>
    <CardContent className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={labelFormatter}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={chartValueFormatter} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>);
});

interface CashFlowChartInterface {
  data: MExpData[],
  chartValueFormatter:  (value: string) => string[] 
}

const CashFlowChart = React.memo(({data, chartValueFormatter}: CashFlowChartInterface) => {
   return (
   <Card>
            <CardHeader>
              <CardTitle>Monthly Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={chartValueFormatter} />
                  <Legend />
                  <Bar dataKey="mortgage" name="Mortgage Payment" fill="#EF4444" />
                  <Bar dataKey="income" name="Rental Income" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          );
});

const EquityChart = React.memo(({data, labelFormatter, chartValueFormatter}: PVChartInterface) => {
   return (
  <Card>
            <CardHeader>
              <CardTitle>Equity vs Debt</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
            label={labelFormatter}
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip formatter={chartValueFormatter} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          );
});


export default Overview;
