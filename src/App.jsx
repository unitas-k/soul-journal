import { useState, useEffect } from "react";

// ── Google Apps Script WebアプリのURLをここに設定 ──────────────
const GAS_URL = "https://script.google.com/macros/s/AKfycbzDAjt5b9R2fcZZkhvm7-O9ZfXffe629S3jMM2l105f4bu4dBQmaMrQa7A7j94_Wda7/exec";
// ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "A", label: "A", title: "現実と想念", subtitle: "現実とパターン" },
  { id: "B", label: "B", title: "違和感", subtitle: "違和感メモ" },
  { id: "C", label: "C", title: "言動の癖", subtitle: "反射の癖" },
  { id: "D", label: "D", title: "体調のサイン", subtitle: "体からのサイン" },
];

const EMOTIONS = ["不安", "焦り", "怒り", "悲しみ", "虚しさ", "孤独", "恥", "罪悪感", "無力感", "恐れ", "その他"];
const MOON = ["満月前後", "新月前後", "満月新月に関係ないタイミング"];

// ── 月の満ち欠け自動計算 ──────────────────────────────────────
function getMoonPhase(date = new Date()) {
  const knownNewMoon = new Date(2000, 0, 6, 18, 14, 0);
  const lunarCycle = 29.53058867;
  const diff = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const phase = ((diff % lunarCycle) + lunarCycle) % lunarCycle;

  if (phase < 2 || phase > 27.5) return { label: "新月前後", emoji: "🌑", days: Math.round(phase < 2 ? phase : lunarCycle - phase) };
  if (phase < 6) return { label: "満月新月に関係ないタイミング", emoji: "🌒", days: null };
  if (phase < 9) return { label: "満月前後", emoji: "🌓", days: null };
  if (Math.abs(phase - lunarCycle / 2) < 2) return { label: "満月前後", emoji: "🌕", days: Math.round(Math.abs(phase - lunarCycle / 2)) };
  if (phase < 14) return { label: "満月前後", emoji: "🌔", days: Math.round(lunarCycle / 2 - phase) };
  if (phase < 16.5) return { label: "満月前後", emoji: "🌕", days: Math.round(Math.abs(phase - lunarCycle / 2)) };
  if (phase < 23) return { label: "満月新月に関係ないタイミング", emoji: "🌖", days: null };
  return { label: "新月前後", emoji: "🌘", days: Math.round(lunarCycle - phase) };
}

function MoonTag({ moon, setMoon }) {
  const today = getMoonPhase();
  return (
    <div>
      <div style={{ background: "#f5f0ea", borderRadius: 8, padding: "8px 14px", marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>{today.emoji}</span>
        <span style={{ fontSize: 14, color: "#2c1e10", fontFamily: FONT }}>
          今日は<strong>「{today.label}」</strong>頃です
          {today.days !== null && today.days <= 2 && <span>（{today.days === 0 ? "ちょうど今日" : `あと${today.days}日`}）</span>}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {MOON.map(m => <Tag key={m} label={m} selected={moon === m} onClick={() => setMoon(moon === m ? "" : m)} />)}
      </div>
    </div>
  );
}

const FONT = "'Hiragino Kaku Gothic Pro', 'Meiryo', 'Yu Gothic', sans-serif";
const SETTINGS_KEY = "soul-journal-settings";

// ── localStorage版ストレージ関数 ──────────────────────────────
function loadRecords(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : [];
  } catch { return []; }
}
function saveRecords(key, records) {
  try { localStorage.setItem(key, JSON.stringify(records)); }
  catch (e) { console.error("保存エラー:", e); }
}
function loadSettings() {
  try {
    const val = localStorage.getItem(SETTINGS_KEY);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}
function saveSettings(s) {
  try {
    if (s === null) { localStorage.removeItem(SETTINGS_KEY); }
    else { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
  } catch (e) { console.error("設定保存エラー:", e); }
}

async function sendToSheets(clientId, tab, data) {
  if (!GAS_URL || GAS_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") return;
  try {
    await fetch(GAS_URL, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, tab, data, timestamp: new Date().toISOString() }),
    });
  } catch (e) { console.error("Sheets送信エラー:", e); }
}

function Tag({ label, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 14px", borderRadius: 20,
      border: selected ? "1.5px solid #c8a882" : "1.5px solid #e8dfd4",
      background: selected ? "#c8a882" : "transparent",
      color: selected ? "#fff" : "#a08060",
      fontSize: 14, cursor: "pointer", transition: "all 0.18s",
      fontFamily: FONT, letterSpacing: 0.5,
    }}>{label}</button>
  );
}
function Label({ children }) {
  return <div style={{ fontSize: 14, color: "#2c1e10", letterSpacing: 1.5, marginBottom: 8, fontFamily: FONT }}>{children}</div>;
}
function Note({ children }) {
  return (
    <div style={{ background: "#f5f0ea", borderLeft: "3px solid #c8a882", padding: "10px 14px", borderRadius: "0 8px 8px 0", marginBottom: 24, fontSize: 14, color: "#2c1e10", lineHeight: 1.9, fontFamily: FONT }}>
      {children}
    </div>
  );
}
function SmallNote({ children }) {
  return <div style={{ fontSize: 13, color: "#5a4035", marginBottom: 10, lineHeight: 1.8, fontFamily: FONT }}>{children}</div>;
}
function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{
      width: "100%", padding: "12px 14px", borderRadius: 10,
      border: "1.5px solid #e8dfd4", background: "#fdfaf7",
      fontSize: 15, color: "#4a3828", fontFamily: FONT,
      lineHeight: 1.8, resize: "vertical", outline: "none",
      marginBottom: 20, boxSizing: "border-box", transition: "border-color 0.2s",
    }}
      onFocus={e => e.target.style.borderColor = "#c8a882"}
      onBlur={e => e.target.style.borderColor = "#e8dfd4"}
    />
  );
}
function InputField({ value, onChange, placeholder }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} style={{
      width: "100%", padding: "10px 14px", borderRadius: 10,
      border: "1.5px solid #e8dfd4", background: "#fdfaf7",
      fontSize: 15, color: "#4a3828", fontFamily: FONT,
      outline: "none", marginBottom: 20, boxSizing: "border-box",
    }}
      onFocus={e => e.target.style.borderColor = "#c8a882"}
      onBlur={e => e.target.style.borderColor = "#e8dfd4"}
    />
  );
}
function SaveButton({ onClick, saving }) {
  const [flash, setFlash] = useState(false);
  const handle = async () => { await onClick(); setFlash(true); setTimeout(() => setFlash(false), 1000); };
  return (
    <button onClick={handle} disabled={saving} style={{
      background: flash ? "#a07848" : "#c8a882", color: "#fff",
      border: "none", borderRadius: 24, padding: "10px 28px",
      fontSize: 15, fontFamily: FONT, letterSpacing: 1,
      cursor: "pointer", transition: "background 0.2s", marginBottom: 4,
      opacity: saving ? 0.6 : 1,
    }}>
      {flash ? "メモした ✓" : saving ? "保存中..." : "メモする"}
    </button>
  );
}
function SavedCard({ item, onDelete }) {
  return (
    <div style={{ background: "#fdfaf7", border: "1px solid #ede5db", borderRadius: 10, padding: "14px 16px", marginBottom: 10, position: "relative", fontFamily: FONT }}>
      <button onClick={onDelete} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", cursor: "pointer", color: "#d0b8a0", fontSize: 16, padding: 0 }}>✕</button>
      {item.date && <div style={{ fontSize: 13, color: "#b8a090", marginBottom: 6 }}>{item.date}</div>}
      {item.reality && <div style={{ fontSize: 15, color: "#5a4030", marginBottom: 4 }}>{item.reality}</div>}
      {item.symptom && <div style={{ fontSize: 15, color: "#5a4030", marginBottom: 4 }}>{item.symptom}</div>}
      {item.text && <div style={{ fontSize: 15, color: "#5a4030", marginBottom: 4 }}>{item.text}</div>}
      {item.habit && <div style={{ fontSize: 15, color: "#5a4030", marginBottom: 4 }}>{item.habit}</div>}
      {item.emotion?.length > 0 && <div style={{ fontSize: 14, color: "#a08060" }}>{item.emotion.join("・")}</div>}
      {item.thought && <div style={{ fontSize: 14, color: "#8a7060", marginTop: 4 }}>想念：{item.thought}</div>}
      {item.origin && <div style={{ fontSize: 14, color: "#8a7060" }}>形成：{item.origin}</div>}
      {item.trigger && <div style={{ fontSize: 14, color: "#8a7060" }}>発動：{item.trigger}</div>}
      {item.mind && <div style={{ fontSize: 14, color: "#8a7060" }}>精神：{item.mind}</div>}
      {item.sleep && <div style={{ fontSize: 14, color: "#8a7060" }}>睡眠：{item.sleep}</div>}
      {item.moon && <div style={{ fontSize: 14, color: "#8a7060" }}>🌙 {item.moon}</div>}
      {item.pattern && <div style={{ fontSize: 14, color: "#8a7060" }}>パターン：{item.pattern}</div>}
      {item.worry && <div style={{ fontSize: 14, color: "#8a7060" }}>思考の癖：{item.worry}</div>}
    </div>
  );
}
function RecordList({ records, onDelete, loading }) {
  if (loading) return <div style={{ fontSize: 14, color: "#b8a090", padding: "16px 0", fontFamily: FONT }}>読み込み中...</div>;
  if (records.length === 0) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 13, color: "#b8a090", letterSpacing: 2, marginBottom: 12, fontFamily: FONT }}>これまでのメモ（{records.length}件）</div>
      {records.slice().reverse().map((r, i) => (
        <SavedCard key={i} item={r} onDelete={() => onDelete(records.length - 1 - i)} />
      ))}
    </div>
  );
}

// ── 同意・初期設定画面 ────────────────────────────────────────
function ConsentScreen({ onComplete }) {
  const [mode, setMode] = useState(null);
  const [clientId, setClientId] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState(1);

  const canProceed = step === 1 ? mode !== null : agreed && (mode === "local" || clientId.trim() !== "");

  const handleNext = () => {
    if (step === 1) { setStep(2); return; }
    const s = { mode, clientId: clientId.trim() || null };
    saveSettings(s);
    onComplete(s);
  };

  const card = (m, title, desc) => (
    <div onClick={() => setMode(m)} style={{
      border: mode === m ? "2px solid #c8a882" : "1.5px solid #e8dfd4",
      borderRadius: 14, padding: "20px 22px", marginBottom: 14,
      background: mode === m ? "#fdf6ee" : "#fdfaf7",
      cursor: "pointer", transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
          border: mode === m ? "5px solid #c8a882" : "2px solid #d0b8a0",
          transition: "all 0.2s",
        }} />
        <div style={{ fontSize: 16, color: "#4a3020", letterSpacing: 0.5 }}>{title}</div>
      </div>
      <div style={{ fontSize: 14, color: "#8a7060", lineHeight: 1.9, paddingLeft: 30 }}>{desc}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#faf6f1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", fontFamily: FONT }}>
      <div style={{ maxWidth: 480, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 12, letterSpacing: 5, color: "#c8a882", marginBottom: 6 }}>UNITAS</div>
          <div style={{ fontSize: 24, color: "#2c1e10", fontWeight: "normal", letterSpacing: 1 }}>Soul Journal</div>
          <div style={{ fontSize: 13, color: "#b8a090", marginTop: 6, letterSpacing: 1 }}>ふーん、くらいの感じで</div>
        </div>

        {step === 1 && (
          <>
            <div style={{ fontSize: 15, color: "#4a3828", lineHeight: 2, marginBottom: 28, textAlign: "center" }}>
              記録の保存方法を選んでください。<br />どちらを選んでも、記録の内容は変わりません。
            </div>
            {card("sync", "田中香代子と共有する（推奨）",
              <>記録が田中香代子に自動で届きます。<br />セッションで一緒に振り返ることができます。</>
            )}
            {card("local", "ご自分だけで記録・保存する",
              <>記録はこのブラウザ内にのみ保存されます。<br />Excelで出力してご自身で管理できます。</>
            )}
            <div style={{ height: 18 }} />
          </>
        )}

        {step === 2 && (
          <>
            {mode === "sync" && (
              <div style={{ marginBottom: 24 }}>
                <Label>田中香代子から伝えられたIDを入力してください</Label>
                <SmallNote>例：U-001　　※フルネームは入力しないでください</SmallNote>
                <InputField value={clientId} onChange={e => setClientId(e.target.value)} placeholder="例：U-001" />
              </div>
            )}
            <div style={{ background: "#f5f0ea", borderRadius: 12, padding: "18px 20px", marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: "#6a5040", lineHeight: 2.0 }}>
                {mode === "sync" ? (
                  <>
                    このSoul Journalに記録した内容は、<br />セッションの参考のため田中香代子に自動で届きます。<br /><br />
                    ・記録はクライアントIDで管理され、フルネームは使用しません<br />
                    ・データは田中香代子のGoogleアカウント内にのみ保存されます<br />
                    ・第三者への共有は行いません<br />
                    ・データの削除はいつでも申し出いただければ、速やかに全データを削除します
                  </>
                ) : (
                  <>
                    記録はこのブラウザ内にのみ保存されます。<br />田中香代子には自動では届きません。<br /><br />
                    ・Excelで出力してご自身で管理できます<br />
                    ・共有したい時はExcelを田中香代子に送ってください
                  </>
                )}
              </div>
            </div>
            <div onClick={() => setAgreed(!agreed)} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", marginBottom: 32 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                border: agreed ? "none" : "1.5px solid #d0b8a0",
                background: agreed ? "#c8a882" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
                {agreed && <span style={{ color: "#fff", fontSize: 14, lineHeight: 1 }}>✓</span>}
              </div>
              <div style={{ fontSize: 14, color: "#6a5040", lineHeight: 1.9 }}>上記の内容を確認し、同意します</div>
            </div>
          </>
        )}

        <button onClick={handleNext} disabled={!canProceed} style={{
          width: "100%", padding: "14px", borderRadius: 28,
          background: canProceed ? "#c8a882" : "#e8dfd4",
          color: canProceed ? "#fff" : "#b8a090",
          border: "none", fontSize: 16, fontFamily: FONT,
          letterSpacing: 1, cursor: canProceed ? "pointer" : "default",
          transition: "all 0.2s",
        }}>
          {step === 1 ? "次へ" : "Soul Journalをはじめる"}
        </button>
        {step === 2 && (
          <div onClick={() => setStep(1)} style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#b8a090", cursor: "pointer" }}>
            ← 戻る
          </div>
        )}
      </div>
    </div>
  );
}

function SectionA({ settings }) {
  const KEY = "soul-journal-a";
  const [reality, setReality] = useState("");
  const [emotion, setEmotion] = useState([]);
  const [otherEmotion, setOtherEmotion] = useState("");
  const [thought, setThought] = useState("");
  const [origin, setOrigin] = useState("");
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSaved(loadRecords(KEY)); setLoading(false); }, []);
  const toggleEmotion = (e) => setEmotion(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  const save = async () => {
    if (!reality.trim()) return;
    setSaving(true);
    const allEmotions = emotion.includes("その他") && otherEmotion.trim()
      ? [...emotion.filter(e => e !== "その他"), `その他：${otherEmotion.trim()}`] : emotion;
    const record = { reality, emotion: allEmotions, thought, origin, date: new Date().toLocaleDateString("ja-JP") };
    const newRecords = [...saved, record];
    saveRecords(KEY, newRecords);
    if (settings.mode === "sync") await sendToSheets(settings.clientId, "A_現実と想念", record);
    setSaved(newRecords);
    setReality(""); setEmotion([]); setOtherEmotion(""); setThought(""); setOrigin("");
    setSaving(false);
  };
  const deleteRecord = (idx) => {
    const nr = saved.filter((_, i) => i !== idx);
    saveRecords(KEY, nr); setSaved(nr);
  };

  return (
    <div>
      <Note>現実は単なる周波数の反映。良い悪いではなく、ただのサイン。ふーん、くらいで。</Note>
      <Label>① 現実（何が起きた？）</Label>
      <TextArea value={reality} onChange={e => setReality(e.target.value)} placeholder="例：また〇〇さんから（嫌なことを）言われた、など" />
      <Label>① 感情（その現実を見た時の自分のリアクション）</Label>
      <SmallNote>感情は「現実を見た時の反応」。想念（根本原因）とは別のものです。まず自分が何を感じたかだけを見てみてください。</SmallNote>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: emotion.includes("その他") ? 12 : 20 }}>
        {EMOTIONS.map(e => <Tag key={e} label={e} selected={emotion.includes(e)} onClick={() => toggleEmotion(e)} />)}
      </div>
      {emotion.includes("その他") && (
        <InputField value={otherEmotion} onChange={e => setOtherEmotion(e.target.value)} placeholder="感情を自由に書いてください" />
      )}
      <Label>② 想念（根本原因）——その感情を引き起こしている、自分の中の思い込みや信念は？</Label>
      <SmallNote>想念とは「〜でなければならない」「〜されるべき」「自分は〜だ」という深い信念のこと。感情の一歩奥にあるものです。</SmallNote>
      <TextArea value={thought} onChange={e => setThought(e.target.value)} placeholder="例：私は評価されなければ価値がない、など" />
      <Label>③ その想念はいつ何が起こって形成されたもの？</Label>
      <TextArea value={origin} onChange={e => setOrigin(e.target.value)} placeholder="例：小学生の頃、発表会で失敗して笑われた時、など" rows={2} />
      <SaveButton onClick={save} saving={saving} />
      <RecordList records={saved} onDelete={deleteRecord} loading={loading} />
    </div>
  );
}

function SectionB({ settings }) {
  const KEY = "soul-journal-b";
  const [text, setText] = useState("");
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSaved(loadRecords(KEY)); setLoading(false); }, []);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const record = { text, date: new Date().toLocaleDateString("ja-JP") };
    const newRecords = [...saved, record];
    saveRecords(KEY, newRecords);
    if (settings.mode === "sync") await sendToSheets(settings.clientId, "B_違和感", record);
    setSaved(newRecords); setText(""); setSaving(false);
  };
  const deleteRecord = (idx) => {
    const nr = saved.filter((_, i) => i !== idx);
    saveRecords(KEY, nr); setSaved(nr);
  };

  return (
    <div>
      <Note>
        違和感を放っておかない癖作り。説明できなくていい。「なんか変」でOK。<br />
        人に対してでも、場所に対してでも、食事に対してでも、対象はなんでもOK。<br />
        自分が何かしっくりこないまま続けているものを見逃さない練習です。
      </Note>
      <Label>違和感メモ</Label>
      <TextArea value={text} onChange={e => setText(e.target.value)}
        placeholder={"例：ある場所に来たらすごく怖い感じがした\n例：この人のとある表情に違和感を感じた\n例：この食べ物を食べてから何か体が変"} rows={4} />
      <SaveButton onClick={save} saving={saving} />
      <RecordList records={saved} onDelete={deleteRecord} loading={loading} />
    </div>
  );
}

function SectionC({ settings }) {
  const KEY = "soul-journal-c";
  const [habit, setHabit] = useState("");
  const [trigger, setTrigger] = useState("");
  const [origin, setOrigin] = useState("");
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSaved(loadRecords(KEY)); setLoading(false); }, []);

  const save = async () => {
    if (!habit.trim()) return;
    setSaving(true);
    const record = { habit, trigger, origin, date: new Date().toLocaleDateString("ja-JP") };
    const newRecords = [...saved, record];
    saveRecords(KEY, newRecords);
    if (settings.mode === "sync") await sendToSheets(settings.clientId, "C_言動の癖", record);
    setSaved(newRecords); setHabit(""); setTrigger(""); setOrigin(""); setSaving(false);
  };
  const deleteRecord = (idx) => {
    const nr = saved.filter((_, i) => i !== idx);
    saveRecords(KEY, nr); setSaved(nr);
  };

  return (
    <div>
      <Note>反射的な言動を観察する。責めなくていい。「あ、またやった」でOK。</Note>
      <Label>① 反射的にとってしまった言動</Label>
      <TextArea value={habit} onChange={e => setHabit(e.target.value)}
        placeholder={"例：相手が不機嫌そうだと、すぐ謝ってしまう\n例：頼まれごとをしそうな時に、咄嗟に断りたくなる"} />
      <Label>② どんな時に発動しやすい？</Label>
      <TextArea value={trigger} onChange={e => setTrigger(e.target.value)} placeholder="例：目上の人と1対1の時。自分に非がなくても。" rows={2} />
      <Label>③ その癖が生まれたきっかけとなった出来事</Label>
      <TextArea value={origin} onChange={e => setOrigin(e.target.value)}
        placeholder="例：これまで頼まれごとを引き受けて辛い思いをしてきたから、自己防衛のために頼まれごと＝断ろうとなった" rows={2} />
      <SaveButton onClick={save} saving={saving} />
      <RecordList records={saved} onDelete={deleteRecord} loading={loading} />
    </div>
  );
}

function SectionD({ settings }) {
  const KEY = "soul-journal-d";
  const [symptom, setSymptom] = useState("");
  const [mind, setMind] = useState("");
  const [env, setEnv] = useState("");
  const [sleep, setSleep] = useState("");
  const [food, setFood] = useState("");
  const [moon, setMoon] = useState("");
  const [menstrual, setMenstrual] = useState("");
  const [worry, setWorry] = useState("");
  const [pattern, setPattern] = useState("");
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSaved(loadRecords(KEY)); setLoading(false); }, []);

  const save = async () => {
    if (!symptom.trim()) return;
    setSaving(true);
    const record = { symptom, mind, env, sleep, food, moon, menstrual, worry, pattern, date: new Date().toLocaleDateString("ja-JP") };
    const newRecords = [...saved, record];
    saveRecords(KEY, newRecords);
    if (settings.mode === "sync") await sendToSheets(settings.clientId, "D_体調のサイン", record);
    setSaved(newRecords);
    setSymptom(""); setMind(""); setEnv(""); setSleep(""); setFood(""); setMoon(""); setMenstrual(""); setWorry(""); setPattern("");
    setSaving(false);
  };
  const deleteRecord = (idx) => {
    const nr = saved.filter((_, i) => i !== idx);
    saveRecords(KEY, nr); setSaved(nr);
  };

  return (
    <div>
      <Note>症状は自分の肉体をメンテナンスする最強のサイン。責めずに、ただ記録する。</Note>
      <Label>体調の変化（症状）</Label>
      <TextArea value={symptom} onChange={e => setSymptom(e.target.value)} placeholder="例：朝から頭が重い、胃がムカムカする" rows={2} />
      <Label>精神面の状態</Label>
      <TextArea value={mind} onChange={e => setMind(e.target.value)} placeholder="例：なんとなく不安。理由はわからない。" rows={2} />
      <Label>環境面の状態</Label>
      <TextArea value={env} onChange={e => setEnv(e.target.value)} placeholder="例：仕事が立て込んでいた。気温が急に下がった。" rows={2} />
      <Label>睡眠の状態</Label>
      <TextArea value={sleep} onChange={e => setSleep(e.target.value)} placeholder="例：〇〇月からあまり眠れない。" rows={2} />
      <Label>食事の状況（ここ2週間〜1ヶ月）</Label>
      <TextArea value={food} onChange={e => setFood(e.target.value)} placeholder="例：甘いものが増えていた。食欲が落ちていた。" rows={2} />
      <Label>月の満ち欠け</Label>
      <MoonTag moon={moon} setMoon={setMoon} />
      <Label>生理（月経）との関連</Label>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["関係あり", "関係なし"].map(opt => (
          <Tag key={opt} label={opt} selected={menstrual === opt} onClick={() => setMenstrual(menstrual === opt ? "" : opt)} />
        ))}
      </div>
      <Label>体調が悪い時に出てくる思考の癖</Label>
      <TextArea value={worry} onChange={e => setWorry(e.target.value)} placeholder="例：またこうなってしまった。治らなかったらどうしよう。" rows={2} />
      <Label>この体調不良はパターン化しているもの？</Label>
      <TextArea value={pattern} onChange={e => setPattern(e.target.value)} placeholder="例：満員電車に乗ると必ず起こる／出勤の朝に起こる" rows={2} />
      <SaveButton onClick={save} saving={saving} />
      <RecordList records={saved} onDelete={deleteRecord} loading={loading} />
    </div>
  );
}

async function exportToExcel() {
  const aR = loadRecords("soul-journal-a");
  const bR = loadRecords("soul-journal-b");
  const cR = loadRecords("soul-journal-c");
  const dR = loadRecords("soul-journal-d");
  const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
  const wb = XLSX.utils.book_new();
  const aData = [["日付", "現実", "感情", "想念（根本原因）", "想念の形成"]];
  aR.forEach(r => aData.push([r.date||"", r.reality||"", (r.emotion||[]).join("・"), r.thought||"", r.origin||""]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aData), "A_現実と想念");
  const bData = [["日付", "違和感メモ"]];
  bR.forEach(r => bData.push([r.date||"", r.text||""]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bData), "B_違和感");
  const cData = [["日付", "反射的な言動", "発動しやすい状況", "きっかけとなった出来事"]];
  cR.forEach(r => cData.push([r.date||"", r.habit||"", r.trigger||"", r.origin||""]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cData), "C_言動の癖");
  const dData = [["日付", "症状", "精神面", "環境面", "睡眠", "食事", "月の満ち欠け", "生理との関連", "思考の癖", "パターン化"]];
  dR.forEach(r => dData.push([r.date||"", r.symptom||"", r.mind||"", r.env||"", r.sleep||"", r.food||"", r.moon||"", r.menstrual||"", r.worry||"", r.pattern||""]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dData), "D_体調のサイン");
  const date = new Date().toLocaleDateString("ja-JP").replace(/\//g, "-");
  XLSX.writeFile(wb, `UNITAS_SoulJournal_${date}.xlsx`);
}

export default function SoulJournal() {
  const [tab, setTab] = useState("A");
  const [exporting, setExporting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const current = TABS.find(t => t.id === tab);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setLoadingSettings(false);
  }, []);

  const handleConsentComplete = (s) => { setSettings(s); };
  const handleReset = () => {
    saveSettings(null);
    setSettings(null);
    setShowResetConfirm(false);
  };
  const handleExport = async () => {
    setExporting(true);
    try { await exportToExcel(); } catch (e) { alert("エクスポートに失敗しました"); }
    finally { setExporting(false); }
  };

  if (loadingSettings) return (
    <div style={{ minHeight: "100vh", background: "#faf6f1", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ fontSize: 14, color: "#b8a090", letterSpacing: 2 }}>読み込み中...</div>
    </div>
  );

  if (!settings) return <ConsentScreen onComplete={handleConsentComplete} />;

  return (
    <div style={{ minHeight: "100vh", background: "#faf6f1", fontFamily: FONT, padding: "0 0 60px" }}>
      <div style={{ background: "#2c1e10", padding: "28px 24px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 12, letterSpacing: 5, color: "#c8a882", marginBottom: 6 }}>UNITAS</div>
        <div style={{ fontSize: 22, color: "#f5ede0", fontWeight: "normal", letterSpacing: 1 }}>Soul Journal</div>
        <div style={{ fontSize: 13, color: "#8a7060", marginTop: 6, letterSpacing: 1 }}>ふーん、くらいの感じで</div>
        <div onClick={() => setShowResetConfirm(!showResetConfirm)} title="タップして設定をリセット" style={{ marginTop: 10, display: "inline-block", padding: "3px 12px", borderRadius: 12, background: "rgba(200,168,130,0.15)", border: "1px solid rgba(200,168,130,0.3)", cursor: "pointer" }}>
          <span style={{ fontSize: 12, color: "#c8a882", letterSpacing: 1 }}>
            {settings.mode === "sync" ? `📡 共有モード　${settings.clientId}` : "🔒 ローカルモード"}
          </span>
          <span style={{ fontSize: 11, color: "#a08060", marginLeft: 6 }}>⟳</span>
        </div>
        {showResetConfirm && (
          <div style={{ marginTop: 10, background: "rgba(44,30,16,0.85)", border: "1px solid #c8a882", borderRadius: 12, padding: "14px 18px", display: "inline-block", textAlign: "left" }}>
            <div style={{ fontSize: 13, color: "#f5ede0", marginBottom: 10, lineHeight: 1.8, fontFamily: FONT }}>
              モード選択画面に戻りますか？<br />
              <span style={{ fontSize: 11, color: "#a08060" }}>※記録データは削除されません</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleReset} style={{
                background: "#c8a882", color: "#fff", border: "none", borderRadius: 20,
                padding: "6px 18px", fontSize: 12, fontFamily: FONT, cursor: "pointer",
              }}>リセットする</button>
              <button onClick={() => setShowResetConfirm(false)} style={{
                background: "transparent", color: "#c8a882", border: "1px solid #c8a882", borderRadius: 20,
                padding: "6px 18px", fontSize: 12, fontFamily: FONT, cursor: "pointer",
              }}>キャンセル</button>
            </div>
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <button onClick={handleExport} disabled={exporting} style={{
            background: "transparent", border: "1px solid #c8a882",
            borderRadius: 20, padding: "6px 18px", color: "#c8a882",
            fontSize: 13, fontFamily: FONT, letterSpacing: 1, cursor: "pointer",
            opacity: exporting ? 0.5 : 1,
          }}>
            {exporting ? "出力中..." : "📊 Excelで一覧を出力"}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", borderBottom: "1px solid #e8dfd4", background: "#fdfaf7", position: "sticky", top: 0, zIndex: 10 }}>
        {TABS.map((t, i) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "12px 4px 10px", border: "none", cursor: "pointer",
            borderRight: i < TABS.length - 1 ? "1px solid #e8dfd4" : "none",
            borderBottom: tab === t.id ? "2px solid #c8a882" : "2px solid transparent",
            background: tab === t.id ? "#fdf6ee" : "transparent",
            transition: "all 0.15s",
          }}>
            <div style={{ fontSize: 18, fontWeight: "bold", color: tab === t.id ? "#c8a882" : "#b8a090", fontFamily: FONT }}>{t.label}</div>
            <div style={{ fontSize: 11, color: "#2c1e10", letterSpacing: 0.3, marginTop: 3, fontFamily: FONT }}>{t.subtitle}</div>
          </button>
        ))}
      </div>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px 0" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, color: "#4a3020", fontWeight: "normal", letterSpacing: 0.5, fontFamily: FONT }}>{current.title}</div>
          <div style={{ fontSize: 13, color: "#b8a090", marginTop: 2, letterSpacing: 1, fontFamily: FONT }}>{current.subtitle}</div>
        </div>
        {tab === "A" && <SectionA settings={settings} />}
        {tab === "B" && <SectionB settings={settings} />}
        {tab === "C" && <SectionC settings={settings} />}
        {tab === "D" && <SectionD settings={settings} />}
      </div>
      <div style={{ textAlign: "center", marginTop: 40, fontSize: 12, color: "#c8b8a8", letterSpacing: 3, fontFamily: FONT }}>
        UNITAS Healing and Art
      </div>
    </div>
  );
}
