export interface Property {
  id: string;
  name: string;
  address: string;
  propertyType: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  type: 'primary' | 'rental';
  image: string;
  mortgage?: {
    loanAmount: number;
    interestRate: number;
    loanTerm: number;
    monthlyPayment: number;
  };
  rental?: {
    monthlyRent: number;
    occupancyRate: number;
  };
}

export interface RealEstateState {
  properties: Property[];
  totalValue: number;
  totalEquity: number;
  totalDebt: number;
  totalRentalIncome: number;
}
