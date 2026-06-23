import { create } from 'zustand';
import { LabResult, LifestyleEvent, OverlapZoneResult, SimulatorScenario, UserProfile } from '../types';
import { calcOverlapZone, simulateScenario } from '../algorithms/overlapZone';
import {
  loadProfile, saveProfile,
  loadLabResults, saveLabResult, deleteLabResult,
  loadLifestyleEvents, saveLifestyleEvent,
  loadScenarios, saveScenario,
} from '../db/database';

interface AppState {
  // Data
  profile: UserProfile | null;
  labs: LabResult[];
  events: LifestyleEvent[];
  scenarios: SimulatorScenario[];

  // Derived
  latestOverlapZone: OverlapZoneResult | null;
  simulatedOverlapZone: OverlapZoneResult | null;

  // Debate slider
  metabolicBias: number; // 0–100

  // Simulator sliders
  weightLossDelta: number;
  tgReductionPct: number;
  ldlTargetMgDl: number;

  // UI
  isLoaded: boolean;

  // Actions
  loadAll: () => Promise<void>;
  setProfile: (profile: UserProfile) => Promise<void>;
  addLabResult: (lab: LabResult) => Promise<void>;
  removeLabResult: (id: string) => Promise<void>;
  addLifestyleEvent: (event: LifestyleEvent) => Promise<void>;
  addScenario: (scenario: SimulatorScenario) => Promise<void>;
  setMetabolicBias: (bias: number) => void;
  setSimulatorSlider: (key: 'weightLossDelta' | 'tgReductionPct' | 'ldlTargetMgDl', value: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  labs: [],
  events: [],
  scenarios: [],
  latestOverlapZone: null,
  simulatedOverlapZone: null,
  metabolicBias: 50,
  weightLossDelta: 0,
  tgReductionPct: 0,
  ldlTargetMgDl: 100,
  isLoaded: false,

  loadAll: async () => {
    const [profile, labs, events, scenarios] = await Promise.all([
      loadProfile(),
      loadLabResults(),
      loadLifestyleEvents(),
      loadScenarios(),
    ]);
    const latest = labs[0] ?? null;
    const latestOverlapZone = profile && latest
      ? calcOverlapZone({ profile, lab: latest, metabolicBias: get().metabolicBias })
      : null;
    set({ profile, labs, events, scenarios, latestOverlapZone, isLoaded: true });
  },

  setProfile: async (profile) => {
    await saveProfile(profile);
    set({ profile });
    recomputeAll(get, set);
  },

  addLabResult: async (lab) => {
    await saveLabResult(lab);
    const labs = [lab, ...get().labs.filter(l => l.id !== lab.id)];
    set({ labs });
    recomputeAll(get, set);
  },

  removeLabResult: async (id) => {
    await deleteLabResult(id);
    const labs = get().labs.filter(l => l.id !== id);
    set({ labs });
    recomputeAll(get, set);
  },

  addLifestyleEvent: async (event) => {
    await saveLifestyleEvent(event);
    set({ events: [event, ...get().events] });
  },

  addScenario: async (scenario) => {
    await saveScenario(scenario);
    set({ scenarios: [scenario, ...get().scenarios] });
  },

  setMetabolicBias: (bias) => {
    set({ metabolicBias: bias });
    recomputeAll(get, set);
  },

  setSimulatorSlider: (key, value) => {
    set({ [key]: value } as any);
    recomputeSimulated(get, set);
  },
}));

function recomputeAll(get: () => AppState, set: (s: Partial<AppState>) => void) {
  const { profile, labs, metabolicBias } = get();
  const latest = labs[0] ?? null;
  if (!profile || !latest) return;
  const latestOverlapZone = calcOverlapZone({ profile, lab: latest, metabolicBias });
  set({ latestOverlapZone });
  recomputeSimulated(get, set);
}

function recomputeSimulated(get: () => AppState, set: (s: Partial<AppState>) => void) {
  const { profile, labs, metabolicBias, weightLossDelta, tgReductionPct, ldlTargetMgDl, latestOverlapZone } = get();
  const latest = labs[0] ?? null;
  if (!profile || !latest || !latestOverlapZone) return;
  const simulatedOverlapZone = simulateScenario(
    latestOverlapZone, weightLossDelta, tgReductionPct, ldlTargetMgDl, profile, latest, metabolicBias
  );
  set({ simulatedOverlapZone });
}
