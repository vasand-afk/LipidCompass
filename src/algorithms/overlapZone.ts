import { LabResult, OverlapZoneResult, UserProfile } from '../types';

/**
 * AHA Pooled Cohort Equation — simplified implementation.
 * Returns 10-year ASCVD risk as a percentage (0–100).
 */
function calcASCVD10yr(profile: UserProfile, ldlC: number, hdlC: number): number {
  const { age, sex, isSmoker, hasDiabetes, systolicBP, onBPMeds } = profile;

  // Coefficients from 2013 ACC/AHA Pooled Cohort Equations
  // African-American and White equations averaged for simplicity in this implementation
  const lnAge = Math.log(age);
  const lnTC = Math.log(213); // total chol approximated if not available
  const lnHDL = Math.log(Math.max(hdlC, 20));
  const lnSBP = Math.log(Math.max(systolicBP, 90));

  let sum = 0;

  if (sex === 'male') {
    sum =
      12.344 * lnAge +
      11.853 * lnTC +
      -2.664 * lnHDL +
      (onBPMeds ? 1.764 : 1.797) * lnSBP +
      (isSmoker ? 7.837 : 0) +
      (hasDiabetes ? 0.661 : 0);
    return Math.min(Math.max((1 - Math.pow(0.9144, Math.exp(sum - 61.18))) * 100, 0), 100);
  } else {
    sum =
      -29.799 * lnAge +
      4.884 * lnAge * lnAge +
      13.54 * lnTC +
      -3.114 * lnAge * lnTC +
      -13.578 * lnHDL +
      3.149 * lnAge * lnHDL +
      (onBPMeds ? 2.019 : 1.957) * lnSBP +
      (isSmoker ? 7.574 : 0) +
      (hasDiabetes ? 0.661 : 0);
    return Math.min(Math.max((1 - Math.pow(0.9665, Math.exp(sum - (-29.799)))) * 100, 0), 100);
  }
}

export interface OverlapZoneInput {
  profile: UserProfile;
  lab: LabResult;
  metabolicBias: number; // 0–100 from debate slider
}

export function calcOverlapZone({ profile, lab, metabolicBias }: OverlapZoneInput): OverlapZoneResult {
  const {
    ldlC = 130,
    hdlC = 50,
    triglycerides = 150,
    apoB,
    lpa,
    fastingInsulin,
    homaIr,
  } = lab;

  // Derived values
  const tgHdlRatio = hdlC > 0 ? triglycerides / hdlC : 4;
  const computedHomaIr = homaIr ?? (fastingInsulin && lab.fastingGlucose
    ? (fastingInsulin * lab.fastingGlucose) / 405
    : undefined);
  const ascvdRisk = calcASCVD10yr(profile, ldlC, hdlC);

  // Bias factor: shifts weight from cardiovascular to metabolic camp
  // metabolicBias 0 = pure CV, 100 = pure metabolic
  const cvBias = 1 - metabolicBias / 100;
  const metaBias = metabolicBias / 100;

  // --- Component scores (each 0–100, higher = more statin benefit) ---

  // 1. ASCVD 10-yr risk (CV camp, weight 0.25)
  const ascvdScore = Math.min(ascvdRisk * 3.33, 100); // 30% risk → score 100

  // 2. LDL-C absolute (CV camp, weight 0.20)
  // <100 = 0, 100–129 = 20, 130–159 = 50, 160–189 = 75, ≥190 = 100
  const ldlScore =
    ldlC < 100 ? 0 :
    ldlC < 130 ? 20 :
    ldlC < 160 ? 50 :
    ldlC < 190 ? 75 : 100;

  // 3. ApoB (CV camp, weight 0.15 — replaces LDL weight if available)
  const apoBScore = apoB
    ? apoB < 80 ? 0 : apoB < 100 ? 40 : apoB < 120 ? 70 : 100
    : ldlScore; // fall back to LDL-C score if ApoB not available

  // 4. TG/HDL ratio (metabolic camp, weight 0.15)
  // <1.5 = 10, 1.5–2.9 = 30, 3.0–4.9 = 60, ≥5 = 90
  const tgHdlScore =
    tgHdlRatio < 1.5 ? 10 :
    tgHdlRatio < 3.0 ? 30 :
    tgHdlRatio < 5.0 ? 60 : 90;

  // 5. Lp(a) (fixed floor, weight 0.10)
  const lpaScore = lpa ? (lpa >= 50 ? 80 : lpa >= 30 ? 40 : 10) : 10;

  // 6. HOMA-IR (metabolic camp, weight 0.10)
  const homaScore = computedHomaIr
    ? computedHomaIr < 1.0 ? 0 : computedHomaIr < 2.0 ? 25 : computedHomaIr < 3.5 ? 55 : 85
    : 20; // neutral default

  // 7. Lifestyle headroom (weight 0.05) — proxy: high TG + overweight = more room
  const lifestyleScore = tgHdlRatio > 3 ? 60 : 30;

  // Apply bias-adjusted weights (sum to 1.0)
  const w = {
    ascvd: 0.25 * cvBias * 2,          // CV camp
    ldl: (apoB ? 0 : 0.20) * cvBias * 2,
    apoB: (apoB ? 0.20 : 0) * cvBias * 2,
    tgHdl: 0.15 * metaBias * 2,        // metabolic camp
    lpa: 0.10,                          // fixed (Lp(a) is not lifestyle-modifiable)
    homa: 0.10 * metaBias * 2,
    lifestyle: 0.05,
  };

  // Normalize weights to sum to 1
  const wTotal = w.ascvd + w.ldl + w.apoB + w.tgHdl + w.lpa + w.homa + w.lifestyle;
  const normalize = (x: number) => x / wTotal;

  const score = Math.min(100, Math.max(0,
    normalize(w.ascvd) * ascvdScore +
    normalize(w.ldl) * ldlScore +
    normalize(w.apoB) * apoBScore +
    normalize(w.tgHdl) * tgHdlScore +
    normalize(w.lpa) * lpaScore +
    normalize(w.homa) * homaScore +
    normalize(w.lifestyle) * lifestyleScore
  ));

  const position = score < 36 ? 'green' : score < 66 ? 'yellow' : 'red';

  const recommendation =
    position === 'green'
      ? 'Lifestyle changes alone may be sufficient for your current risk profile. Focus on diet, exercise, and metabolic health.'
      : position === 'yellow'
      ? 'You\'re in the gray zone — both approaches have merit. Discuss with your provider whether a trial of lifestyle changes makes sense before medication.'
      : 'The evidence leans toward medication benefit for your risk level. A statin conversation with your provider is warranted.';

  return {
    score,
    position,
    ascvdRisk10yr: parseFloat(ascvdRisk.toFixed(1)),
    tgHdlRatio: parseFloat(tgHdlRatio.toFixed(2)),
    homaIr: computedHomaIr ? parseFloat(computedHomaIr.toFixed(2)) : undefined,
    recommendation,
    factors: [
      { label: '10-yr ASCVD Risk', contribution: normalize(w.ascvd), value: `${ascvdRisk.toFixed(1)}%` },
      { label: 'LDL-C', contribution: normalize(w.ldl + w.apoB), value: apoB ? `ApoB ${apoB} mg/dL` : `${ldlC} mg/dL` },
      { label: 'TG/HDL Ratio', contribution: normalize(w.tgHdl), value: tgHdlRatio.toFixed(2) },
      { label: 'Lp(a)', contribution: normalize(w.lpa), value: lpa ? `${lpa} mg/dL` : 'Not logged' },
      { label: 'Insulin Resistance', contribution: normalize(w.homa), value: computedHomaIr ? `HOMA-IR ${computedHomaIr.toFixed(2)}` : 'Not logged' },
    ],
  };
}

/**
 * Projects how lifestyle changes affect the Overlap Zone score.
 * Called by the Simulator tab in real time.
 */
export function simulateScenario(
  base: OverlapZoneResult,
  weightLossDelta: number,  // lbs
  tgReductionPct: number,   // 0–50
  ldlTargetMgDl: number,
  profile: UserProfile,
  lab: LabResult,
  metabolicBias: number,
): OverlapZoneResult {
  // Approximate effects of weight loss on lipids (literature-based)
  const lbsToKg = weightLossDelta * 0.453592;
  const tgDropFromWeight = lbsToKg * 1.5;    // ~1.5 mg/dL per kg lost
  const ldlDropFromWeight = lbsToKg * 0.5;   // ~0.5 mg/dL per kg lost
  const hdlGainFromWeight = lbsToKg * 0.35;  // ~0.35 mg/dL per kg lost

  const newTG = Math.max(
    (lab.triglycerides ?? 150) * (1 - tgReductionPct / 100) - tgDropFromWeight,
    50
  );
  const newLDL = Math.min(
    Math.max((lab.ldlC ?? 130) - ldlDropFromWeight, ldlTargetMgDl),
    ldlTargetMgDl
  );
  const newHDL = (lab.hdlC ?? 50) + hdlGainFromWeight;

  const projectedLab: LabResult = {
    ...lab,
    triglycerides: parseFloat(newTG.toFixed(0)),
    ldlC: parseFloat(newLDL.toFixed(0)),
    hdlC: parseFloat(newHDL.toFixed(0)),
  };

  return calcOverlapZone({ profile, lab: projectedLab, metabolicBias });
}
