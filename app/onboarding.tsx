import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../src/constants';
import { useAppStore } from '../src/store';
import { UserProfile } from '../src/types';

const { width } = Dimensions.get('window');

type Goal = 'research' | 'performance' | 'recovery' | 'longevity';

const GOALS: { key: Goal; label: string; emoji: string; desc: string }[] = [
  { key: 'research', label: 'Research', emoji: '🧫', desc: 'I want to understand the science behind my numbers' },
  { key: 'performance', label: 'Performance', emoji: '⚡️', desc: 'I want to optimize my metabolic health' },
  { key: 'recovery', label: 'Prevention', emoji: '🛡️', desc: 'I want to prevent a future cardiovascular event' },
  { key: 'longevity', label: 'Longevity', emoji: '🌱', desc: 'I want to live longer and healthier' },
];

export default function Onboarding() {
  const setProfile = useAppStore(s => s.setProfile);
  const flatListRef = useRef<FlatList>(null);
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);

  // Profile state
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [isSmoker, setIsSmoker] = useState(false);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [systolicBP, setSystolicBP] = useState('120');
  const [onBPMeds, setOnBPMeds] = useState(false);
  const [familyHistoryCVD, setFamilyHistoryCVD] = useState(false);
  const [knowsLpa, setKnowsLpa] = useState(false);

  const goToStep = (n: number) => {
    setStep(n);
    flatListRef.current?.scrollToIndex({ index: n, animated: true });
  };

  const handleFinish = async () => {
    const now = new Date().toISOString();
    const profile: UserProfile = {
      id: 'user-1',
      age: parseInt(age) || 45,
      sex,
      isSmoker,
      hasDiabetes,
      systolicBP: parseInt(systolicBP) || 120,
      onBPMeds,
      familyHistoryCVD,
      knowsLpa,
      createdAt: now,
      updatedAt: now,
    };
    await setProfile(profile);
    router.replace('/(tabs)/dashboard');
  };

  const screens = [
    // Screen 0: Splash
    <View key="splash" style={styles.screen}>
      <Text style={styles.heroEmoji}>🫀</Text>
      <Text style={[TYPOGRAPHY.heading1, styles.center]}>LipidCompass</Text>
      <Text style={[TYPOGRAPHY.body, styles.center, styles.subtext]}>
        Both sides of the cholesterol debate, personalized to you.
      </Text>
      <Text style={[TYPOGRAPHY.bodySmall, styles.center, styles.disclaimer]}>
        For informational purposes only — not medical advice
      </Text>
      <TouchableOpacity style={styles.btn} onPress={() => goToStep(1)}>
        <Text style={styles.btnText}>Get Started</Text>
      </TouchableOpacity>
    </View>,

    // Screen 1: Goal
    <View key="goal" style={styles.screen}>
      <Text style={[TYPOGRAPHY.heading2, styles.center]}>What brings you here?</Text>
      <Text style={[TYPOGRAPHY.bodySmall, styles.center, { marginBottom: SPACING.xl }]}>
        We'll personalize your experience around your goal
      </Text>
      {GOALS.map(g => (
        <TouchableOpacity
          key={g.key}
          style={[styles.goalCard, goal === g.key && styles.goalCardSelected]}
          onPress={() => setGoal(g.key)}
        >
          <Text style={styles.goalEmoji}>{g.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[TYPOGRAPHY.heading3, { color: goal === g.key ? COLORS.primary : COLORS.gray800 }]}>{g.label}</Text>
            <Text style={TYPOGRAPHY.bodySmall}>{g.desc}</Text>
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[styles.btn, !goal && styles.btnDisabled]}
        onPress={() => goal && goToStep(2)}
        disabled={!goal}
      >
        <Text style={styles.btnText}>Continue</Text>
      </TouchableOpacity>
    </View>,

    // Screen 2: Profile
    <KeyboardAvoidingView key="profile" style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[TYPOGRAPHY.heading2, styles.center]}>Your Health Profile</Text>
        <Text style={[TYPOGRAPHY.bodySmall, styles.center, { marginBottom: SPACING.xl }]}>
          Used to calculate your personalized risk score. Stored locally on your device only.
        </Text>

        <Text style={TYPOGRAPHY.label}>Age</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="e.g. 52"
          value={age}
          onChangeText={setAge}
          placeholderTextColor={COLORS.gray400}
          maxLength={3}
        />

        <Text style={[TYPOGRAPHY.label, { marginTop: SPACING.md }]}>Biological Sex</Text>
        <View style={styles.segmentRow}>
          {(['male', 'female'] as const).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.segment, sex === s && styles.segmentActive]}
              onPress={() => setSex(s)}
            >
              <Text style={[styles.segmentText, sex === s && styles.segmentTextActive]}>
                {s === 'male' ? 'Male' : 'Female'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[TYPOGRAPHY.label, { marginTop: SPACING.md }]}>Resting Systolic BP</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="e.g. 125 mmHg"
          value={systolicBP}
          onChangeText={setSystolicBP}
          placeholderTextColor={COLORS.gray400}
          maxLength={3}
        />

        {[
          { label: 'Current Smoker', value: isSmoker, set: setIsSmoker },
          { label: 'Diagnosed with Diabetes', value: hasDiabetes, set: setHasDiabetes },
          { label: 'On Blood Pressure Medication', value: onBPMeds, set: setOnBPMeds },
          { label: 'Family History of CVD (parent/sibling <65)', value: familyHistoryCVD, set: setFamilyHistoryCVD },
          { label: 'I know my Lp(a) level', value: knowsLpa, set: setKnowsLpa },
        ].map(item => (
          <View key={item.label} style={styles.switchRow}>
            <Text style={[TYPOGRAPHY.body, { flex: 1 }]}>{item.label}</Text>
            <Switch
              value={item.value}
              onValueChange={item.set}
              trackColor={{ true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.btn, { marginTop: SPACING.xl }]}
          onPress={() => goToStep(3)}
          disabled={!age}
        >
          <Text style={styles.btnText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>,

    // Screen 3: Ready
    <View key="ready" style={styles.screen}>
      <Text style={styles.heroEmoji}>✓</Text>
      <Text style={[TYPOGRAPHY.heading2, styles.center]}>You're set up!</Text>
      <Text style={[TYPOGRAPHY.body, styles.center, styles.subtext]}>
        Log your first lipid panel to see your personalized Overlap Zone — where your risk sits on the spectrum between lifestyle and medication.
      </Text>
      <View style={styles.featureList}>
        {[
          ['🎯', 'Live Overlap Zone that moves with your data'],
          ['📈', '"What If" Simulator for lifestyle scenarios'],
          ['🏛️', 'Tug of War: both camps of evidence, side by side'],
          ['📋', 'Patient Summary Packet to bring to your doctor'],
        ].map(([emoji, text]) => (
          <View key={text} style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{emoji}</Text>
            <Text style={TYPOGRAPHY.body}>{text}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.btn} onPress={handleFinish}>
        <Text style={styles.btnText}>Enter LipidCompass</Text>
      </TouchableOpacity>
    </View>,
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Step dots */}
      <View style={styles.dots}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
        ))}
      </View>

      <FlatList
        ref={flatListRef}
        data={screens}
        renderItem={({ item }) => item}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.gray200 },
  dotActive: { backgroundColor: COLORS.primary, width: 24 },
  screen: {
    width,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  heroEmoji: { fontSize: 64, textAlign: 'center', marginBottom: SPACING.md },
  center: { textAlign: 'center' },
  subtext: { color: COLORS.gray600, marginTop: SPACING.sm, marginBottom: SPACING.xl, fontSize: 19 },
  disclaimer: { color: COLORS.gray400, marginBottom: SPACING.xl, fontSize: 16 },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: 144,
  },
  btnDisabled: { backgroundColor: COLORS.gray400 },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardSelected: { borderColor: COLORS.primary, backgroundColor: '#EBF4FF' },
  goalEmoji: { fontSize: 28 },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.gray800,
    marginTop: SPACING.xs,
  },
  segmentRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  segment: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  segmentActive: { borderColor: COLORS.primary, backgroundColor: '#EBF4FF' },
  segmentText: { fontSize: 15, color: COLORS.gray600 },
  segmentTextActive: { color: COLORS.primary, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderColor: COLORS.gray100,
  },
  featureList: { gap: SPACING.md, marginBottom: SPACING.xl },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  featureEmoji: { fontSize: 22, marginTop: 2 },
});
