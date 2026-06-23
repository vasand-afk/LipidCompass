import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/shared/Card';
import { OverlapZoneBar } from '../../src/components/shared/OverlapZoneBar';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants';
import { useAppStore } from '../../src/store';
import { SimulatorScenario } from '../../src/types';

function Slider({
  label, value, min, max, step = 1, unit, onValueChange, description,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  unit: string; onValueChange: (v: number) => void; description?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  const increment = () => onValueChange(Math.min(max, parseFloat((value + step).toFixed(1))));
  const decrement = () => onValueChange(Math.max(min, parseFloat((value - step).toFixed(1))));

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={TYPOGRAPHY.label}>{label}</Text>
        <View style={styles.valueRow}>
          <TouchableOpacity onPress={decrement} style={styles.stepBtn}>
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.valueDisplay}>
            <Text style={styles.sliderValue}>{value}</Text>
            <Text style={styles.sliderUnit}>{unit}</Text>
          </View>
          <TouchableOpacity onPress={increment} style={styles.stepBtn}>
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
        <View style={[styles.thumb, { left: `${Math.min(pct, 98)}%` }]} />
      </View>
      <View style={styles.trackLabels}>
        <Text style={styles.trackLabel}>{min}{unit}</Text>
        <Text style={styles.trackLabel}>{max}{unit}</Text>
      </View>
      {description && <Text style={styles.sliderDesc}>{description}</Text>}
    </View>
  );
}

export default function SimulatorScreen() {
  const {
    latestOverlapZone, simulatedOverlapZone, labs,
    weightLossDelta, tgReductionPct, ldlTargetMgDl,
    setSimulatorSlider, addScenario,
  } = useAppStore();

  const [scenarioName, setScenarioName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const hasData = !!labs[0] && !!latestOverlapZone;
  const latest = labs[0];

  const scoreDelta = simulatedOverlapZone && latestOverlapZone
    ? simulatedOverlapZone.score - latestOverlapZone.score
    : 0;

  const handleSaveScenario = async () => {
    if (!scenarioName.trim() || !simulatedOverlapZone) return;
    const scenario: SimulatorScenario = {
      id: Date.now().toString(),
      name: scenarioName.trim(),
      createdAt: new Date().toISOString(),
      weightLossDelta,
      tgReductionPct,
      ldlTargetMgDl,
      overlapZoneScore: simulatedOverlapZone.score,
    };
    await addScenario(scenario);
    setShowSave(false);
    setScenarioName('');
    Alert.alert('Saved!', `Scenario "${scenario.name}" saved.`);
  };

  if (!hasData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📈</Text>
          <Text style={[TYPOGRAPHY.heading3, { textAlign: 'center', marginTop: SPACING.md }]}>
            Log your first lab result to use the Simulator
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={TYPOGRAPHY.heading1}>What If Simulator</Text>
        <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.gray600, marginBottom: SPACING.lg }]}>
          Adjust the sliders to see how lifestyle changes shift your Overlap Zone in real time.
        </Text>

        {/* Side-by-side zones */}
        <Card>
          <View style={styles.zoneCompare}>
            <View style={styles.zoneCol}>
              <Text style={styles.zoneColLabel}>Current</Text>
              <OverlapZoneBar
                score={latestOverlapZone!.score}
                position={latestOverlapZone!.position}
                compact
              />
              <Text style={styles.zoneScore}>{Math.round(latestOverlapZone!.score)}</Text>
            </View>
            <View style={styles.zoneDivider} />
            <View style={styles.zoneCol}>
              <Text style={styles.zoneColLabel}>Projected</Text>
              <OverlapZoneBar
                score={simulatedOverlapZone?.score ?? latestOverlapZone!.score}
                position={simulatedOverlapZone?.position ?? latestOverlapZone!.position}
                compact
              />
              <Text style={[styles.zoneScore, { color: scoreDelta < 0 ? COLORS.green : scoreDelta > 0 ? COLORS.red : COLORS.gray600 }]}>
                {simulatedOverlapZone ? Math.round(simulatedOverlapZone.score) : '—'}
                {scoreDelta !== 0 && (
                  <Text style={styles.delta}> ({scoreDelta > 0 ? '+' : ''}{Math.round(scoreDelta)})</Text>
                )}
              </Text>
            </View>
          </View>

          {simulatedOverlapZone && (
            <View style={styles.insightBox}>
              <Text style={styles.insightText}>{simulatedOverlapZone.recommendation}</Text>
            </View>
          )}
        </Card>

        {/* Sliders */}
        <Card>
          <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.md }]}>Lifestyle Levers</Text>

          <Slider
            label="Weight Loss"
            value={weightLossDelta}
            min={0}
            max={50}
            step={5}
            unit=" lbs"
            onValueChange={v => setSimulatorSlider('weightLossDelta', v)}
            description={weightLossDelta > 0
              ? `≈${(weightLossDelta * 0.45).toFixed(0)}kg loss → est. LDL ↓${Math.round(weightLossDelta * 0.23)} · TG ↓${Math.round(weightLossDelta * 0.68)} · HDL ↑${Math.round(weightLossDelta * 0.16)} mg/dL`
              : 'Weight loss reduces TG, improves HDL and insulin sensitivity'}
          />

          <Slider
            label="Triglyceride Reduction"
            value={tgReductionPct}
            min={0}
            max={50}
            step={5}
            unit="%"
            onValueChange={v => setSimulatorSlider('tgReductionPct', v)}
            description={latest?.triglycerides && tgReductionPct > 0
              ? `TG ${latest.triglycerides} → ${Math.round(latest.triglycerides * (1 - tgReductionPct / 100))} mg/dL (via low-carb, fish oil, exercise)`
              : 'Diet, exercise, and omega-3s can reduce TG 20–50%'}
          />

          <Slider
            label="LDL-C Target"
            value={ldlTargetMgDl}
            min={50}
            max={190}
            step={10}
            unit=" mg/dL"
            onValueChange={v => setSimulatorSlider('ldlTargetMgDl', v)}
            description={`Current LDL: ${latest?.ldlC ?? '—'} mg/dL. Target: ${ldlTargetMgDl} mg/dL`}
          />
        </Card>

        {/* What this means */}
        {simulatedOverlapZone && scoreDelta < -5 && (
          <Card style={{ backgroundColor: COLORS.greenLight, borderWidth: 1, borderColor: COLORS.green }}>
            <Text style={[TYPOGRAPHY.heading3, { color: COLORS.green, marginBottom: SPACING.xs }]}>
              ✓ Lifestyle changes make a real difference here
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: '#155724' }]}>
              At these targets, your Overlap Zone score drops by {Math.abs(Math.round(scoreDelta))} points —
              moving {Math.abs(scoreDelta) > 15 ? 'significantly' : 'meaningfully'} toward the lifestyle-sufficient zone.
              This is worth discussing with your provider as an alternative or complement to medication.
            </Text>
          </Card>
        )}

        {simulatedOverlapZone && scoreDelta >= -5 && (
          <Card style={{ backgroundColor: COLORS.yellowLight, borderWidth: 1, borderColor: COLORS.yellow }}>
            <Text style={[TYPOGRAPHY.heading3, { color: '#856404', marginBottom: SPACING.xs }]}>
              Lifestyle changes help, but may not be sufficient alone
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: '#664d03' }]}>
              Even at these optimistic targets, your risk profile may still benefit from medication alongside lifestyle changes.
              Bring this simulation to your next appointment.
            </Text>
          </Card>
        )}

        {/* Save scenario */}
        {!showSave ? (
          <TouchableOpacity style={styles.saveScenarioBtn} onPress={() => setShowSave(true)}>
            <Text style={styles.saveScenarioBtnText}>Save This Scenario as a Goal</Text>
          </TouchableOpacity>
        ) : (
          <Card>
            <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.sm }]}>Name this scenario</Text>
            <TextInput
              style={styles.nameInput}
              value={scenarioName}
              onChangeText={setScenarioName}
              placeholder="e.g. My 3-month goal"
              placeholderTextColor={COLORS.gray400}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSave(false)}>
                <Text style={{ color: COLORS.gray600, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveScenario}>
                <Text style={{ color: COLORS.white, fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  zoneCompare: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  zoneCol: { flex: 1 },
  zoneColLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray600, textAlign: 'center', marginBottom: SPACING.sm, textTransform: 'uppercase' },
  zoneScore: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: SPACING.sm, color: COLORS.gray800 },
  delta: { fontSize: 14, fontWeight: '600' },
  zoneDivider: { width: 1, height: 60, backgroundColor: COLORS.gray200 },
  insightBox: { backgroundColor: COLORS.gray100, borderRadius: 10, padding: SPACING.sm, marginTop: SPACING.sm },
  insightText: { fontSize: 13, color: COLORS.gray600, lineHeight: 18 },
  sliderContainer: { marginBottom: SPACING.lg },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  valueDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 2, minWidth: 64, justifyContent: 'center' },
  sliderValue: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  sliderUnit: { fontSize: 12, color: COLORS.gray400 },
  stepBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, color: COLORS.primary, fontWeight: '700', lineHeight: 24 },
  track: {
    height: 8, backgroundColor: COLORS.gray200, borderRadius: 4,
    position: 'relative', justifyContent: 'center',
  },
  fill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  thumb: {
    position: 'absolute', width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.primary, borderWidth: 3, borderColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2,
    shadowRadius: 2, elevation: 2, top: -6, marginLeft: -10,
  },
  trackLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  trackLabel: { fontSize: 11, color: COLORS.gray400 },
  sliderDesc: { fontSize: 12, color: COLORS.gray600, marginTop: SPACING.xs, lineHeight: 16 },
  saveScenarioBtn: {
    backgroundColor: COLORS.white, borderRadius: 14,
    paddingVertical: SPACING.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary, marginBottom: SPACING.lg,
  },
  saveScenarioBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  nameInput: {
    backgroundColor: COLORS.gray100, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.gray200, padding: SPACING.sm, fontSize: 16, color: COLORS.gray800,
  },
  cancelBtn: {
    flex: 1, borderRadius: 10, paddingVertical: SPACING.sm,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray200,
  },
  confirmBtn: { flex: 2, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: SPACING.sm, alignItems: 'center' },
});
