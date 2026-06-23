import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/shared/Card';
import { NextStepNavigator } from '../../src/components/shared/NextStepNavigator';
import { OverlapZoneBar } from '../../src/components/shared/OverlapZoneBar';
import { COLORS, SIDE_EFFECT_DATA, SPACING, TYPOGRAPHY } from '../../src/constants';
import { useAppStore } from '../../src/store';

// Debate evidence — both camps
const CV_EVIDENCE = [
  {
    claim: 'Each 40 mg/dL reduction in LDL-C cuts major cardiovascular events by ~22%',
    source: 'Cholesterol Treatment Trialists (CTT) meta-analysis, Lancet 2010',
    strength: 'Very Strong',
  },
  {
    claim: 'ApoB is a superior predictor of cardiovascular risk vs. LDL-C alone — it counts all atherogenic particles',
    source: 'Sniderman et al., JAMA Cardiology 2019',
    strength: 'Strong',
  },
  {
    claim: 'Statins reduce cardiovascular events even in low-risk individuals over long follow-up',
    source: 'JUPITER Trial (rosuvastatin), NEJM 2008',
    strength: 'Strong',
  },
  {
    claim: 'Lp(a) is an independent, genetically-determined risk factor not addressed by diet',
    source: 'Kamstrup et al., JAMA 2009',
    strength: 'Strong',
  },
  {
    claim: 'Familial hypercholesterolemia (LDL>190) carries lifetime event risk >50% without treatment',
    source: 'Nordestgaard et al., EHJ 2013',
    strength: 'Strong',
  },
];

const METABOLIC_EVIDENCE = [
  {
    claim: 'TG/HDL ratio ≥3.0 is a strong proxy for insulin resistance and predicts CVD risk independently of LDL-C',
    source: 'McLaughlin et al., Am J Cardiol 2005',
    strength: 'Strong',
  },
  {
    claim: 'Elevated fasting insulin precedes LDL elevation by years — addressing IR may prevent dyslipidemia',
    source: 'Reaven GM, Diabetes 1988 (Syndrome X)',
    strength: 'Moderate',
  },
  {
    claim: 'Low-carbohydrate diets reduce TG 40–50% and raise HDL more than low-fat diets in RCTs',
    source: 'Volek et al., Nutrition & Metabolism 2004',
    strength: 'Moderate',
  },
  {
    claim: 'Statin therapy modestly raises risk of new-onset diabetes (~10–22%), a concern in insulin-resistant patients',
    source: 'Sattar et al., Lancet 2010',
    strength: 'Moderate',
  },
  {
    claim: 'High LDL-C in the context of low TG, high HDL, and normal insulin may not carry the same risk',
    source: 'Dreon et al., Am J Clin Nutr 1998 (pattern A vs B)',
    strength: 'Emerging',
  },
];

const STRENGTH_COLORS: Record<string, string> = {
  'Very Strong': COLORS.green,
  'Strong': COLORS.primaryLight,
  'Moderate': COLORS.yellow,
  'Emerging': COLORS.gray400,
};

function EvidenceCard({ claim, source, strength, showCitation }: {
  claim: string; source: string; strength: string; showCitation: boolean;
}) {
  return (
    <View style={styles.evidenceCard}>
      <View style={[styles.strengthBadge, { backgroundColor: STRENGTH_COLORS[strength] + '20' }]}>
        <Text style={[styles.strengthText, { color: STRENGTH_COLORS[strength] }]}>{strength}</Text>
      </View>
      <Text style={styles.claimText}>{claim}</Text>
      {showCitation && <Text style={styles.sourceText}>{source}</Text>}
    </View>
  );
}

type SideEffectKey = keyof typeof SIDE_EFFECT_DATA;

function SideEffectNavigator({ onClose }: { onClose: () => void }) {
  const { latestOverlapZone, profile } = useAppStore();
  const [selected, setSelected] = useState<SideEffectKey | null>(null);
  const [step, setStep] = useState<'pick' | 'info' | 'protocol'>('pick');

  const concerns: { key: SideEffectKey; emoji: string }[] = [
    { key: 'muscle_pain', emoji: '💪' },
    { key: 'cognitive', emoji: '🧠' },
    { key: 'blood_sugar', emoji: '🩸' },
    { key: 'liver', emoji: '🫁' },
  ];

  const data = selected ? SIDE_EFFECT_DATA[selected] : null;

  // Personalize incidence slightly based on profile risk factors
  const personalizedIncidence = data ? (
    selected === 'blood_sugar' && profile?.hasDiabetes ? data.incidenceBase * 1.5 :
    selected === 'muscle_pain' && profile?.age && profile.age > 65 ? data.incidenceBase * 1.3 :
    data.incidenceBase
  ) : 0;

  return (
    <View style={styles.sideEffectPanel}>
      <View style={styles.sideEffectHeader}>
        <Text style={[TYPOGRAPHY.heading3]}>Side-Effect Navigator</Text>
        <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 22, color: COLORS.gray400 }}>✕</Text></TouchableOpacity>
      </View>

      {step === 'pick' && (
        <>
          <Text style={[TYPOGRAPHY.body, { marginBottom: SPACING.md }]}>
            What concerns you most about statins?
          </Text>
          {concerns.map(c => {
            const d = SIDE_EFFECT_DATA[c.key];
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.concernCard, selected === c.key && styles.concernCardSelected]}
                onPress={() => { setSelected(c.key); setStep('info'); }}
              >
                <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
                <Text style={[TYPOGRAPHY.body, { flex: 1 }]}>{d.label}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.concernCard]}
            onPress={onClose}
          >
            <Text style={{ fontSize: 24 }}>✓</Text>
            <Text style={[TYPOGRAPHY.body, { flex: 1 }]}>No concerns — I just want the facts</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 'info' && data && (
        <>
          <TouchableOpacity onPress={() => setStep('pick')} style={{ marginBottom: SPACING.sm }}>
            <Text style={{ color: COLORS.primary }}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.sm }]}>{data.label}</Text>

          <View style={styles.incidenceBox}>
            <Text style={styles.incidencePct}>{personalizedIncidence}%</Text>
            <Text style={styles.incidenceLabel}>
              Real-world incidence for someone with your profile{'\n'}
              <Text style={{ fontStyle: 'italic', fontSize: 11 }}>(from published clinical trial data)</Text>
            </Text>
          </View>

          <Text style={[TYPOGRAPHY.label, { marginTop: SPACING.md, marginBottom: SPACING.xs }]}>How we'd monitor it</Text>
          {data.monitoringSteps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={{ color: COLORS.white, fontSize: 11, fontWeight: '700' }}>{i + 1}</Text></View>
              <Text style={[TYPOGRAPHY.body, { flex: 1 }]}>{s}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.rechallengeBtn} onPress={() => setStep('protocol')}>
            <Text style={styles.rechallengeBtnText}>View Rechallenge Protocol →</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 'protocol' && data && (
        <>
          <TouchableOpacity onPress={() => setStep('info')} style={{ marginBottom: SPACING.sm }}>
            <Text style={{ color: COLORS.primary }}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.xs }]}>Statin Rechallenge Protocol</Text>
          <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.gray600, marginBottom: SPACING.md }]}>
            For {data.label.toLowerCase()}. Based on published clinical literature — discuss with your provider.
          </Text>

          {data.rechallengeProtocol.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: COLORS.yellow }]}>
                <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <Text style={[TYPOGRAPHY.body, { flex: 1 }]}>{s}</Text>
            </View>
          ))}

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              ⚕️  This protocol is for informational purposes only. Always work with your prescribing physician before stopping, starting, or modifying statin therapy.
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

export default function DebateScreen() {
  const { latestOverlapZone, metabolicBias, setMetabolicBias, profile } = useAppStore();
  const [showCitations, setShowCitations] = useState(false);
  const [showSideEffects, setShowSideEffects] = useState(false);
  const [showNextStep, setShowNextStep] = useState(false);

  const { labs } = useAppStore();
  const lpaValue = labs[0]?.lpa;

  const cvBias = 100 - metabolicBias;

  // Dynamic tug-of-war bar position
  const tugPct = cvBias; // 0 = full metabolic, 100 = full CV

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={TYPOGRAPHY.heading1}>Debate Mode</Text>
        <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.gray600, marginBottom: SPACING.lg }]}>
          Both camps, side by side. Adjust your weighting to see how the recommendation shifts.
        </Text>

        {/* Tug of War bar */}
        <Card>
          <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.md, textAlign: 'center' }]}>
            Tug of War
          </Text>

          <View style={styles.tugRow}>
            <Text style={[styles.tugLabel, { color: COLORS.primary }]}>LDL{'\n'}Camp</Text>
            <View style={styles.tugTrack}>
              <View style={[styles.tugFillLeft, { width: `${cvBias}%` }]} />
              <View style={[styles.tugFillRight, { width: `${metabolicBias}%` }]} />
              <View style={[styles.tugKnot, { left: `${cvBias}%`, marginLeft: -12 }]} />
            </View>
            <Text style={[styles.tugLabel, { color: COLORS.yellow, textAlign: 'right' }]}>Metabolic{'\n'}Camp</Text>
          </View>

          <Text style={[TYPOGRAPHY.label, { textAlign: 'center', marginTop: SPACING.md, marginBottom: SPACING.sm }]}>
            What matters most to me right now?
          </Text>

          {/* Bias slider */}
          <View style={styles.biasSlider}>
            <TouchableOpacity onPress={() => setMetabolicBias(Math.max(0, metabolicBias - 10))} style={styles.biasBtn}>
              <Text style={[styles.biasBtnText, { color: COLORS.primary }]}>←</Text>
            </TouchableOpacity>
            <View style={styles.biasTrack}>
              <View style={[styles.biasFill, { width: `${metabolicBias}%` }]} />
              <View style={[styles.biasThumb, { left: `${metabolicBias}%`, marginLeft: -10 }]} />
            </View>
            <TouchableOpacity onPress={() => setMetabolicBias(Math.min(100, metabolicBias + 10))} style={styles.biasBtn}>
              <Text style={[styles.biasBtnText, { color: COLORS.yellow }]}>→</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.biasLabels}>
            <Text style={[styles.biasLabel, { color: COLORS.primary }]}>Cardiovascular{'\n'}Prevention</Text>
            <Text style={[styles.biasLabel, { color: COLORS.yellow, textAlign: 'right' }]}>Metabolic{'\n'}Health</Text>
          </View>

          {latestOverlapZone && (
            <View style={{ marginTop: SPACING.md }}>
              <OverlapZoneBar
                score={latestOverlapZone.score}
                position={latestOverlapZone.position}
                label="Recommendation strength at current weighting"
              />
            </View>
          )}
        </Card>

        {/* Split-screen evidence */}
        <View style={styles.splitScreen}>
          {/* LDL Camp */}
          <View style={styles.splitCol}>
            <View style={[styles.campHeader, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.campHeaderText}>LDL Camp</Text>
              <Text style={styles.campHeaderSub}>Cardiovascular risk focus</Text>
            </View>
            {CV_EVIDENCE.map((e, i) => (
              <EvidenceCard key={i} {...e} showCitation={showCitations} />
            ))}
          </View>

          {/* Metabolic Camp */}
          <View style={styles.splitCol}>
            <View style={[styles.campHeader, { backgroundColor: COLORS.yellow }]}>
              <Text style={styles.campHeaderText}>Metabolic Camp</Text>
              <Text style={styles.campHeaderSub}>Insulin & TG focus</Text>
            </View>
            {METABOLIC_EVIDENCE.map((e, i) => (
              <EvidenceCard key={i} {...e} showCitation={showCitations} />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.citationToggle}
          onPress={() => setShowCitations(v => !v)}
        >
          <Text style={styles.citationToggleText}>
            {showCitations ? '📖 Hide Citations' : '📖 Show Study Citations'}
          </Text>
        </TouchableOpacity>

        {/* Gray Zone: Next Step / Tie-Breaker */}
        {latestOverlapZone?.position === 'yellow' && (
          !showNextStep ? (
            <TouchableOpacity style={styles.nextStepCTA} onPress={() => setShowNextStep(true)}>
              <View style={styles.nextStepBadge}><Text style={styles.nextStepBadgeText}>Gray Zone</Text></View>
              <Text style={styles.nextStepTitle}>🎯 Do you need a scan?</Text>
              <Text style={styles.nextStepDesc}>
                You're in the 20% where a tie-breaker test could resolve the statin decision.
                Answer 4 quick questions to find out whether a CAC scan or CCTA is right for you — and get the exact questions to ask your doctor.
              </Text>
              <Text style={styles.nextStepLink}>Open Next Step Navigator →</Text>
            </TouchableOpacity>
          ) : (
            <Card padded>
              {profile && (
                <NextStepNavigator
                  profile={profile}
                  lpaValue={lpaValue}
                  onClose={() => setShowNextStep(false)}
                />
              )}
            </Card>
          )
        )}

        {/* Side Effect Navigator CTA */}
        {!showSideEffects ? (
          <TouchableOpacity style={styles.sideEffectCTA} onPress={() => setShowSideEffects(true)}>
            <Text style={styles.sideEffectCTATitle}>Concerned about statin side effects?</Text>
            <Text style={styles.sideEffectCTADesc}>
              Get personalized incidence numbers and a rechallenge protocol — tap to open the Side-Effect Navigator
            </Text>
          </TouchableOpacity>
        ) : (
          <Card padded>
            <SideEffectNavigator onClose={() => setShowSideEffects(false)} />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  tugRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  tugLabel: { fontSize: 12, fontWeight: '700', width: 52, textAlign: 'center' },
  tugTrack: { flex: 1, height: 16, borderRadius: 8, flexDirection: 'row', overflow: 'hidden', position: 'relative', backgroundColor: COLORS.gray200 },
  tugFillLeft: { height: '100%', backgroundColor: COLORS.primary + '80' },
  tugFillRight: { height: '100%', backgroundColor: COLORS.yellow + '80' },
  tugKnot: {
    position: 'absolute', width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.white, top: -4,
    borderWidth: 2, borderColor: COLORS.gray400,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  biasSlider: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  biasBtn: { padding: SPACING.sm },
  biasBtnText: { fontSize: 20, fontWeight: '700' },
  biasTrack: { flex: 1, height: 8, backgroundColor: COLORS.gray200, borderRadius: 4, position: 'relative', justifyContent: 'center' },
  biasFill: { height: '100%', backgroundColor: COLORS.yellow + '80', borderRadius: 4 },
  biasThumb: {
    position: 'absolute', width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.primary, borderWidth: 3, borderColor: COLORS.white,
    top: -6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  biasLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs },
  biasLabel: { fontSize: 11, fontWeight: '600' },
  splitScreen: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  splitCol: { flex: 1 },
  campHeader: { borderRadius: 10, padding: SPACING.sm, marginBottom: SPACING.sm, alignItems: 'center' },
  campHeaderText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  campHeaderSub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 },
  evidenceCard: {
    backgroundColor: COLORS.white, borderRadius: 10, padding: SPACING.sm,
    marginBottom: SPACING.xs, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  strengthBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 6 },
  strengthText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  claimText: { fontSize: 12, color: COLORS.gray800, lineHeight: 16 },
  sourceText: { fontSize: 10, color: COLORS.gray400, marginTop: 4, fontStyle: 'italic', lineHeight: 14 },
  citationToggle: {
    alignItems: 'center', paddingVertical: SPACING.sm, marginBottom: SPACING.md,
  },
  citationToggleText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  nextStepCTA: {
    backgroundColor: '#EBF4FF', borderRadius: 14, padding: SPACING.md,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary, marginBottom: SPACING.md,
  },
  nextStepBadge: {
    backgroundColor: COLORS.yellow, borderRadius: 20, paddingHorizontal: SPACING.sm,
    paddingVertical: 3, alignSelf: 'flex-start', marginBottom: SPACING.xs,
  },
  nextStepBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  nextStepTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginBottom: SPACING.xs },
  nextStepDesc: { fontSize: 13, color: '#1e3a5f', lineHeight: 18, marginBottom: SPACING.sm },
  nextStepLink: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  sideEffectCTA: {
    backgroundColor: '#FFF3E0', borderRadius: 14, padding: SPACING.md,
    borderLeftWidth: 4, borderLeftColor: COLORS.yellow, marginBottom: SPACING.xl,
  },
  sideEffectCTATitle: { fontSize: 15, fontWeight: '700', color: '#856404', marginBottom: SPACING.xs },
  sideEffectCTADesc: { fontSize: 13, color: '#664d03', lineHeight: 18 },
  sideEffectPanel: { width: '100%' },
  sideEffectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  incidenceBox: {
    backgroundColor: COLORS.primary + '15', borderRadius: 12, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md,
  },
  incidencePct: { fontSize: 36, fontWeight: '800', color: COLORS.primary },
  incidenceLabel: { flex: 1, fontSize: 13, color: COLORS.gray800, lineHeight: 18 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  stepNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
  },
  rechallengeBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: SPACING.md,
    alignItems: 'center', marginTop: SPACING.md,
  },
  rechallengeBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  disclaimerBox: {
    backgroundColor: COLORS.gray100, borderRadius: 10, padding: SPACING.md, marginTop: SPACING.md,
  },
  disclaimerText: { fontSize: 12, color: COLORS.gray600, lineHeight: 18 },
  concernCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.gray100, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.sm,
  },
  concernCardSelected: { backgroundColor: '#EBF4FF', borderWidth: 1.5, borderColor: COLORS.primary },
  chevron: { fontSize: 22, color: COLORS.gray400 },
});
