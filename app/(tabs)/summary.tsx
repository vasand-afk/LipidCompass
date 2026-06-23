import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/shared/Card';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants';
import { useAppStore } from '../../src/store';
import { LabResult, UserProfile } from '../../src/types';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function labRow(label: string, value?: number, unit = '', ref = '') {
  if (!value) return '';
  return `<tr><td>${label}</td><td><strong>${value} ${unit}</strong></td><td style="color:#6c757d;font-size:12px">${ref}</td></tr>`;
}

function generateHTML(profile: UserProfile, labs: LabResult[], overlapScore: number, recommendation: string, ascvdRisk: number, tgHdlRatio: number): string {
  const latest = labs[0];
  const allDates = labs.map(l => l.date).join(', ');

  // Auto-generate doctor questions based on data
  const questions: string[] = [];
  if (latest?.lpa && latest.lpa >= 50) questions.push(`My Lp(a) is ${latest.lpa} mg/dL (elevated). Should I be tested for familial hypercholesterolemia or consider Lp(a)-lowering strategies?`);
  if (latest?.apoB && latest.apoB >= 100) questions.push(`My ApoB is ${latest.apoB} mg/dL. Should we target ApoB rather than LDL-C for my treatment goal?`);
  if (tgHdlRatio >= 3) questions.push(`My TG/HDL ratio is ${tgHdlRatio.toFixed(1)} (elevated). Does this suggest insulin resistance, and should we address that first?`);
  if (latest?.homaIr && latest.homaIr >= 2) questions.push(`My HOMA-IR is ${latest.homaIr.toFixed(1)}, suggesting insulin resistance. Should a low-carb or metabolic intervention trial precede or accompany any statin decision?`);
  if (latest?.triglycerides && latest.triglycerides >= 200) questions.push(`My triglycerides are ${latest.triglycerides} mg/dL. Should we rule out secondary causes (thyroid, diabetes, medications)?`);
  if (overlapScore >= 36 && overlapScore < 66) questions.push(`My risk score puts me in the "gray zone." Would a coronary artery calcium (CAC) score help clarify whether I need medication?`);
  if (profile.familyHistoryCVD) questions.push(`Given my family history of CVD, at what LDL-C or ApoB level do you recommend starting medication regardless of other risk factors?`);
  questions.push(`What is my NNT (number needed to treat) if I start a statin at my current risk level?`);
  questions.push(`Can we agree on a 3-month lifestyle trial with follow-up labs before deciding on medication?`);

  const positionLabel = overlapScore < 36 ? 'Lifestyle First (Green Zone)' : overlapScore < 66 ? 'Gray Zone (Lifestyle + Possible Medication)' : 'Medication Indicated (Red Zone)';
  const positionColor = overlapScore < 36 ? '#27AE60' : overlapScore < 66 ? '#F39C12' : '#E74C3C';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, Helvetica Neue, Arial, sans-serif; color: #343A40; font-size: 14px; margin: 0; padding: 0; }
  .page { padding: 40px; max-width: 800px; margin: 0 auto; }
  .page-break { page-break-after: always; }
  h1 { color: #0F4C75; font-size: 22px; margin-bottom: 4px; }
  h2 { color: #0F4C75; font-size: 16px; border-bottom: 2px solid #0F4C75; padding-bottom: 6px; margin-top: 24px; }
  h3 { font-size: 14px; color: #343A40; margin-bottom: 6px; }
  .subtitle { color: #6C757D; font-size: 12px; margin-bottom: 24px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th { background: #F0F4F8; text-align: left; padding: 8px 12px; font-size: 12px; color: #6C757D; text-transform: uppercase; }
  td { padding: 8px 12px; border-bottom: 1px solid #E9ECEF; }
  .disclaimer { background: #F8F9FA; border-left: 4px solid #ADB5BD; padding: 12px 16px; font-size: 12px; color: #6C757D; margin: 16px 0; border-radius: 0 8px 8px 0; }
  .question { padding: 10px 14px; background: #EBF4FF; border-radius: 8px; margin-bottom: 8px; font-size: 13px; line-height: 1.5; }
  .question::before { content: "Q  "; color: #0F4C75; font-weight: 700; }
  .zone-bar { height: 24px; border-radius: 6px; margin: 12px 0; background: linear-gradient(to right, #EAFAF1 0%, #EAFAF1 35%, #FEF9E7 35%, #FEF9E7 65%, #FDEDEC 65%, #FDEDEC 100%); position: relative; }
  .zone-dot { position: absolute; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; border-radius: 10px; background: ${positionColor}; border: 3px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.2); margin-left: -10px; left: ${overlapScore}%; }
  .narrative { line-height: 1.7; font-size: 14px; }
</style>
</head>
<body>

<!-- PAGE 1: FOR THE DOCTOR -->
<div class="page">
  <h1>LipidIQ Patient Summary</h1>
  <p class="subtitle">Generated ${fmtDate(new Date().toISOString())} · For informational purposes only · Not medical advice</p>

  <div class="disclaimer">
    This report was generated by a patient using LipidIQ, a self-directed health education app. All values were self-entered from lab results. This document is intended as a conversation aid, not a clinical record.
  </div>

  <h2>Page 1: For the Clinician</h2>

  <h3>Patient Demographics</h3>
  <table>
    <tr><td>Age</td><td><strong>${profile.age}</strong></td><td></td></tr>
    <tr><td>Biological Sex</td><td><strong>${profile.sex === 'male' ? 'Male' : 'Female'}</strong></td><td></td></tr>
    <tr><td>Smoking Status</td><td><strong>${profile.isSmoker ? 'Current smoker' : 'Non-smoker'}</strong></td><td></td></tr>
    <tr><td>Diabetes</td><td><strong>${profile.hasDiabetes ? 'Yes' : 'No'}</strong></td><td></td></tr>
    <tr><td>Systolic BP</td><td><strong>${profile.systolicBP} mmHg</strong></td><td>${profile.onBPMeds ? 'On BP medication' : ''}</td></tr>
    <tr><td>Family History CVD</td><td><strong>${profile.familyHistoryCVD ? 'Yes (1st-degree relative)' : 'None reported'}</strong></td><td></td></tr>
  </table>

  <h3>Lipid Panel History</h3>
  <p style="font-size:12px;color:#6C757D">Results logged: ${fmtDate(labs[0]?.date ?? '')}${labs.length > 1 ? ` and ${labs.length - 1} prior results` : ''}</p>
  <table>
    <thead><tr><th>Marker</th><th>Most Recent</th><th>Reference</th></tr></thead>
    <tbody>
      ${labRow('LDL-C', latest?.ldlC, 'mg/dL', 'Optimal <100')}
      ${labRow('HDL-C', latest?.hdlC, 'mg/dL', 'Optimal ≥60')}
      ${labRow('Total Cholesterol', latest?.totalChol, 'mg/dL', 'Desirable <200')}
      ${labRow('Triglycerides', latest?.triglycerides, 'mg/dL', 'Normal <150')}
      ${labRow('Non-HDL-C', latest?.nonHdlC, 'mg/dL', 'Optimal <130')}
      ${labRow('ApoB', latest?.apoB, 'mg/dL', 'Optimal <80')}
      ${labRow('Lp(a)', latest?.lpa, 'mg/dL', 'Elevated ≥50')}
      ${labRow('Fasting Glucose', latest?.fastingGlucose, 'mg/dL', 'Normal <100')}
      ${labRow('Fasting Insulin', latest?.fastingInsulin, 'µIU/mL', 'Optimal <5')}
      ${labRow('HOMA-IR', latest?.homaIr, '', 'Insulin resistance ≥2.0')}
    </tbody>
  </table>

  <h3>Derived Risk Metrics</h3>
  <table>
    <tbody>
      <tr><td>TG/HDL Ratio</td><td><strong>${tgHdlRatio.toFixed(2)}</strong></td><td style="font-size:12px;color:#6C757D">Elevated ≥3.0 (IR proxy)</td></tr>
      <tr><td>Estimated 10-yr ASCVD Risk</td><td><strong>${ascvdRisk}%</strong></td><td style="font-size:12px;color:#6C757D">ACC/AHA Pooled Cohort Equation</td></tr>
    </tbody>
  </table>

  <h3>LipidIQ Overlap Zone Score</h3>
  <div class="zone-bar"><div class="zone-dot"></div></div>
  <p><span class="badge" style="background:${positionColor}20;color:${positionColor}">${positionLabel}</span> &nbsp; Score: ${Math.round(overlapScore)}/100</p>
</div>

<!-- PAGE 2: FOR THE PATIENT -->
<div class="page page-break" style="padding-top:40px">
  <h1>LipidIQ Patient Summary</h1>
  <h2>Page 2: What Your Numbers Mean</h2>

  <div class="narrative">
    <p><strong>Your Overlap Zone position: <span style="color:${positionColor}">${positionLabel}</span></strong></p>

    ${overlapScore < 36 ? `
    <p>Your current lab values and risk factors suggest that lifestyle changes — particularly diet improvements, weight management, and metabolic health optimization — may be sufficient to meaningfully reduce your cardiovascular risk. This doesn't mean you have no risk; it means the evidence at your current numbers leans toward trying lifestyle modifications first before considering medication.</p>
    ` : overlapScore < 66 ? `
    <p>You're in what researchers call the "gray zone" — a place where both the lifestyle-first camp and the medication-first camp have legitimate arguments based on your numbers. The honest answer is that the evidence doesn't clearly favor one approach for someone with your profile. This is exactly where a shared decision with your provider matters most.</p>
    ` : `
    <p>Your current risk profile — based on your lipid values, ASCVD risk estimate, and metabolic markers — suggests that the evidence leans toward a medication discussion with your provider. This doesn't mean medication is your only option, but the benefit-to-risk ratio at your numbers is likely favorable. A conversation about the lowest effective dose alongside lifestyle changes is appropriate.</p>
    `}

    ${latest?.lpa && latest.lpa >= 50 ? `<p><strong>Important: Lp(a) Alert.</strong> Your Lp(a) of ${latest.lpa} mg/dL is above the elevated threshold (≥50 mg/dL). Lp(a) is genetically determined — no diet or exercise change will lower it. This is a fixed risk floor that tilts the evidence toward medication even if other numbers look favorable.</p>` : ''}

    ${latest?.homaIr && latest.homaIr >= 2 ? `<p><strong>Insulin Resistance Detected.</strong> Your HOMA-IR of ${latest.homaIr.toFixed(1)} suggests meaningful insulin resistance. The metabolic camp would argue this is the root cause of your dyslipidemia — and that addressing it with low-carbohydrate eating, intermittent fasting, or exercise could improve your TG, HDL, and even LDL pattern more than a statin alone.</p>` : ''}

    <p>Your 10-year cardiovascular risk estimate (using the ACC/AHA Pooled Cohort Equation) is <strong>${ascvdRisk}%</strong>. This is a population-based model — it's a starting point for conversation, not a definitive prediction for you specifically.</p>
  </div>
</div>

<!-- PAGE 3: QUESTIONS TO ASK YOUR DOCTOR -->
<div class="page page-break" style="padding-top:40px">
  <h1>LipidIQ Patient Summary</h1>
  <h2>Page 3: Questions to Ask Your Doctor</h2>
  <p style="color:#6C757D;font-size:13px;margin-bottom:20px">These questions were auto-generated based on your specific lab values. Bring this page to your next appointment.</p>

  ${questions.map((q, i) => `<div class="question">${q}</div>`).join('\n')}

  <div class="disclaimer" style="margin-top:24px">
    LipidIQ is a patient education tool. All calculations and recommendations are for informational purposes only and do not constitute medical advice. Always discuss treatment decisions with your licensed healthcare provider.
    <br><br>
    <strong>Data privacy:</strong> All data entered into LipidIQ is stored locally on your device. No personal health information is transmitted to any server.
  </div>
</div>

</body>
</html>`;
}

export default function SummaryScreen() {
  const { profile, labs, latestOverlapZone } = useAppStore();
  const [exporting, setExporting] = useState(false);

  const latest = labs[0];
  const tgHdl = latest && latest.hdlC && latest.triglycerides
    ? parseFloat((latest.triglycerides / latest.hdlC).toFixed(2))
    : 0;

  const canExport = !!profile && !!latest;

  const handleExport = async () => {
    if (!canExport || !profile || !latestOverlapZone) return;
    setExporting(true);
    try {
      const html = generateHTML(
        profile, labs,
        latestOverlapZone.score,
        latestOverlapZone.recommendation,
        latestOverlapZone.ascvdRisk10yr,
        tgHdl
      );
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share LipidIQ Patient Summary',
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={[TYPOGRAPHY.heading3, { textAlign: 'center', marginTop: SPACING.md }]}>
            Complete onboarding to generate your summary
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={TYPOGRAPHY.heading1}>Patient Summary</Text>
        <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.gray600, marginBottom: SPACING.lg }]}>
          A 3-page PDF to bring to your next appointment
        </Text>

        {/* Preview of 3 pages */}
        <Card style={styles.pagePreview}>
          <View style={styles.pageTag}><Text style={styles.pageTagText}>Page 1</Text></View>
          <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.xs }]}>For Your Clinician</Text>
          <Text style={TYPOGRAPHY.bodySmall}>Clinical data table · All markers with trends · ASCVD risk score · ApoB & Lp(a) flags · Overlap Zone position</Text>
        </Card>

        <Card style={styles.pagePreview}>
          <View style={[styles.pageTag, { backgroundColor: COLORS.primary }]}><Text style={styles.pageTagText}>Page 2</Text></View>
          <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.xs }]}>Plain-English Narrative</Text>
          <Text style={TYPOGRAPHY.bodySmall}>What your numbers mean in plain language · Personalized to your Overlap Zone position · Key alerts highlighted</Text>
        </Card>

        <Card style={styles.pagePreview}>
          <View style={[styles.pageTag, { backgroundColor: COLORS.yellow }]}><Text style={styles.pageTagText}>Page 3</Text></View>
          <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.xs }]}>Questions to Ask Your Doctor</Text>
          <Text style={TYPOGRAPHY.bodySmall}>Auto-generated from your specific lab values · Conversation starters, not conclusions · Turns your app data into a dialogue</Text>
        </Card>

        {/* Preview of auto-questions */}
        {latest && (
          <Card>
            <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.md }]}>Auto-Generated Questions Preview</Text>
            {latest.lpa && latest.lpa >= 50 && (
              <View style={styles.questionPreview}>
                <Text style={styles.questionText}>My Lp(a) is elevated ({latest.lpa} mg/dL). Should I be tested for familial hypercholesterolemia?</Text>
              </View>
            )}
            {tgHdl >= 3 && (
              <View style={styles.questionPreview}>
                <Text style={styles.questionText}>My TG/HDL ratio is {tgHdl.toFixed(1)}. Does this suggest insulin resistance that should be addressed first?</Text>
              </View>
            )}
            {latestOverlapZone && latestOverlapZone.score >= 36 && latestOverlapZone.score < 66 && (
              <View style={styles.questionPreview}>
                <Text style={styles.questionText}>My risk puts me in the gray zone. Would a coronary calcium (CAC) score help clarify whether I need medication?</Text>
              </View>
            )}
            <View style={styles.questionPreview}>
              <Text style={styles.questionText}>What is my NNT (number needed to treat) if I start a statin at my current risk level?</Text>
            </View>
            <View style={styles.questionPreview}>
              <Text style={styles.questionText}>Can we agree on a 3-month lifestyle trial with follow-up labs before deciding on medication?</Text>
            </View>
          </Card>
        )}

        {/* Lab history table preview */}
        {labs.length > 0 && (
          <Card>
            <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.md }]}>Lab History ({labs.length} result{labs.length > 1 ? 's' : ''})</Text>
            {labs.slice(0, 5).map(lab => {
              const ratio = lab.hdlC && lab.triglycerides ? (lab.triglycerides / lab.hdlC).toFixed(2) : '—';
              return (
                <View key={lab.id} style={styles.labRow}>
                  <Text style={[TYPOGRAPHY.body, { fontWeight: '700', width: 100 }]}>{fmtDate(lab.date)}</Text>
                  <Text style={TYPOGRAPHY.bodySmall}>
                    LDL {lab.ldlC ?? '—'} · HDL {lab.hdlC ?? '—'} · TG {lab.triglycerides ?? '—'} · Ratio {ratio}
                  </Text>
                </View>
              );
            })}
          </Card>
        )}

        {/* Export button */}
        <TouchableOpacity
          style={[styles.exportBtn, !canExport && styles.exportBtnDisabled]}
          onPress={handleExport}
          disabled={!canExport || exporting}
        >
          {exporting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.exportBtnText}>📤  Export 3-Page PDF</Text>
              <Text style={styles.exportBtnSub}>Share with your provider or save to Files</Text>
            </>
          )}
        </TouchableOpacity>

        {!canExport && (
          <Text style={[TYPOGRAPHY.bodySmall, { textAlign: 'center', color: COLORS.gray400, marginTop: SPACING.sm }]}>
            Log at least one lab result to generate your PDF
          </Text>
        )}

        <Text style={[TYPOGRAPHY.bodySmall, { textAlign: 'center', color: COLORS.gray400, marginTop: SPACING.lg, lineHeight: 18 }]}>
          All data is stored locally on your device.{'\n'}Nothing is sent to any server.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  pagePreview: { borderLeftWidth: 4, borderLeftColor: COLORS.primaryLight },
  pageTag: {
    backgroundColor: COLORS.primaryLight, borderRadius: 6,
    paddingHorizontal: SPACING.sm, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: SPACING.xs,
  },
  pageTagText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  questionPreview: {
    backgroundColor: '#EBF4FF', borderRadius: 8, padding: SPACING.sm,
    marginBottom: SPACING.xs, flexDirection: 'row',
  },
  questionText: { fontSize: 13, color: COLORS.gray800, lineHeight: 18, flex: 1 },
  labRow: {
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderColor: COLORS.gray100,
  },
  exportBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: SPACING.lg,
    alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.sm,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  exportBtnDisabled: { backgroundColor: COLORS.gray400, shadowOpacity: 0 },
  exportBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  exportBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
});
