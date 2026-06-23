/**
 * Platform-aware storage layer.
 * Web: localStorage (JSON)
 * Native (iOS/Android): expo-sqlite
 */
import { Platform } from 'react-native';
import { LabResult, LifestyleEvent, SimulatorScenario, UserProfile } from '../types';

// ── Web storage (localStorage) ──────────────────────────────────────────────

function webGet<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function webGetOne<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function webSet(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Native storage (expo-sqlite) ─────────────────────────────────────────────

let _db: any = null;

async function getNativeDb() {
  if (_db) return _db;
  const SQLite = await import('expo-sqlite');
  _db = await SQLite.openDatabaseAsync('lipidiq.db');
  await _db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY, age INTEGER, sex TEXT,
      is_smoker INTEGER, has_diabetes INTEGER, systolic_bp INTEGER,
      on_bp_meds INTEGER, family_history_cvd INTEGER, knows_lpa INTEGER,
      created_at TEXT, updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS lab_results (
      id TEXT PRIMARY KEY, date TEXT, source TEXT,
      ldl_c REAL, hdl_c REAL, total_chol REAL, triglycerides REAL,
      non_hdl_c REAL, apo_b REAL, lpa REAL, fasting_glucose REAL,
      fasting_insulin REAL, homa_ir REAL, notes TEXT, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS lifestyle_events (
      id TEXT PRIMARY KEY, date TEXT, type TEXT, label TEXT, detail TEXT, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS simulator_scenarios (
      id TEXT PRIMARY KEY, name TEXT,
      weight_loss_delta REAL, tg_reduction_pct REAL,
      ldl_target_mg_dl REAL, overlap_zone_score REAL, created_at TEXT
    );
  `);
  return _db;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function saveProfile(profile: UserProfile): Promise<void> {
  if (Platform.OS === 'web') {
    webSet('profile', profile);
    return;
  }
  const db = await getNativeDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO user_profile VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    profile.id, profile.age, profile.sex,
    profile.isSmoker ? 1 : 0, profile.hasDiabetes ? 1 : 0,
    profile.systolicBP, profile.onBPMeds ? 1 : 0,
    profile.familyHistoryCVD ? 1 : 0, profile.knowsLpa ? 1 : 0,
    profile.createdAt, profile.updatedAt
  );
}

export async function loadProfile(): Promise<UserProfile | null> {
  if (Platform.OS === 'web') return webGetOne<UserProfile>('profile');
  const db = await getNativeDb();
  const row = (await db.getFirstAsync('SELECT * FROM user_profile LIMIT 1')) as any;
  if (!row) return null;
  return {
    id: row.id, age: row.age, sex: row.sex,
    isSmoker: row.is_smoker === 1, hasDiabetes: row.has_diabetes === 1,
    systolicBP: row.systolic_bp, onBPMeds: row.on_bp_meds === 1,
    familyHistoryCVD: row.family_history_cvd === 1, knowsLpa: row.knows_lpa === 1,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export async function saveLabResult(lab: LabResult): Promise<void> {
  if (Platform.OS === 'web') {
    const labs = webGet<LabResult>('labs').filter(l => l.id !== lab.id);
    webSet('labs', [lab, ...labs]);
    return;
  }
  const db = await getNativeDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO lab_results VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    lab.id, lab.date, lab.source,
    lab.ldlC ?? null, lab.hdlC ?? null, lab.totalChol ?? null,
    lab.triglycerides ?? null, lab.nonHdlC ?? null, lab.apoB ?? null,
    lab.lpa ?? null, lab.fastingGlucose ?? null, lab.fastingInsulin ?? null,
    lab.homaIr ?? null, lab.notes ?? null, new Date().toISOString()
  );
}

export async function loadLabResults(): Promise<LabResult[]> {
  if (Platform.OS === 'web') return webGet<LabResult>('labs');
  const db = await getNativeDb();
  const rows = (await db.getAllAsync('SELECT * FROM lab_results ORDER BY date DESC')) as any[];
  return rows.map((r: any) => ({
    id: r.id, date: r.date, source: r.source,
    ldlC: r.ldl_c ?? undefined, hdlC: r.hdl_c ?? undefined,
    totalChol: r.total_chol ?? undefined, triglycerides: r.triglycerides ?? undefined,
    nonHdlC: r.non_hdl_c ?? undefined, apoB: r.apo_b ?? undefined,
    lpa: r.lpa ?? undefined, fastingGlucose: r.fasting_glucose ?? undefined,
    fastingInsulin: r.fasting_insulin ?? undefined, homaIr: r.homa_ir ?? undefined,
    notes: r.notes ?? undefined,
  }));
}

export async function deleteLabResult(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    webSet('labs', webGet<LabResult>('labs').filter(l => l.id !== id));
    return;
  }
  const db = await getNativeDb();
  await db.runAsync('DELETE FROM lab_results WHERE id = ?', id);
}

export async function saveLifestyleEvent(event: LifestyleEvent): Promise<void> {
  if (Platform.OS === 'web') {
    const events = webGet<LifestyleEvent>('events').filter(e => e.id !== event.id);
    webSet('events', [event, ...events]);
    return;
  }
  const db = await getNativeDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO lifestyle_events VALUES (?,?,?,?,?,?)`,
    event.id, event.date, event.type, event.label, event.detail ?? null, new Date().toISOString()
  );
}

export async function loadLifestyleEvents(): Promise<LifestyleEvent[]> {
  if (Platform.OS === 'web') return webGet<LifestyleEvent>('events');
  const db = await getNativeDb();
  const rows = (await db.getAllAsync('SELECT * FROM lifestyle_events ORDER BY date DESC')) as any[];
  return rows.map((r: any) => ({
    id: r.id, date: r.date, type: r.type, label: r.label, detail: r.detail ?? undefined,
  }));
}

export async function saveScenario(scenario: SimulatorScenario): Promise<void> {
  if (Platform.OS === 'web') {
    const scenarios = webGet<SimulatorScenario>('scenarios').filter(s => s.id !== scenario.id);
    webSet('scenarios', [scenario, ...scenarios]);
    return;
  }
  const db = await getNativeDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO simulator_scenarios VALUES (?,?,?,?,?,?,?)`,
    scenario.id, scenario.name, scenario.weightLossDelta, scenario.tgReductionPct,
    scenario.ldlTargetMgDl, scenario.overlapZoneScore, scenario.createdAt
  );
}

export async function loadScenarios(): Promise<SimulatorScenario[]> {
  if (Platform.OS === 'web') return webGet<SimulatorScenario>('scenarios');
  const db = await getNativeDb();
  const rows = (await db.getAllAsync('SELECT * FROM simulator_scenarios ORDER BY created_at DESC')) as any[];
  return rows.map((r: any) => ({
    id: r.id, name: r.name, createdAt: r.created_at,
    weightLossDelta: r.weight_loss_delta, tgReductionPct: r.tg_reduction_pct,
    ldlTargetMgDl: r.ldl_target_mg_dl, overlapZoneScore: r.overlap_zone_score,
  }));
}
