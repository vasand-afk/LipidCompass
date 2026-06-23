import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/shared/Card';
import { OverlapZoneBar } from '../../src/components/shared/OverlapZoneBar';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants';
import { useAppStore } from '../../src/store';
import { LabResult } from '../../src/types';

function MetricChip({ label, value, unit, flag }: { label: string; value?: number; unit: string; flag?: 'high' | 'low' | 'ok' }) {
  const flagColor = flag === 'high' ? COLORS.red : flag === 'low' ? COLORS.yellow : COLORS.green;
  return (
    <View style={styles.metricChip}>
      <Text style={styles.metricLabel}>{label}</Text>
      {value !== undefined ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
          <Text style={[styles.metricValue, flag && { color: flagColor }]}>{value}</Text>
          <Text style={styles.metricUnit}>{unit}</Text>
        </View>
      ) : (
        <Text style={[styles.metricValue, { color: COLORS.gray400 }]}>—</Text>
      )}
    </View>
  );
}

type FlagValue = 'high' | 'low' | 'ok' | undefined;
interface LabFlags { ldlC: FlagValue; hdlC: FlagValue; trig: FlagValue; lpa: FlagValue; homaIr: FlagValue; }

function labFlags(lab: LabResult): LabFlags {
  return {
    ldlC: lab.ldlC ? (lab.ldlC >= 160 ? 'high' : 'ok') : undefined,
    hdlC: lab.hdlC ? (lab.hdlC < 40 ? 'low' : 'ok') : undefined,
    trig: lab.triglycerides ? (lab.triglycerides >= 200 ? 'high' : 'ok') : undefined,
    lpa: lab.lpa ? (lab.lpa >= 50 ? 'high' : 'ok') : undefined,
    homaIr: lab.homaIr ? (lab.homaIr >= 2 ? 'high' : 'ok') : undefined,
  };
}

export default function Dashboard() {
  const { latestOverlapZone, labs, events, profile } = useAppStore();
  const latest = labs[0];
  const flags: LabFlags = latest ? labFlags(latest) : { ldlC: undefined, hdlC: undefined, trig: undefined, lpa: undefined, homaIr: undefined };

  const tgHdl = latest && latest.hdlC ? (latest.triglycerides ?? 0) / latest.hdlC : undefined;

  // Alert banners
  const alerts: string[] = [];
  if (latest?.lpa && latest.lpa >= 50) alerts.push(`Lp(a) elevated (${latest.lpa} mg/dL) — genetically fixed risk; discuss with your provider`);
  if (latest?.triglycerides && latest.triglycerides >= 500) alerts.push(`Triglycerides very high (${latest.triglycerides} mg/dL) — pancreatitis risk; seek prompt evaluation`);
  if (latest?.homaIr && latest.homaIr >= 2) alerts.push(`HOMA-IR suggests insulin resistance (${latest.homaIr.toFixed(1)}) — metabolic intervention warranted`);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[TYPOGRAPHY.heading1, { marginBottom: SPACING.xs }]}>Dashboard</Text>
        <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.gray600, marginBottom: SPACING.lg }]}>
          {latest ? `Last updated ${new Date(latest.date).toLocaleDateString()}` : 'No labs logged yet'}
        </Text>

        {/* Alert banners */}
        {alerts.map(a => (
          <View key={a} style={styles.alertBanner}>
            <Text style={styles.alertText}>!  {a}</Text>
          </View>
        ))}

        {/* Overlap Zone */}
        <Card>
          <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.md }]}>Your Overlap Zone</Text>
          {latestOverlapZone ? (
            <>
              <OverlapZoneBar
                score={latestOverlapZone.score}
                position={latestOverlapZone.position}
              />
              <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.gray600, marginTop: SPACING.md, lineHeight: 20 }]}>
                {latestOverlapZone.recommendation}
              </Text>
            </>
          ) : (
            <TouchableOpacity style={styles.emptyState} onPress={() => router.push('/(tabs)/labs')}>
              <Text style={styles.emptyEmoji}>🧪</Text>
              <Text style={[TYPOGRAPHY.body, { textAlign: 'center' }]}>Log your first lipid panel to see your Overlap Zone</Text>
              <Text style={[styles.tapToLog]}>Tap to log labs →</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Key metrics grid */}
        {latest && (
          <Card>
            <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.md }]}>Key Markers</Text>
            <View style={styles.metricsGrid}>
              <MetricChip label="LDL-C" value={latest.ldlC} unit="mg/dL" flag={flags.ldlC as any} />
              <MetricChip label="HDL-C" value={latest.hdlC} unit="mg/dL" flag={flags.hdlC as any} />
              <MetricChip label="Triglycerides" value={latest.triglycerides} unit="mg/dL" flag={flags.trig as any} />
              <MetricChip label="TG/HDL Ratio" value={tgHdl ? parseFloat(tgHdl.toFixed(2)) : undefined} unit="" flag={tgHdl ? (tgHdl >= 3 ? 'high' : 'ok') : undefined} />
              <MetricChip label="ApoB" value={latest.apoB} unit="mg/dL" flag={latest.apoB ? (latest.apoB >= 100 ? 'high' : 'ok') : undefined} />
              <MetricChip label="Lp(a)" value={latest.lpa} unit="mg/dL" flag={flags.lpa as any} />
              <MetricChip label="HOMA-IR" value={latest.homaIr} unit="" flag={flags.homaIr as any} />
              <MetricChip label="ApoB" value={latest.apoB} unit="mg/dL" />
            </View>
          </Card>
        )}

        {/* ASCVD risk */}
        {latestOverlapZone && (
          <Card>
            <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.sm }]}>Risk Breakdown</Text>
            {latestOverlapZone.factors.map(f => (
              <View key={f.label} style={styles.factorRow}>
                <Text style={TYPOGRAPHY.body}>{f.label}</Text>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.primary, fontWeight: '600' }]}>{f.value}</Text>
              </View>
            ))}
            <View style={styles.factorRow}>
              <Text style={TYPOGRAPHY.body}>10-yr ASCVD Risk</Text>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.primary, fontWeight: '600' }]}>
                {latestOverlapZone.ascvdRisk10yr}%
              </Text>
            </View>
          </Card>
        )}

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/simulator')}>
            <Text style={styles.quickEmoji}>📈</Text>
            <Text style={styles.quickLabel}>Simulate{'\n'}Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/debate')}>
            <Text style={styles.quickEmoji}>🤔</Text>
            <Text style={styles.quickLabel}>View{'\n'}Debate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/labs')}>
            <Text style={styles.quickEmoji}>🧪</Text>
            <Text style={styles.quickLabel}>Log{'\n'}Labs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/summary')}>
            <Text style={styles.quickEmoji}>📋</Text>
            <Text style={styles.quickLabel}>Export{'\n'}Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  alertBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.yellow,
  },
  alertText: { fontSize: 13, color: '#92400E', lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyEmoji: { fontSize: 40, marginBottom: SPACING.sm },
  tapToLog: { color: COLORS.primary, fontWeight: '600', marginTop: SPACING.sm },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  metricChip: {
    backgroundColor: COLORS.gray100,
    borderRadius: 10,
    padding: SPACING.sm,
    width: '47%',
  },
  metricLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray600, marginBottom: 2, textTransform: 'uppercase' },
  metricValue: { fontSize: 20, fontWeight: '700', color: COLORS.gray800 },
  metricUnit: { fontSize: 11, color: COLORS.gray400, marginBottom: 3 },
  factorRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderColor: COLORS.gray100,
  },
  quickActions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  quickBtn: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 14,
    alignItems: 'center', paddingVertical: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  quickEmoji: { fontSize: 24, marginBottom: SPACING.xs },
  quickLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray600, textAlign: 'center' },
});
