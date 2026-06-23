export interface UserProfile {
  id: string;
  age: number;
  sex: 'male' | 'female';
  isSmoker: boolean;
  hasDiabetes: boolean;
  systolicBP: number;
  onBPMeds: boolean;
  familyHistoryCVD: boolean;
  knowsLpa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabResult {
  id: string;
  date: string;
  source: 'doctor' | 'home_draw' | 'lab' | 'other';
  // Standard panel
  ldlC?: number;       // mg/dL
  hdlC?: number;       // mg/dL
  totalChol?: number;  // mg/dL
  triglycerides?: number; // mg/dL
  nonHdlC?: number;    // mg/dL
  // Advanced
  apoB?: number;       // mg/dL
  lpa?: number;        // mg/dL (nmol/L conversion noted in UI)
  // Metabolic
  fastingGlucose?: number; // mg/dL
  fastingInsulin?: number; // µIU/mL
  homaIr?: number;         // calculated
  notes?: string;
}

export interface LifestyleEvent {
  id: string;
  date: string;
  type: 'medication_start' | 'medication_stop' | 'diet_change' | 'weight_change' | 'exercise_change' | 'other';
  label: string;
  detail?: string;
}

export interface SimulatorScenario {
  id: string;
  name: string;
  createdAt: string;
  // Slider positions
  weightLossDelta: number;    // lbs lost
  tgReductionPct: number;     // % reduction in TG
  ldlTargetMgDl: number;      // target LDL-C
  // Result
  overlapZoneScore: number;   // 0–100
}

export interface SideEffectConcern {
  concern: 'muscle_pain' | 'cognitive' | 'blood_sugar' | 'liver' | 'none';
}

export type OverlapZonePosition = 'green' | 'yellow' | 'red';

export interface OverlapZoneResult {
  score: number;            // 0–100
  position: OverlapZonePosition;
  ascvdRisk10yr: number;    // %
  tgHdlRatio: number;
  homaIr?: number;
  recommendation: string;
  factors: {
    label: string;
    contribution: number;   // 0–1 weight used
    value: string;
  }[];
}

export interface DebateWeighting {
  // 0 = full cardiovascular (LDL camp), 100 = full metabolic (TG/IR camp)
  metabolicBias: number;
}
