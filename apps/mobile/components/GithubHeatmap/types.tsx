// Core data types
export type ContributionData = Record<string, number>;

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export type CalendarAnimationControls = {
  startAnimation: () => void;
  resetAnimation: () => void;
  toggleAnimation: () => void;
};

export type Symptoms = Record<string, number>; // symptom -> severity
export type Report = {
  timestamp: number; // ISO string or 'yyyy-MM-dd'
  symptoms: Symptoms;
};
