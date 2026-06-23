import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/shared/Card';
import { COLORS, REFERENCE_RANGES, SPACING, TYPOGRAPHY } from '../../src/constants';
import { useAppStore } from '../../src/store';
import { LabResult } from '../../src/types';

type MarkerKey = keyof typeof REFERENCE_RANGES;

function LabInput({
  label, value, onChangeText, placeholder, refRange, unit,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; refRange?: string; unit?: string;
}) {
  const num = parseFloat(value);
  const hasValue = !isNaN(num);

  return (
    <View style={styles.fieldGroup}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={TYPOGRAPHY.label}>{label}</Text>
        {!!unit && <Text style={[TYPOGRAPHY.label, { color: COLORS.gray400 }]}>{unit}</Text>}
      </View>
      <TextInput
        style={[styles.input, hasValue && styles.inputFilled]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray400}
      />
      {!!refRange && (
        <Text style={styles.refRange}>Ref: {refRange}</Text>
      )}
    </View>
  );
}

function LabHistoryRow({ lab, onDelete }: { lab: LabResult; onDelete: () => void }) {
  const tgHdl = lab.hdlC && lab.triglycerides ? (lab.triglycerides / lab.hdlC).toFixed(2) : '—';
  return (
    <View style={styles.historyRow}>
      <View style={{ flex: 1 }}>
        <Text style={[TYPOGRAPHY.body, { fontWeight: '700' }]}>{new Date(lab.date).toLocaleDateString()}</Text>
        <Text style={TYPOGRAPHY.bodySmall}>
          LDL {lab.ldlC ?? '—'} · HDL {lab.hdlC ?? '—'} · TG {lab.triglycerides ?? '—'} · TG/HDL {tgHdl}
          {lab.apoB ? ` · ApoB ${lab.apoB}` : ''}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LabsScreen() {
  const { labs, addLabResult, removeLabResult } = useAppStore();
  const [showForm, setShowForm] = useState(labs.length === 0);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState<LabResult['source']>('doctor');
  const [ldlC, setLdlC] = useState('');
  const [hdlC, setHdlC] = useState('');
  const [totalChol, setTotalChol] = useState('');
  const [triglycerides, setTriglycerides] = useState('');
  const [apoB, setApoB] = useState('');
  const [lpa, setLpa] = useState('');
  const [fastingGlucose, setFastingGlucose] = useState('');
  const [fastingInsulin, setFastingInsulin] = useState('');

  const parse = (v: string) => v ? parseFloat(v) : undefined;

  const computeHomaIr = () => {
    const ins = parse(fastingInsulin);
    const glc = parse(fastingGlucose);
    if (ins && glc) return parseFloat(((ins * glc) / 405).toFixed(2));
    return undefined;
  };

  const handleSave = async () => {
    if (!ldlC && !hdlC && !triglycerides) {
      Alert.alert('Missing data', 'Please enter at least LDL-C, HDL-C, or Triglycerides');
      return;
    }
    const lab: LabResult = {
      id: Date.now().toString(),
      date,
      source,
      ldlC: parse(ldlC), hdlC: parse(hdlC), totalChol: parse(totalChol),
      triglycerides: parse(triglycerides),
      apoB: parse(apoB), lpa: parse(lpa),
      fastingGlucose: parse(fastingGlucose), fastingInsulin: parse(fastingInsulin),
      homaIr: computeHomaIr(),
    };
    await addLabResult(lab);
    setShowForm(false);
    // Reset
    setLdlC(''); setHdlC(''); setTotalChol(''); setTriglycerides('');
    setApoB(''); setLpa(''); setFastingGlucose(''); setFastingInsulin('');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete result?', 'This cannot be undone.', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeLabResult(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={TYPOGRAPHY.heading1}>Log Labs</Text>
            {!showForm && (
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
                <Text style={styles.addBtnText}>+ Add Result</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.gray600, marginBottom: SPACING.lg }]}>
            Enter values from your lab report. Only fill what you have — partial panels are fine.
          </Text>

          {showForm && (
            <Card>
              <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.md }]}>New Result</Text>

              {/* Date */}
              <LabInput label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

              {/* Source */}
              <Text style={[TYPOGRAPHY.label, { marginTop: SPACING.sm }]}>Source</Text>
              <View style={styles.segmentRow}>
                {(['doctor', 'lab', 'home_draw', 'other'] as const).map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.segment, source === s && styles.segmentActive]}
                    onPress={() => setSource(s)}
                  >
                    <Text style={[styles.segmentText, source === s && styles.segmentTextActive]}>
                      {s === 'home_draw' ? 'Home Draw' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Standard panel */}
              <Text style={[TYPOGRAPHY.label, { marginTop: SPACING.lg, color: COLORS.primary }]}>
                Standard Lipid Panel
              </Text>
              <LabInput label="LDL-C" value={ldlC} onChangeText={setLdlC} placeholder="e.g. 145" unit="mg/dL" refRange="Optimal <100" />
              <LabInput label="HDL-C" value={hdlC} onChangeText={setHdlC} placeholder="e.g. 55" unit="mg/dL" refRange="Optimal ≥60" />
              <LabInput label="Total Cholesterol" value={totalChol} onChangeText={setTotalChol} placeholder="e.g. 210" unit="mg/dL" refRange="Desirable <200" />
              <LabInput label="Triglycerides" value={triglycerides} onChangeText={setTriglycerides} placeholder="e.g. 130" unit="mg/dL" refRange="Normal <150" />

              {/* Advanced */}
              <Text style={[TYPOGRAPHY.label, { marginTop: SPACING.lg, color: COLORS.primaryLight }]}>
                Advanced Markers (optional)
              </Text>
              <LabInput label="ApoB" value={apoB} onChangeText={setApoB} placeholder="e.g. 90" unit="mg/dL" refRange="Optimal <80" />
              <LabInput label="Lp(a)" value={lpa} onChangeText={setLpa} placeholder="e.g. 25" unit="mg/dL" refRange="Elevated ≥50" />

              {/* Metabolic */}
              <Text style={[TYPOGRAPHY.label, { marginTop: SPACING.lg, color: COLORS.yellow }]}>
                Metabolic / Insulin Markers (optional)
              </Text>
              <LabInput label="Fasting Glucose" value={fastingGlucose} onChangeText={setFastingGlucose} placeholder="e.g. 92" unit="mg/dL" refRange="Normal <100" />
              <LabInput label="Fasting Insulin" value={fastingInsulin} onChangeText={setFastingInsulin} placeholder="e.g. 7" unit="µIU/mL" refRange="Optimal <5" />
              {!!(fastingInsulin && fastingGlucose) && (
                <View style={styles.calculatedRow}>
                  <Text style={TYPOGRAPHY.bodySmall}>HOMA-IR (calculated)</Text>
                  <Text style={[TYPOGRAPHY.body, { color: COLORS.primary, fontWeight: '700' }]}>
                    {computeHomaIr()}
                  </Text>
                </View>
              )}

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save Result</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* History */}
          {labs.length > 0 && (
            <View>
              <Text style={[TYPOGRAPHY.heading3, { marginBottom: SPACING.sm }]}>History</Text>
              {labs.map(lab => (
                <Card key={lab.id} padded={false}>
                  <LabHistoryRow lab={lab} onDelete={() => handleDelete(lab.id)} />
                </Card>
              ))}
            </View>
          )}

          {labs.length === 0 && !showForm && (
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🧪</Text>
              <Text style={[TYPOGRAPHY.body, { textAlign: 'center', marginTop: SPACING.md }]}>
                No lab results yet. Tap "Add Result" to log your first panel.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  fieldGroup: { marginBottom: SPACING.sm },
  input: {
    backgroundColor: COLORS.gray100,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.gray200,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    fontSize: 16, color: COLORS.gray800, marginTop: 4,
  },
  inputFilled: { borderColor: COLORS.primary, backgroundColor: '#EBF4FF' },
  refRange: { fontSize: 11, color: COLORS.gray400, marginTop: 3 },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  segment: {
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.white,
  },
  segmentActive: { borderColor: COLORS.primary, backgroundColor: '#EBF4FF' },
  segmentText: { fontSize: 13, color: COLORS.gray600 },
  segmentTextActive: { color: COLORS.primary, fontWeight: '700' },
  calculatedRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: COLORS.gray100, borderRadius: 10, padding: SPACING.sm, marginTop: SPACING.xs,
  },
  formActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
  cancelBtn: {
    flex: 1, borderRadius: 12, paddingVertical: SPACING.md,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray200,
  },
  cancelBtnText: { color: COLORS.gray600, fontWeight: '600' },
  saveBtn: { flex: 2, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: SPACING.md, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: '700' },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderBottomWidth: 1, borderColor: COLORS.gray100,
  },
  deleteBtn: { padding: SPACING.sm },
  deleteBtnText: { fontSize: 18 },
  empty: { alignItems: 'center', paddingTop: SPACING.xxl },
});
