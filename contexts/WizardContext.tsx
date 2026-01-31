'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

// Define types for our context
type TourId = string;

interface WizardContextType {
  startTour: (tourId: TourId) => void;
  endTour: () => void;
  isTourActive: boolean;
  currentTourId: TourId | null;
  markTourCompleted: (tourId: TourId) => void;
  isTourCompleted: (tourId: TourId) => boolean;
  resetTourHistory: () => void;
}

interface WizardProviderProps {
  children: ReactNode;
}

// Create the context
const WizardContext = createContext<WizardContextType | undefined>(undefined);

// Define tours with their steps
interface TourStep {
  id: string;
  title?: string;
  text: string;
  attachTo?: {
    element: string;
    on: string;
  };
  buttons?: Array<{
    text: string;
    action: string | (() => void);
    classes?: string;
  }>;
  classes?: string;
  highlightClass?: string;
  scrollTo?: boolean;
  canClickTarget?: boolean;
  showCancelLink?: boolean;
}

interface TourConfig {
  steps: TourStep[];
  options?: {
    useModalOverlay?: boolean;
    exitOnEsc?: boolean;
    keyboardNavigation?: boolean;
    defaultStepOptions?: {
      scrollTo?: boolean;
      cancelIcon?: {
        enabled?: boolean;
      };
    };
  };
}

// Apple-inspired theme styles
const tourStyles = `
  .shepherd-element {
    background: white !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
    padding: 20px !important;
    max-width: 360px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif !important;
  }
  
  .shepherd-header {
    padding-bottom: 12px !important;
  }
  
  .shepherd-title {
    font-size: 18px !important;
    font-weight: 600 !important;
    color: #1d1d1f !important;
    margin: 0 !important;
  }
  
  .shepherd-text {
    font-size: 15px !important;
    line-height: 1.5 !important;
    color: #424245 !important;
    margin: 8px 0 16px 0 !important;
  }
  
  .shepherd-footer {
    display: flex !important;
    justify-content: flex-end !important;
    gap: 8px !important;
    padding-top: 12px !important;
  }
  
  .shepherd-button {
    background: #007aff !important;
    color: white !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 8px 16px !important;
    font-size: 15px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: background 0.2s !important;
  }
  
  .shepherd-button:hover {
    background: #0051d5 !important;
  }
  
  .shepherd-button-secondary {
    background: #f5f5f7 !important;
    color: #1d1d1f !important;
  }
  
  .shepherd-button-secondary:hover {
    background: #e8e8ed !important;
  }
  
  .shepherd-modal-overlay-container {
    background: rgba(0, 0, 0, 0.5) !important;
  }
`;

// Define available tours
const tours: Record<TourId, TourConfig> = {
  'admin-dashboard': {
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Your Admin Dashboard',
        text: 'This powerful dashboard gives you complete control over your platform. Let\'s explore the key features.',
        buttons: [
          {
            text: 'Get Started',
            action: 'next'
          }
        ]
      },
      {
        id: 'sidebar',
        title: 'Navigation Sidebar',
        text: 'Access all admin features from here. Each section is designed for specific management tasks.',
        attachTo: {
          element: '[data-tour="sidebar"]',
          on: 'right'
        },
        buttons: [
          {
            text: 'Next',
            action: 'next'
          }
        ]
      },
      {
        id: 'stats',
        title: 'Platform Statistics',
        text: 'Monitor key metrics at a glance. Click any stat card for detailed analytics.',
        attachTo: {
          element: '[data-tour="stats"]',
          on: 'bottom'
        },
        buttons: [
          {
            text: 'Next',
            action: 'next'
          }
        ]
      },
      {
        id: 'users',
        title: 'User Management',
        text: 'View, search, and manage all platform users from this central location.',
        attachTo: {
          element: '[data-tour="users-section"]',
          on: 'top'
        },
        buttons: [
          {
            text: 'Finish',
            action: 'complete'
          }
        ]
      }
    ],
    options: {
      useModalOverlay: true,
      exitOnEsc: true,
      keyboardNavigation: true,
      defaultStepOptions: {
        scrollTo: true,
        cancelIcon: {
          enabled: true
        }
      }
    }
  },
  
  'business-owner-dashboard': {
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Your Business Dashboard',
        text: 'Manage your digital assets, track sales, and connect with designers all in one place.',
        buttons: [
          {
            text: 'Start Tour',
            action: 'next'
          }
        ]
      },
      {
        id: 'products',
        title: 'Your Products',
        text: 'Create and manage your digital products. Each product can have multiple design templates.',
        attachTo: {
          element: '[data-tour="products"]',
          on: 'bottom'
        },
        buttons: [
          {
            text: 'Next',
            action: 'next'
          }
        ]
      },
      {
        id: 'designers',
        title: 'Designer Network',
        text: 'Browse and connect with talented designers. View portfolios and send collaboration requests.',
        attachTo: {
          element: '[data-tour="designers"]',
          on: 'top'
        },
        buttons: [
          {
            text: 'Next',
            action: 'next'
          }
        ]
      },
      {
        id: 'api-keys',
        title: 'API Integration',
        text: 'Generate API keys to integrate your products with external platforms and services.',
        attachTo: {
          element: '[data-tour="api-keys"]',
          on: 'left'
        },
        buttons: [
          {
            text: 'Complete',
            action: 'complete'
          }
        ]
      }
    ]
  },
  
  'designer-dashboard': {
    steps: [
      {
        id: 'welcome',
        title: 'Designer Studio',
        text: 'Your creative workspace for managing projects, templates, and client collaborations.',
        buttons: [
          {
            text: 'Begin',
            action: 'next'
          }
        ]
      },
      {
        id: 'portfolio',
        title: 'Portfolio Showcase',
        text: 'Showcase your best work. Keep your portfolio updated to attract more clients.',
        attachTo: {
          element: '[data-tour="portfolio"]',
          on: 'bottom'
        },
        buttons: [
          {
            text: 'Next',
            action: 'next'
          }
        ]
      },
      {
        id: 'templates',
        title: 'Design Templates',
        text: 'Create reusable templates for different product types. Set your pricing and licensing terms.',
        attachTo: {
          element: '[data-tour="templates"]',
          on: 'top'
        },
        buttons: [
          {
            text: 'Next',
            action: 'next'
          }
        ]
      },
      {
        id: 'earnings',
        title: 'Earnings Dashboard',
        text: 'Track your earnings, view payment history, and manage withdrawal settings.',
        attachTo: {
          element: '[data-tour="earnings"]',
          on: 'left'
        },
        buttons: [
          {
            text: 'Finish Tour',
            action: 'complete'
          }
        ]
      }
    ]
  }
};

// Provider component
export function WizardProvider({ children }: WizardProviderProps) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentTourId, setCurrentTourId] = useState<TourId | null>(null);
  const [completedTours, setCompletedTours] = useState<Set<TourId>>(new Set());
  const tourRef = useRef<InstanceType<typeof Shepherd.Tour> | null>(null);

  // Load completed tours from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('completedTours');
    if (stored) {
      setCompletedTours(new Set(JSON.parse(stored)));
    }
  }, []);

  // Save completed tours to localStorage
  useEffect(() => {
    if (completedTours.size > 0) {
      localStorage.setItem('completedTours', JSON.stringify(Array.from(completedTours)));
    }
  }, [completedTours]);

  // Add styles to document
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = tourStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const startTour = (tourId: TourId) => {
    const tourConfig = tours[tourId];
    if (!tourConfig) {
      console.warn(`Tour "${tourId}" not found`);
      return;
    }

    // Clean up existing tour
    if (tourRef.current) {
      tourRef.current.complete();
    }

    // Create new tour instance
    const tour = new Shepherd.Tour({
      useModalOverlay: tourConfig.options?.useModalOverlay ?? true,
      defaultStepOptions: {
        cancelIcon: {
          enabled: tourConfig.options?.defaultStepOptions?.cancelIcon?.enabled ?? true
        },
        scrollTo: tourConfig.options?.defaultStepOptions?.scrollTo ?? true
      }
    });

    // Add steps
    tourConfig.steps.forEach(step => {
      const shepherdStep: any = {
        id: step.id,
        title: step.title,
        text: step.text,
        scrollTo: step.scrollTo ?? true,
        classes: step.classes,
        highlightClass: step.highlightClass,
        canClickTarget: step.canClickTarget ?? false,
        buttons: step.buttons?.map(button => {
          if (typeof button.action === 'string') {
            if (button.action === 'next') {
              return {
                text: button.text,
                action: tour.next,
                classes: button.classes
              };
            } else if (button.action === 'back') {
              return {
                text: button.text,
                action: tour.back,
                classes: button.classes
              };
            } else if (button.action === 'complete') {
              return {
                text: button.text,
                action: tour.complete,
                classes: button.classes
              };
            }
          }
          return {
            text: button.text,
            action: button.action,
            classes: button.classes
          };
        })
      };

      if (step.attachTo) {
        shepherdStep.attachTo = step.attachTo;
      }

      tour.addStep(shepherdStep);
    });

    // Set up event handlers
    tour.on('complete', () => {
      if (currentTourId) {
        markTourCompleted(currentTourId);
      }
      endTour();
    });

    tour.on('cancel', () => {
      endTour();
    });

    // Store tour reference
    tourRef.current = tour;
    setCurrentTourId(tourId);
    setIsTourActive(true);
    
    // Start the tour
    tour.start();
  };

  const endTour = () => {
    if (tourRef.current) {
      tourRef.current.complete();
      tourRef.current = null;
    }
    setIsTourActive(false);
    setCurrentTourId(null);
  };

  const markTourCompleted = (tourId: TourId) => {
    setCompletedTours(prev => new Set([...prev, tourId]));
  };

  const isTourCompleted = (tourId: TourId) => {
    return completedTours.has(tourId);
  };

  const resetTourHistory = () => {
    setCompletedTours(new Set());
    localStorage.removeItem('completedTours');
  };

  return (
    <WizardContext.Provider
      value={{
        startTour,
        endTour,
        isTourActive,
        currentTourId,
        markTourCompleted,
        isTourCompleted,
        resetTourHistory,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

// Custom hook to use the wizard context
export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}