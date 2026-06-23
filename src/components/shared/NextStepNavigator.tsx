import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { UserProfile } from '../../types';

// ── Types ────────────────────────────────────────────────────────────────────

type ScanRecommendation = 'cac' | 'ccta' | 'either' | 'neither' | 'cac_score_tree';

interface ScanResult {
  recommendation: ScanRecommendation;
  headline: string;
  rationale: string;
  pros: string[];
  cons: string[];
  questions: string[];
}

interface CACBand {
  range: string;
  label: string;
  color: string;
  bgColor: string;
  riskLevel: string;
  statin: string;
  lifestyle: string;
  followUp: string;
  details: string;
}

// ── CAC Score Decision Tree Data ─────────────────────────────────────────────

const CAC_BANDS: CACBand[] = [
  {
    range: '0',
    label: 'CAC = 0',
    color: COLORS.green,
    bgColor: COLORS.greenLight,
    riskLevel: 'Very Low',
    statin: 'Statin likely not beneficial for primary prevention at this time. Consider a "statin vacation" or deferral.',
    lifestyle: 'Focus on diet, exercise, and metabolic health. Risk of a cardiovascular event in next 10 years is very low with CAC = 0, even with elevated LDL-C.',
    followUp: 'Recheck CAC in 5–7 years if risk factors persist.',
    details: 'A CAC score of 0 provides strong "negative risk reclassification." Multiple studies (MESA, CONFIRM) show that CAC = 0 carries an annual event rate of <1% even in intermediate-risk patients. This is the strongest argument for lifestyle-first in gray zone patients.',
  },
  {
    range: '1-99',
    label: 'CAC 1–99',
    color: COLORS.yellow,
    bgColor: COLORS.yellowLight,
    riskLevel: 'Low to Moderate',
    statin: 'Statin reasonable, especially toward the higher end (CAC 50–99) or with other risk factors (Lp(a), family history). Lowest effective dose.',
    lifestyle: 'Aggressive lifestyle modification is strongly warranted. Weight loss, low-carb or Mediterranean diet, exercise. Re-test lipids in 3 months.',
    followUp: 'Recheck CAC in 3–5 years. Consider monitoring ApoB response to lifestyle changes.',
    details: 'Low but non-zero plaque burden. The presence of any calcium confirms atherosclerosis has begun. Guidelines suggest considering a statin for CAC 1–99, but shared decision-making is appropriate — especially for younger patients with reversible risk factors.',
  },
  {
    range: '100-299',
    label: 'CAC 100–299',
    color: '#E67E22',
    bgColor: '#FEF3E2',
    riskLevel: 'Moderate to High',
    statin: 'Statin therapy is generally recommended at this level per ACC/AHA guidelines. A moderate-intensity statin (e.g., atorvastatin 10–20 mg, rosuvastatin 5–10 mg) is a reasonable starting point.',
    lifestyle: 'Lifestyle optimization is still important and can slow plaque progression. Low-carb or Mediterranean diet, exercise 150+ min/week, sleep optimization.',
    followUp: 'Follow-up lipid panel in 6–12 weeks after starting therapy. Consider CCTA if symptoms develop or CAC progression is suspected.',
    details: 'Established atherosclerotic plaque burden. At this level, the statin benefit-to-risk ratio is clearly favorable for most patients. The metabolic camp would add: also address insulin resistance and TG/HDL ratio, as soft (non-calcified) plaque may still be progressing.',
  },
  {
    range: '300+',
    label: 'CAC ≥ 300',
    color: COLORS.red,
    bgColor: COLORS.redLight,
    riskLevel: 'High',
    statin: 'High-intensity statin strongly indicated (atorvastatin 40–80 mg, rosuvastatin 20–40 mg). Consider adding ezetimibe if LDL-C target not reached. PCSK9 inhibitor if Lp(a) is elevated.',
    lifestyle: 'Lifestyle changes remain important but are unlikely to be sufficient alone at this plaque burden. Continue all optimization in parallel with medication.',
    followUp: 'Consider CCTA or nuclear stress test if symptoms arise. Cardiology referral is reasonable. ApoB target <80 mg/dL.',
    details: 'Extensive calcified plaque. This level — or >75th percentile for age/sex — is a strong upward risk reclassifier. Both camps agree at this level: medication is indicated. The debate shifts to which medication and how aggressively to treat.',
  },
];

// ── Scan Result Definitions ───────────────────────────────────────────────────

function buildScanResult(
  rec: ScanRecommendation,
  age: number,
  lpaElevated: boolean,
  priorCacScore?: number,
): ScanResult {
  switch (rec) {
    case 'cac':
      return {
        recommendation: 'cac',
        headline: 'A CAC (Coronary Artery Calcium) scan appears appropriate for your profile.',
        rationale: `Based on your age (${age}), asymptomatic status, and gray-zone risk profile, ACC/AHA guidelines suggest a CAC score is a reasonable next step to reclassify your risk and inform the statin decision.`,
        pros: [
          'Low radiation (~0.9 mSv — similar to a mammogram)',
          'Fast, non-invasive, typically 10-minute scan',
          'CAC = 0 powerfully rules out need for medication in most patients',
          'CAC ≥ 100 confirms atherosclerosis and justifies medication',
          'Widely covered by insurance for intermediate-risk patients',
          'Resolves the gray-zone dilemma with objective plaque data',
        ],
        cons: [
          'Does not show soft (non-calcified) plaque — can miss early disease in younger patients',
          'CAC = 0 does not rule out ALL risk (particularly Lp(a)-driven soft plaque)',
          'Radiation exposure (though low)',
          'If elevated, creates psychological "labeling" effect in some patients',
          'Not appropriate if you already have known coronary artery disease',
        ],
        questions: [
          `At my risk level, would a CAC score change your recommendation to start a statin?`,
          `If my CAC comes back 0, can we defer the statin discussion for 5 years?`,
          `If my CAC is ≥ 100, what intensity of statin would you recommend?`,
          lpaElevated ? `Given my elevated Lp(a), does a CAC = 0 still provide the same reassurance?` : '',
          `Should I fast or do anything to prepare for the scan?`,
          `Which imaging center do you recommend, and is it covered by my insurance?`,
        ].filter(Boolean),
      };

    case 'ccta':
      return {
        recommendation: 'ccta',
        headline: 'A CCTA (Coronary CT Angiography) may be more informative than CAC for your profile.',
        rationale: `Given your age${lpaElevated ? ', elevated Lp(a),' : ''} and risk profile, a CCTA can visualize both calcified AND soft (non-calcified) plaque — providing a more complete picture of coronary artery disease.${priorCacScore && priorCacScore >= 100 ? ` Your prior CAC score of ${priorCacScore} also makes CCTA a logical progression to characterize which vessels are affected.` : ''}`,
        pros: [
          'Shows both calcified and soft (non-calcified) plaque — more complete than CAC',
          'Identifies which specific vessels are affected and stenosis severity',
          'Can detect high-risk plaque features (positive remodeling, low attenuation)',
          'Particularly valuable when Lp(a) is elevated (promotes soft plaque)',
          'Can guide targeted intervention (e.g., which vessels to monitor)',
          'Increasingly covered by insurance for higher-risk patients',
        ],
        cons: [
          'Higher radiation than CAC (~3–5 mSv)',
          'Requires contrast dye injection (kidney function check needed)',
          'More expensive than CAC scan',
          'May detect incidental findings that require further workup',
          'Less widely available than CAC; need experienced reader',
          'Results are more complex to interpret',
        ],
        questions: [
          `Given my risk profile, do you think a CCTA would give us information that a CAC scan would miss?`,
          lpaElevated ? `My Lp(a) is elevated — does that change whether you'd prefer CCTA over CAC?` : '',
          `Are there any concerns with contrast dye given my kidney function?`,
          priorCacScore && priorCacScore >= 100 ? `My prior CAC was ${priorCacScore} — would CCTA help us see which vessels are most affected?` : '',
          `Is this covered by my insurance, and do you have a center with experienced cardiac radiologists?`,
          `If CCTA shows soft plaque, how does that change the treatment approach?`,
        ].filter(Boolean),
      };

    case 'either':
      return {
        recommendation: 'either',
        headline: 'Either a CAC scan or CCTA could be appropriate — your profile supports both.',
        rationale: 'You have characteristics that would support either test. CAC is simpler and lower cost; CCTA provides more complete information about plaque type and vessel involvement.',
        pros: [
          'CAC: Simpler, cheaper, lower radiation, widely available',
          'CCTA: More complete picture, shows soft plaque, vessel-level detail',
          'Both provide objective plaque data to resolve your gray-zone risk',
        ],
        cons: [
          'CAC misses soft plaque (relevant if Lp(a) is elevated)',
          'CCTA is more expensive and involves contrast dye',
          'Both involve some radiation exposure',
        ],
        questions: [
          'Given my specific risk factors, which scan do you think would be more actionable?',
          'If I start with CAC and it\'s 0, would we still consider CCTA given my other risk factors?',
          'What would need to be true on the CAC result for you to recommend CCTA next?',
        ],
      };

    case 'neither':
    default:
      return {
        recommendation: 'neither',
        headline: 'A scan may not add much for your profile right now.',
        rationale: 'Based on your answers, a cardiac imaging scan may not significantly change your management at this time. Focusing on lifestyle changes and re-testing lipids in 3 months is a reasonable first step.',
        pros: [
          'Avoids radiation and cost of imaging',
          'A 3-month lifestyle trial may move your risk profile enough to resolve the gray zone',
          'Repeat labs after lifestyle changes will give cleaner data',
        ],
        cons: [
          'The gray-zone uncertainty remains without objective plaque data',
          'If lifestyle trial doesn\'t improve numbers, the scan question returns',
        ],
        questions: [
          'What specific improvement in my labs would move you toward or away from recommending a statin?',
          'After my 3-month lifestyle trial, should we revisit the scan question?',
          'Are there any symptoms I should watch for that would change this approach?',
        ],
      };
  }
}

// ── Decision Logic ────────────────────────────────────────────────────────────

function decideScan(
  age: number,
  asymptomatic: boolean,
  insuranceOk: boolean,
  lpaElevated: boolean,
  hasPriorCac: boolean,
  priorCacScore: number,
  wantVesselDetail: boolean,
  suspectSoftPlaque: boolean,
): ScanRecommendation {
  if (hasPriorCac && priorCacScore >= 100) return 'ccta'; // already have CAC, upgrade to CCTA
  if (!asymptomatic) return 'neither'; // symptomatic → cardiology referral, not self-directed scan
  if (lpaElevated || suspectSoftPlaque) return 'ccta'; // Lp(a) promotes soft plaque, CCTA better
  if (wantVesselDetail) return 'ccta';
  if (age >= 40 && age <= 70 && insuranceOk) return 'cac';
  if (age > 70 && (lpaElevated || wantVesselDetail)) return 'ccta';
  if (age > 70) return 'either';
  if (!insuranceOk && age >= 40 && age <= 70) return 'cac'; // CAC is cheap enough out-of-pocket
  return 'neither';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CACBandCard({ band }: { band: CACBand }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.cacBand, { borderLeftColor: band.color, backgroundColor: band.bgColor }]}
      onPress={() => setExpanded(v => !v)}
      activeOpacity={0.8}
    >
      <View style={styles.cacBandHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cacBandLabel, { color: band.color }]}>{band.label}</Text>
          <Text style={styles.cacBandRisk}>{band.riskLevel} Risk</Text>
        </View>
        <Text style={{ color: COLORS.gray400, fontSize: 18 }}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {expanded && (
        <View style={styles.cacBandBody}>
          <Text style={styles.cacSectionLabel}>Statin Guidance</Text>
          <Text style={styles.cacBodyText}>{band.statin}</Text>

          <Text style={[styles.cacSectionLabel, { marginTop: SPACING.sm }]}>🥗 Lifestyle</Text>
          <Text style={styles.cacBodyText}>{band.lifestyle}</Text>

          <Text style={[styles.cacSectionLabel, { marginTop: SPACING.sm }]}>📅 Follow-Up</Text>
          <Text style={styles.cacBodyText}>{band.followUp}</Text>

          <View style={styles.cacDetailBox}>
            <Text style={styles.cacDetailText}>{band.details}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ScanResultCard({ result }: { result: ScanResult }) {
  const [showQuestions, setShowQuestions] = useState(false);
  const iconMap: Record<ScanRecommendation, string> = {
    cac: '🧫', ccta: '🔭', either: '⚡', neither: '🌿', cac_score_tree: '📉',
  };
  return (
    <View style={styles.scanResult}>
      <View style={styles.scanResultHeader}>
        <Text style={{ fontSize: 32 }}>{iconMap[result.recommendation]}</Text>
        <Text style={[styles.scanHeadline]}>{result.headline}</Text>
      </View>

      <Text style={styles.scanRationale}>{result.rationale}</Text>

      <Text style={styles.listHeader}>✓ Pros</Text>
      {result.pros.map((p, i) => (
        <View key={i} style={styles.listRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>{p}</Text>
        </View>
      ))}

      <Text style={[styles.listHeader, { color: COLORS.red }]}>! Cons to consider</Text>
      {result.cons.map((c, i) => (
        <View key={i} style={styles.listRow}>
          <Text style={[styles.bullet, { color: COLORS.red }]}>•</Text>
          <Text style={styles.listText}>{c}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.questionsToggle}
        onPress={() => setShowQuestions(v => !v)}
      >
        <Text style={styles.questionsToggleText}>
          {showQuestions ? '▲ Hide' : '▼ Show'} Questions to ask your doctor
        </Text>
      </TouchableOpacity>

      {showQuestions && (
        <View style={styles.questionsList}>
          {result.questions.map((q, i) => (
            <View key={i} style={styles.questionRow}>
              <Text style={styles.questionNum}>{i + 1}</Text>
              <Text style={styles.questionText}>{q}</Text>
            </View>
          ))}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              Based on your numbers, guidelines suggest that a{' '}
              {result.recommendation === 'cac' ? 'CAC scan' : result.recommendation === 'ccta' ? 'CCTA' : 'cardiac imaging scan'}{' '}
              may help clarify your decision. These questions are provided to facilitate a conversation
              with your provider — not to replace one.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  profile: UserProfile;
  lpaValue?: number;
  onClose: () => void;
}

type Step =
  | 'intro'
  | 'ask_cac_known'
  | 'enter_cac'
  | 'cac_tree'
  | 'ask_age_check'
  | 'ask_asymptomatic'
  | 'ask_insurance'
  | 'ask_softplaque'
  | 'ask_vessel'
  | 'result';

export function NextStepNavigator({ profile, lpaValue, onClose }: Props) {
  const [step, setStep] = useState<Step>('intro');
  const [hasPriorCac, setHasPriorCac] = useState(false);
  const [priorCacScore, setPriorCacScore] = useState(0);
  const [asymptomatic, setAsymptomatic] = useState(true);
  const [insuranceOk, setInsuranceOk] = useState(true);
  const [suspectSoftPlaque, setSuspectSoftPlaque] = useState(false);
  const [wantVesselDetail, setWantVesselDetail] = useState(false);
  const [showCacTree, setShowCacTree] = useState(false);

  const age = profile.age;
  const lpaElevated = (lpaValue ?? 0) >= 50;

  const scanRecommendation = decideScan(
    age, asymptomatic, insuranceOk, lpaElevated, hasPriorCac, priorCacScore, wantVesselDetail, suspectSoftPlaque
  );
  const scanResult = buildScanResult(scanRecommendation, age, lpaElevated, hasPriorCac ? priorCacScore : undefined);

  const YesNo = ({ onYes, onNo }: { onYes: () => void; onNo: () => void }) => (
    <View style={styles.yesNoRow}>
      <TouchableOpacity style={[styles.choiceBtn, { borderColor: COLORS.green }]} onPress={onYes}>
        <Text style={[styles.choiceBtnText, { color: COLORS.green }]}>Yes</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.choiceBtn, { borderColor: COLORS.red }]} onPress={onNo}>
        <Text style={[styles.choiceBtnText, { color: COLORS.red }]}>No</Text>
      </TouchableOpacity>
    </View>
  );

  const StepHeader = ({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) => (
    <View style={styles.stepHeader}>
      <Text style={styles.stepEmoji}>{emoji}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.stepSubtitle}>{subtitle}</Text>}
    </View>
  );

  const BackBtn = ({ to }: { to: Step }) => (
    <TouchableOpacity onPress={() => setStep(to)} style={{ marginBottom: SPACING.md }}>
      <Text style={{ color: COLORS.primary, fontSize: 14 }}>‹ Back</Text>
    </TouchableOpacity>
  );

  // ── Step rendering ──

  if (step === 'intro') {
    return (
      <View>
        <View style={styles.header}>
          <Text style={[TYPOGRAPHY.heading3]}>Next Step: Tie-Breaker</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 22, color: COLORS.gray400 }}>✕</Text></TouchableOpacity>
        </View>

        <View style={[styles.greyZoneBadge]}>
          <Text style={styles.greyZoneText}>
            You're in the gray zone — lifestyle and medication are both defensible options.
            About 20% of patients in this zone benefit from a "tie-breaker" test to guide the decision.
          </Text>
        </View>

        <StepHeader
          emoji="🎯"
          title="Two decisions, one navigator"
          subtitle="We'll help you answer: (1) Should I take a statin? and (2) Do I need a scan?"
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('ask_cac_known')}>
          <Text style={styles.primaryBtnText}>Start the tie-breaker →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowCacTree(v => !v)}>
          <Text style={styles.secondaryBtnText}>
            {showCacTree ? '▲ Hide' : '📊 I already have a CAC score — show me what it means'}
          </Text>
        </TouchableOpacity>

        {showCacTree && (
          <View style={{ marginTop: SPACING.md }}>
            <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.md }]}>CAC Score Decision Tree</Text>
            <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.gray600, marginBottom: SPACING.md }]}>
              Tap each band to expand guidance on statins, lifestyle, and follow-up.
            </Text>
            {CAC_BANDS.map(band => (
              <CACBandCard key={band.range} band={band} />
            ))}
          </View>
        )}
      </View>
    );
  }

  if (step === 'ask_cac_known') {
    return (
      <View>
        <BackBtn to="intro" />
        <StepHeader
          emoji="📊"
          title="Do you already have a CAC score?"
          subtitle="A prior coronary calcium scan from the last 5 years"
        />
        <YesNo
          onYes={() => { setHasPriorCac(true); setStep('enter_cac'); }}
          onNo={() => { setHasPriorCac(false); setStep('ask_age_check'); }}
        />
      </View>
    );
  }

  if (step === 'enter_cac') {
    const SCORES = [
      { label: 'CAC = 0', value: 0 },
      { label: 'CAC 1–99', value: 50 },
      { label: 'CAC 100–299', value: 150 },
      { label: 'CAC ≥ 300', value: 300 },
    ];
    return (
      <View>
        <BackBtn to="ask_cac_known" />
        <StepHeader
          emoji="🔢"
          title="What was your CAC score?"
          subtitle="Select the range that matches your result"
        />
        {SCORES.map(s => (
          <TouchableOpacity
            key={s.label}
            style={styles.scoreOptionBtn}
            onPress={() => { setPriorCacScore(s.value); setStep('cac_tree'); }}
          >
            <Text style={styles.scoreOptionText}>{s.label}</Text>
            <Text style={{ color: COLORS.gray400, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (step === 'cac_tree') {
    const band = CAC_BANDS.find(b => {
      if (priorCacScore === 0) return b.range === '0';
      if (priorCacScore < 100) return b.range === '1-99';
      if (priorCacScore < 300) return b.range === '100-299';
      return b.range === '300+';
    }) ?? CAC_BANDS[0];

    return (
      <View>
        <BackBtn to="enter_cac" />
        <StepHeader
          emoji="📋"
          title={`Your CAC score: ${band.label}`}
          subtitle="Here's what the evidence says about your result"
        />
        <CACBandCard band={band} />

        {/* If CAC ≥ 100, offer CCTA upgrade path */}
        {priorCacScore >= 100 && (
          <View style={[styles.upgradePath]}>
            <Text style={[TYPOGRAPHY.heading3, { color: COLORS.primary, marginBottom: SPACING.xs }]}>
              Want more detail?
            </Text>
            <Text style={TYPOGRAPHY.bodySmall}>
              With a CAC ≥ 100, a CCTA can show you which specific vessels are affected and whether
              soft (non-calcified) plaque is also present. Tap below to see if CCTA is right for you.
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: SPACING.md }]}
              onPress={() => setStep('ask_vessel')}
            >
              <Text style={styles.primaryBtnText}>Assess if CCTA is appropriate →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (step === 'ask_age_check') {
    const eligible = age >= 40 && age <= 70;
    const over70 = age > 70;
    return (
      <View>
        <BackBtn to="ask_cac_known" />
        <StepHeader
          emoji="🎂"
          title={`Age ${age} — ${eligible ? 'within the primary CAC window' : over70 ? 'above the primary CAC window' : 'below the primary CAC window'}`}
          subtitle={
            eligible
              ? 'ACC/AHA guidelines support CAC scanning for asymptomatic adults aged 40–70 in the intermediate-risk zone.'
              : over70
              ? 'For patients over 70, CCTA is often preferred as calcified plaque is near-universal, making CAC less discriminating. Soft plaque assessment matters more.'
              : 'Under 40, CAC scanning is less commonly indicated as plaque tends to be soft (non-calcified) at this age. CCTA may be more informative if a scan is warranted.'
          }
        />
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('ask_asymptomatic')}>
          <Text style={styles.primaryBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'ask_asymptomatic') {
    return (
      <View>
        <BackBtn to="ask_age_check" />
        <StepHeader
          emoji="❤️"
          title="Do you have any chest pain, shortness of breath, or cardiac symptoms?"
          subtitle="Be honest — this changes which path is appropriate"
        />
        <YesNo
          onYes={() => {
            setAsymptomatic(false);
            setStep('result');
          }}
          onNo={() => {
            setAsymptomatic(true);
            setStep('ask_insurance');
          }}
        />
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ⚕️  If you have symptoms, cardiac imaging should be ordered by a physician as a diagnostic
            test — not as a self-directed preventive scan. Please discuss with your provider promptly.
          </Text>
        </View>
      </View>
    );
  }

  if (step === 'ask_insurance') {
    return (
      <View>
        <BackBtn to="ask_asymptomatic" />
        <StepHeader
          emoji="💳"
          title="Is a CAC scan accessible to you (insurance coverage or affordable out-of-pocket)?"
          subtitle="CAC scans are typically $75–$150 out of pocket and increasingly covered by insurance for intermediate-risk patients"
        />
        <YesNo
          onYes={() => { setInsuranceOk(true); setStep('ask_softplaque'); }}
          onNo={() => { setInsuranceOk(false); setStep('ask_softplaque'); }}
        />
      </View>
    );
  }

  if (step === 'ask_softplaque') {
    return (
      <View>
        <BackBtn to="ask_insurance" />
        <StepHeader
          emoji="🫀"
          title="Do any of the following apply to you?"
          subtitle="Select all that apply — tap each to toggle"
        />

        {[
          {
            label: `Lp(a) ≥ 50 mg/dL`,
            active: lpaElevated,
            locked: true,
            note: lpaElevated
              ? `Your logged Lp(a) of ${lpaValue} mg/dL is above 50 — auto-selected`
              : 'Your Lp(a) is not elevated or not logged',
          },
          {
            label: 'Strong family history of early heart disease',
            active: profile.familyHistoryCVD,
            locked: true,
            note: profile.familyHistoryCVD ? 'Detected from your profile' : 'Not in your profile',
          },
        ].map(item => (
          <View key={item.label} style={[styles.checkRow, item.active && styles.checkRowActive]}>
            <Text style={{ fontSize: 20 }}>{item.active ? '✓' : '○'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.checkLabel, item.active && { color: COLORS.primary }]}>{item.label}</Text>
              <Text style={styles.checkNote}>{item.note}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.checkRow, suspectSoftPlaque && styles.checkRowActive]}
          onPress={() => setSuspectSoftPlaque(v => !v)}
        >
          <Text style={{ fontSize: 20 }}>{suspectSoftPlaque ? '✓' : '○'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.checkLabel, suspectSoftPlaque && { color: COLORS.primary }]}>
              Concerned about soft (non-calcified) plaque
            </Text>
            <Text style={styles.checkNote}>
              CAC only shows calcified plaque. If you or your doctor suspect soft plaque (e.g. very high TG/HDL, Lp(a)), CCTA is better.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('ask_vessel')}>
          <Text style={styles.primaryBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'ask_vessel') {
    return (
      <View>
        <BackBtn to="ask_softplaque" />
        <StepHeader
          emoji="🏥"
          title="Would knowing which specific vessels are affected change your decision?"
          subtitle="CCTA shows stenosis by vessel (LAD, RCA, LCx). CAC gives a total score only."
        />
        <YesNo
          onYes={() => { setWantVesselDetail(true); setStep('result'); }}
          onNo={() => { setWantVesselDetail(false); setStep('result'); }}
        />
      </View>
    );
  }

  if (step === 'result') {
    return (
      <View>
        <BackBtn to={hasPriorCac ? 'cac_tree' : 'ask_vessel'} />
        <ScanResultCard result={scanResult} />
      </View>
    );
  }

  return null;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  greyZoneBadge: {
    backgroundColor: COLORS.yellowLight, borderRadius: 10, padding: SPACING.md,
    borderLeftWidth: 3, borderLeftColor: COLORS.yellow, marginBottom: SPACING.md,
  },
  greyZoneText: { fontSize: 13, color: '#664d03', lineHeight: 18 },
  stepHeader: { marginBottom: SPACING.lg },
  stepEmoji: { fontSize: 36, marginBottom: SPACING.sm },
  stepTitle: { fontSize: 17, fontWeight: '700', color: COLORS.gray800, marginBottom: SPACING.xs },
  stepSubtitle: { fontSize: 13, color: COLORS.gray600, lineHeight: 18 },
  yesNoRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  choiceBtn: {
    flex: 1, borderRadius: 12, borderWidth: 2,
    paddingVertical: SPACING.md, alignItems: 'center',
  },
  choiceBtnText: { fontSize: 16, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.sm,
  },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12,
    paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.sm,
  },
  secondaryBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  infoBox: {
    backgroundColor: COLORS.redLight, borderRadius: 10, padding: SPACING.md, marginTop: SPACING.md,
  },
  infoText: { fontSize: 12, color: '#721c24', lineHeight: 18 },
  checkRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    padding: SPACING.sm, borderRadius: 10, marginBottom: SPACING.sm,
    backgroundColor: COLORS.gray100, borderWidth: 1.5, borderColor: 'transparent',
  },
  checkRowActive: { borderColor: COLORS.primary, backgroundColor: '#EBF4FF' },
  checkLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray800 },
  checkNote: { fontSize: 11, color: COLORS.gray600, marginTop: 2, lineHeight: 15 },
  scoreOptionBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.gray200,
  },
  scoreOptionText: { fontSize: 16, fontWeight: '600', color: COLORS.gray800 },
  cacBand: {
    borderLeftWidth: 4, borderRadius: 10, padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cacBandHeader: { flexDirection: 'row', alignItems: 'center' },
  cacBandLabel: { fontSize: 16, fontWeight: '800' },
  cacBandRisk: { fontSize: 12, color: COLORS.gray600, marginTop: 2 },
  cacBandBody: { marginTop: SPACING.md },
  cacSectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray800, textTransform: 'uppercase', letterSpacing: 0.5 },
  cacBodyText: { fontSize: 13, color: COLORS.gray800, lineHeight: 18, marginTop: 4 },
  cacDetailBox: {
    backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 8,
    padding: SPACING.sm, marginTop: SPACING.sm,
  },
  cacDetailText: { fontSize: 12, color: COLORS.gray600, lineHeight: 17, fontStyle: 'italic' },
  upgradePath: {
    backgroundColor: '#EBF4FF', borderRadius: 12, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.primary, marginTop: SPACING.md,
  },
  scanResult: { gap: SPACING.sm },
  scanResultHeader: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start', marginBottom: SPACING.xs },
  scanHeadline: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.gray800, lineHeight: 20 },
  scanRationale: { fontSize: 13, color: COLORS.gray600, lineHeight: 18, marginBottom: SPACING.sm },
  listHeader: { fontSize: 13, fontWeight: '700', color: COLORS.green, marginTop: SPACING.sm, marginBottom: SPACING.xs },
  listRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: 4 },
  bullet: { color: COLORS.green, fontSize: 14, marginTop: 1 },
  listText: { flex: 1, fontSize: 13, color: COLORS.gray800, lineHeight: 18 },
  questionsToggle: {
    backgroundColor: COLORS.primary + '15', borderRadius: 10,
    padding: SPACING.sm, alignItems: 'center', marginTop: SPACING.sm,
  },
  questionsToggleText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  questionsList: { marginTop: SPACING.sm },
  questionRow: {
    flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start',
    backgroundColor: '#EBF4FF', borderRadius: 8, padding: SPACING.sm, marginBottom: SPACING.xs,
  },
  questionNum: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary,
    color: COLORS.white, fontSize: 11, fontWeight: '700',
    textAlign: 'center', lineHeight: 20, flexShrink: 0,
  },
  questionText: { flex: 1, fontSize: 13, color: COLORS.gray800, lineHeight: 18 },
  disclaimerBox: {
    backgroundColor: COLORS.gray100, borderRadius: 8, padding: SPACING.sm, marginTop: SPACING.md,
  },
  disclaimerText: { fontSize: 11, color: COLORS.gray600, lineHeight: 16 },
});
