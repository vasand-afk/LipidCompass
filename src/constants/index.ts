export const COLORS = {
  primary: '#0F4C75',
  primaryLight: '#1B6CA8',
  green: '#27AE60',
  greenLight: '#EAFAF1',
  yellow: '#F39C12',
  yellowLight: '#FEF9E7',
  red: '#E74C3C',
  redLight: '#FDEDEC',
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray400: '#ADB5BD',
  gray600: '#6C757D',
  gray800: '#343A40',
  white: '#FFFFFF',
  cardBg: '#FFFFFF',
  background: '#F0F4F8',
};

export const TYPOGRAPHY = {
  heading1: { fontSize: 28, fontWeight: '700' as const, color: COLORS.gray800 },
  heading2: { fontSize: 22, fontWeight: '700' as const, color: COLORS.gray800 },
  heading3: { fontSize: 18, fontWeight: '600' as const, color: COLORS.gray800 },
  body: { fontSize: 15, fontWeight: '400' as const, color: COLORS.gray800 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: COLORS.gray600 },
  label: { fontSize: 12, fontWeight: '600' as const, color: COLORS.gray600, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Reference ranges shown inline in Log Labs
export const REFERENCE_RANGES = {
  ldlC: { optimal: '<100', borderline: '100–129', high: '130–159', veryHigh: '≥190', unit: 'mg/dL' },
  hdlC: { low: '<40 (M) / <50 (F)', optimal: '≥60', unit: 'mg/dL' },
  totalChol: { desirable: '<200', borderline: '200–239', high: '≥240', unit: 'mg/dL' },
  triglycerides: { normal: '<150', borderline: '150–199', high: '200–499', veryHigh: '≥500', unit: 'mg/dL' },
  apoB: { optimal: '<80', high: '≥100', unit: 'mg/dL' },
  lpa: { elevated: '≥50 mg/dL', unit: 'mg/dL' },
  fastingGlucose: { normal: '<100', prediabetes: '100–125', diabetes: '≥126', unit: 'mg/dL' },
  fastingInsulin: { optimal: '<5', normal: '5–10', high: '>10', unit: 'µIU/mL' },
  homaIr: { optimal: '<1.0', normal: '1.0–1.9', insulinResistance: '≥2.0', unit: '' },
  tgHdl: { optimal: '<1.5', elevated: '≥3.0', unit: 'ratio' },
};

export const SIDE_EFFECT_DATA = {
  muscle_pain: {
    label: 'Muscle Pain (Myalgia)',
    incidenceBase: 5,   // % — actual published rate from large trials
    monitoringSteps: [
      'Baseline CK level before starting',
      'Repeat CK at 6 weeks if symptoms arise',
      'Stop if CK >10× upper limit of normal',
    ],
    rechallengeProtocol: [
      'Wait 2–4 weeks off statin',
      'Start rosuvastatin 2.5 mg twice weekly (Sun/Wed)',
      'Hold for 4 weeks; assess symptoms',
      'If tolerated, uptitrate to 5 mg twice weekly',
      'Re-evaluate at 3 months with CK and LDL-C',
    ],
  },
  cognitive: {
    label: 'Cognitive / Brain Fog',
    incidenceBase: 1,
    monitoringSteps: [
      'Document baseline cognitive concerns (use a short diary)',
      'Symptoms typically resolve within weeks of stopping',
      'Consider lipophilic vs. hydrophilic statin switch (rosuvastatin → pravastatin)',
    ],
    rechallengeProtocol: [
      'Switch to pravastatin 20 mg (most hydrophilic — fewer CNS effects)',
      'Monitor for 8 weeks',
      'If symptoms persist, discuss PCSK9 inhibitor alternative with provider',
    ],
  },
  blood_sugar: {
    label: 'Blood Sugar Elevation',
    incidenceBase: 10,  // % — NNH varies by intensity
    monitoringSteps: [
      'Baseline fasting glucose + HbA1c',
      'Recheck at 3 months',
      'Lifestyle optimization (exercise, low-carb) substantially offsets this risk',
    ],
    rechallengeProtocol: [
      'Use lowest effective statin dose',
      'Prioritize rosuvastatin or pravastatin (lower diabetogenic risk)',
      'Recheck glucose at 3 and 6 months',
    ],
  },
  liver: {
    label: 'Liver Enzyme Elevation',
    incidenceBase: 1,
    monitoringSteps: [
      'Baseline ALT/AST before starting',
      'Recheck at 12 weeks',
      'Clinically significant elevation (>3× ULN) is rare (<0.5%)',
    ],
    rechallengeProtocol: [
      'Stop statin; recheck LFTs in 4–6 weeks',
      'If LFTs normalize: rechallenge at lower dose',
      'Consider alternative: ezetimibe or bempedoic acid',
    ],
  },
};
