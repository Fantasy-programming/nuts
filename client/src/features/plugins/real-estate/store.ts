import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Property, RealEstateState } from './types';

interface RealEstateStore extends RealEstateState {
  addProperty: (property: Property) => void;
  updateProperty: (id: string, property: Partial<Property>) => void;
  removeProperty: (id: string) => void;
  calculateTotals: () => void;
}

export const useRealEstateStore = create<RealEstateStore>()(
  persist(
    (set, get) => ({
      properties: [],
      totalValue: 0,
      totalEquity: 0,
      totalDebt: 0,
      totalRentalIncome: 0,

      addProperty: (property) => {
        set((state) => ({
          properties: [...state.properties, property],
        }));
        get().calculateTotals();
      },

      updateProperty: (id, updatedProperty) => {
        set((state) => ({
          properties: state.properties.map((property) =>
            property.id === id ? { ...property, ...updatedProperty } : property
          ),
        }));
        get().calculateTotals();
      },

      removeProperty: (id) => {
        set((state) => ({
          properties: state.properties.filter((property) => property.id !== id),
        }));
        get().calculateTotals();
      },

      calculateTotals: () => {
        const properties = get().properties;

        const totalValue = properties.reduce(
          (sum, property) => sum + property.currentValue,
          0
        );

        const totalDebt = properties.reduce(
          (sum, property) => sum + (property.mortgage?.loanAmount || 0),
          0
        );

        const totalEquity = totalValue - totalDebt;

        const totalRentalIncome = properties.reduce(
          (sum, property) =>
            property.type === 'rental'
              ? sum + (property.rental?.monthlyRent || 0)
              : sum,
          0
        );

        set({
          totalValue,
          totalEquity,
          totalDebt,
          totalRentalIncome,
        });
      },
    }),
    {
      name: 'real-estate-storage',
    }
  )
);

// Initialize with sample data
if (typeof window !== 'undefined') {
  const store = useRealEstateStore.getState();

  if (store.properties.length === 0) {
    store.addProperty({
      id: '1',
      name: 'Main Residence',
      address: '123 Main St, Anytown, USA',
      propertyType: 'single-family',
      purchaseDate: '2020-05-15',
      purchasePrice: 350000,
      currentValue: 425000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1800,
      type: 'primary',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000',
      mortgage: {
        loanAmount: 280000,
        interestRate: 3.5,
        loanTerm: 30,
        monthlyPayment: 1257.43,
      },
    });

    store.addProperty({
      id: '2',
      name: 'Rental Property',
      address: '456 Oak Ave, Othertown, USA',
      propertyType: 'condo',
      purchaseDate: '2021-08-10',
      purchasePrice: 220000,
      currentValue: 245000,
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1200,
      type: 'rental',
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1000',
      mortgage: {
        loanAmount: 176000,
        interestRate: 3.75,
        loanTerm: 30,
        monthlyPayment: 815.27,
      },
      rental: {
        monthlyRent: 1800,
        occupancyRate: 95,
      },
    });
  }
}
