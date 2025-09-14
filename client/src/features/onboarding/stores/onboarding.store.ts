import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface OnboardingState {
  // Current step (0-6)
  currentStep: number;

  // User responses
  firstName: string;
  lastName: string;
  wantsBetterFinance: boolean | null;
  selectedGoals: string[];
  feelsComplexFinance: boolean | null;

  // State management
  isCompleted: boolean;

  // Actions
  setStep: (step: number) => void;
  setName: (firstName: string, lastName: string) => void;
  setBetterFinance: (wants: boolean | null) => void;
  setGoals: (goals: string[]) => void;
  setComplexFinance: (feels: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const initialState = {
  currentStep: 0,
  firstName: '',
  lastName: '',
  wantsBetterFinance: null,
  selectedGoals: [],
  feelsComplexFinance: null,
  isCompleted: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setStep: (step) => set({ currentStep: step }, false, 'onboarding/setStep'),

        setName: (firstName, lastName) =>
          set({ firstName, lastName }, false, 'onboarding/setName'),

        setBetterFinance: (wantsBetterFinance) =>
          set({ wantsBetterFinance }, false, 'onboarding/setBetterFinance'),

        setGoals: (selectedGoals) =>
          set({ selectedGoals }, false, 'onboarding/setGoals'),

        setComplexFinance: (feelsComplexFinance) =>
          set({ feelsComplexFinance }, false, 'onboarding/setComplexFinance'),

        completeOnboarding: () =>
          set({ isCompleted: true }, false, 'onboarding/complete'),

        resetOnboarding: () =>
          set({ ...initialState }, false, 'onboarding/reset'),
      }),
      {
        name: 'onboarding-storage',
        partialize: (state) => ({
          currentStep: state.currentStep,
          firstName: state.firstName,
          lastName: state.lastName,
          wantsBetterFinance: state.wantsBetterFinance,
          selectedGoals: state.selectedGoals,
          feelsComplexFinance: state.feelsComplexFinance,
          isCompleted: state.isCompleted,
        }),
      }
    )
  )
);
