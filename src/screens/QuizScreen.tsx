import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, AppState, BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import ScreenHeader from '../components/ScreenHeader';
import { ACCENT, SPACING, RADIUS, TYPE, FONT_FAMILY } from '../theme';
import {
  quizLogin, fetchQuizQuestions, submitQuiz, reportQuizWarning, fetchAnswerSheet,
  registerQuizUser, fetchQuizResults, logError,
} from '../api';

type Stage = 'login' | 'register' | 'running' | 'done' | 'sheet' | 'board';

interface BoardRow {
  rank: number; id: string; name: string; userId: string | null;
  score: number; finalScore: number | null; warningCount: number;
}

interface Question { id: string; number: number; question: string; options: string[] }
interface SheetRow extends Question { selectedAnswer: string; correctAnswer: string; isCorrect: boolean }

function mmss(total: number) {
  const m = Math.floor(total / 60), s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function QuizScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [stage, setStage] = useState<Stage>('login');
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const [memberId, setMemberId] = useState('');
  const [quizName, setQuizName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [warnings, setWarnings] = useState(0);

  const [result, setResult] = useState<{ score: number; total: number; attempted: number } | null>(null);
  const [sheet, setSheet] = useState<SheetRow[] | null>(null);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDone, setRegDone] = useState('');

  const [quizId, setQuizId] = useState('');
  const [published, setPublished] = useState(false);
  const [board, setBoard] = useState<BoardRow[] | null>(null);

  const submittedRef = useRef(false);
  const memberIdRef = useRef('');
  const answersRef = useRef<Record<string, string>>({});
  const warningsRef = useRef(0);

  useEffect(() => { memberIdRef.current = memberId; }, [memberId]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { warningsRef.current = warnings; }, [warnings]);

  const finish = useCallback(async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setBusy(true);
    try {
      const res = await submitQuiz(memberIdRef.current, answersRef.current, warningsRef.current);
      if (res.success) {
        setResult({ score: res.score, total: res.total, attempted: res.attempted });
        setStage('done');
        if (auto) showToast('நேரம் முடிந்தது — தானாக சமர்ப்பிக்கப்பட்டது', 'info');
      } else {
        submittedRef.current = false;
        showToast(res.message || 'சமர்ப்பிப்பு தோல்வி', 'error');
      }
    } catch (err: any) {
      submittedRef.current = false;
      const message = err?.response?.data?.message;
      logError('Quiz Submit Failed', message ?? err?.message ?? 'unknown');
      showToast(message || 'சமர்ப்பிப்பு தோல்வி', 'error');
    } finally { setBusy(false); }
  }, [showToast]);

  // Countdown — auto-submits at zero so a walked-away device still records.
  useEffect(() => {
    if (stage !== 'running') return;
    const t = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(t); finish(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [stage, finish]);

  // Anti-cheat: leaving the app mid-quiz counts as a warning, mirroring the
  // tab-switch detection on the web quiz. Recorded immediately so a crash or a
  // lost connection cannot erase it.
  useEffect(() => {
    if (stage !== 'running') return;
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        setWarnings(w => w + 1);
        reportQuizWarning(memberIdRef.current);
      }
    });
    return () => sub.remove();
  }, [stage]);

  // Block hardware back while a quiz is live — otherwise the attempt is lost.
  useEffect(() => {
    if (stage !== 'running') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      showToast('வினாடி வினாவை முடிக்கவும்', 'error');
      return true;
    });
    return () => sub.remove();
  }, [stage, showToast]);

  const doLogin = async () => {
    if (!userId.trim() || !code.trim()) {
      return showToast('பயனர் பெயர் மற்றும் குறியீடு தேவை', 'error');
    }
    setBusy(true);
    try {
      const res = await quizLogin(userId.trim(), code.trim());
      if (!res.success) return showToast(res.message || 'உள்நுழைவு தோல்வி', 'error');

      setMemberId(res.member.id);
      setQuizName(res.quiz.name ?? '');
      setQuizId(res.quiz.id ?? '');
      setPublished(!!res.quiz.resultPublished);

      if (res.member.isSubmitted) {
        if (res.quiz.resultPublished) {
          const sheetRes = await fetchAnswerSheet(res.member.id);
          if (sheetRes.success) {
            setSheet(sheetRes.sheet);
            setResult({
              score: sheetRes.attendee.score,
              total: sheetRes.sheet.length,
              attempted: sheetRes.sheet.filter((r: SheetRow) => r.selectedAnswer).length,
            });
            setStage('sheet');
            return;
          }
        }
        setResult({ score: res.member.score ?? 0, total: 0, attempted: 0 });
        setStage('done');
        return;
      }

      const qs = await fetchQuizQuestions(res.quiz.id);
      if (!qs.success || !qs.questions.length) {
        return showToast('கேள்விகள் இல்லை', 'error');
      }
      setQuestions(qs.questions);
      setSeconds(Math.max(1, Number(res.quiz.duration) || 10) * 60);
      setIndex(0);
      setAnswers({});
      submittedRef.current = false;
      setStage('running');
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      logError('Quiz Login Failed', `Status:${status ?? 'N/A'} | ${message ?? err?.message}`);
      showToast(message || 'உள்நுழைவு தோல்வி', 'error');
    } finally { setBusy(false); }
  };

  const doRegister = async () => {
    if (!regName.trim()) return showToast('பெயரை உள்ளிடவும்', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      return showToast('சரியான மின்னஞ்சல் உள்ளிடவும்', 'error');
    }
    setBusy(true);
    try {
      const res = await registerQuizUser(regName.trim(), regEmail.trim().toLowerCase());
      if (res.success) {
        setRegDone(res.message || 'பதிவு பெறப்பட்டது');
        setRegName(''); setRegEmail('');
      } else {
        showToast(res.message || 'பதிவு தோல்வி', 'error');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message;
      logError('Quiz Register Failed', message ?? err?.message ?? 'unknown');
      showToast(message || 'பதிவு தோல்வி', 'error');
    } finally { setBusy(false); }
  };

  const openBoard = async () => {
    setBusy(true);
    try {
      const res = await fetchQuizResults(quizId);
      if (res.success && res.published) {
        setBoard(res.results);
        setStage('board');
      } else {
        showToast('முடிவுகள் இன்னும் வெளியிடப்படவில்லை', 'info');
      }
    } catch (err: any) {
      showToast('தரவரிசை ஏற்ற முடியவில்லை', 'error');
    } finally { setBusy(false); }
  };

  const s = styles(theme);
  const answeredCount = Object.keys(answers).length;

  // ── Login ──────────────────────────────────────────────────────────────────
  if (stage === 'login') {
    return (
      <View style={s.root}>
        <StatusBar style={theme.statusBar} />
        <ScreenHeader title="வினாடி வினா" onBack={() => navigation.goBack()} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.loginScroll} keyboardShouldPersistTaps="handled">
            <View style={s.emblem}>
              <Ionicons name="help-circle-outline" size={34} color={ACCENT.primary} />
            </View>
            <Text style={s.loginTitle}>வினாடி வினா உள்நுழைவு</Text>
            <Text style={s.loginSub}>நிர்வாகி வழங்கிய பயனர் பெயர் மற்றும் குறியீடு</Text>

            <View style={s.inputRow}>
              <Ionicons name="person-outline" size={18} color={theme.textMuted} />
              <TextInput
                style={s.input} placeholder="பயனர் பெயர்" placeholderTextColor={theme.textMuted}
                value={userId} onChangeText={setUserId} autoCapitalize="none" autoCorrect={false}
              />
            </View>
            <View style={s.inputRow}>
              <Ionicons name="key-outline" size={18} color={theme.textMuted} />
              <TextInput
                style={s.input} placeholder="குறியீடு" placeholderTextColor={theme.textMuted}
                value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false}
                keyboardType="number-pad" returnKeyType="go" onSubmitEditing={doLogin}
              />
            </View>

            <TouchableOpacity onPress={doLogin} disabled={busy} activeOpacity={0.8} style={s.btn}>
              {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.btnText}>தொடங்கு</Text>}
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>அல்லது</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={() => { setStage('register'); setRegDone(''); }}
              activeOpacity={0.7}
              style={s.ghostBtn}
            >
              <Ionicons name="person-add-outline" size={17} color={ACCENT.primary} />
              <Text style={s.ghostBtnText}>புதிய பதிவு</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── Register ───────────────────────────────────────────────────────────────
  if (stage === 'register') {
    return (
      <View style={s.root}>
        <StatusBar style={theme.statusBar} />
        <ScreenHeader title="புதிய பதிவு" onBack={() => setStage('login')} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.loginScroll} keyboardShouldPersistTaps="handled">
            {regDone ? (
              <View style={s.regDone}>
                <Ionicons name="mail-unread-outline" size={40} color="#34D399" />
                <Text style={s.resultTitle}>பதிவு பெறப்பட்டது</Text>
                <Text style={s.loginSub}>{regDone}</Text>
                <TouchableOpacity onPress={() => setStage('login')} activeOpacity={0.8} style={s.btn}>
                  <Text style={s.btnText}>உள்நுழைவுக்கு திரும்பு</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={s.emblem}>
                  <Ionicons name="person-add-outline" size={32} color={ACCENT.primary} />
                </View>
                <Text style={s.loginTitle}>வினாடி வினா பதிவு</Text>
                <Text style={s.loginSub}>
                  நிர்வாகி ஒப்புதலுக்குப் பிறகு உங்கள் பயனர் பெயரும் குறியீடும் மின்னஞ்சலில் வரும்
                </Text>

                <View style={s.inputRow}>
                  <Ionicons name="person-outline" size={18} color={theme.textMuted} />
                  <TextInput
                    style={s.input} placeholder="முழு பெயர்" placeholderTextColor={theme.textMuted}
                    value={regName} onChangeText={setRegName} autoCorrect={false}
                  />
                </View>
                <View style={s.inputRow}>
                  <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
                  <TextInput
                    style={s.input} placeholder="மின்னஞ்சல்" placeholderTextColor={theme.textMuted}
                    value={regEmail} onChangeText={setRegEmail}
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                    returnKeyType="go" onSubmitEditing={doRegister}
                  />
                </View>

                <TouchableOpacity onPress={doRegister} disabled={busy} activeOpacity={0.8} style={s.btn}>
                  {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.btnText}>பதிவு செய்</Text>}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────
  if (stage === 'board') {
    const medal = (r: number) =>
      r === 1 ? '#F2B233' : r === 2 ? '#A8B3C0' : r === 3 ? '#CE8250' : null;

    return (
      <View style={s.root}>
        <StatusBar style={theme.statusBar} />
        <ScreenHeader title="தரவரிசை" onBack={() => setStage(sheet ? 'sheet' : 'done')} />
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {(board ?? []).map(row => {
            const tone = medal(row.rank);
            const me = row.id === memberId;
            return (
              <View key={row.id} style={[s.boardRow, me && s.boardRowMe]}>
                <View style={[s.rankChip, tone ? { backgroundColor: tone } : undefined]}>
                  <Text style={[s.rankText, tone ? { color: '#FFFFFF' } : undefined]}>{row.rank}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.boardName} numberOfLines={1}>
                    {row.name}{me ? ' · நீங்கள்' : ''}
                  </Text>
                  {row.userId ? <Text style={s.boardUser}>{row.userId}</Text> : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.boardScore}>{row.finalScore ?? row.score}</Text>
                  {row.warningCount > 0 && (
                    <Text style={s.boardWarn}>{row.warningCount} எச்சரிக்கை</Text>
                  )}
                </View>
              </View>
            );
          })}
          {!board?.length && <Text style={s.resultSub}>முடிவுகள் இல்லை</Text>}
        </ScrollView>
      </View>
    );
  }

  // ── Running ────────────────────────────────────────────────────────────────
  if (stage === 'running') {
    const q = questions[index];
    const low = seconds <= 60;

    return (
      <View style={s.root}>
        <StatusBar style={theme.statusBar} />

        <View style={s.quizBar}>
          <View style={[s.timer, low && s.timerLow]}>
            <Ionicons name="time-outline" size={15} color={low ? '#F87171' : ACCENT.primary} />
            <Text style={[s.timerText, low && { color: '#F87171' }]}>{mmss(seconds)}</Text>
          </View>
          <Text style={s.progress}>{index + 1} / {questions.length}</Text>
          {warnings > 0 && (
            <View style={s.warn}>
              <Ionicons name="alert-circle-outline" size={14} color="#F2B233" />
              <Text style={s.warnText}>{warnings}</Text>
            </View>
          )}
        </View>

        <View style={s.track}>
          <View style={[s.trackFill, { width: `${((index + 1) / questions.length) * 100}%` }]} />
        </View>

        <ScrollView contentContainerStyle={s.qScroll} showsVerticalScrollIndicator={false}>
          <Text style={s.qNumber}>கேள்வி {index + 1}</Text>
          <Text style={s.qText}>{q.question}</Text>

          {q.options.map(opt => {
            const on = answers[q.id] === opt;
            return (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.7}
                onPress={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                style={[s.option, on && s.optionOn]}
              >
                <View style={[s.radio, on && s.radioOn]}>
                  {on && <View style={s.radioDot} />}
                </View>
                <Text style={[s.optionText, on && { color: theme.text }]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={s.navBar}>
          <TouchableOpacity
            onPress={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            activeOpacity={0.7}
            style={[s.navBtn, index === 0 && { opacity: 0.35 }]}
          >
            <Ionicons name="chevron-back" size={18} color={theme.text} />
            <Text style={s.navText}>முந்தைய</Text>
          </TouchableOpacity>

          {index === questions.length - 1 ? (
            <TouchableOpacity onPress={() => finish(false)} disabled={busy} activeOpacity={0.8} style={s.submitBtn}>
              {busy ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={s.submitText}>சமர்ப்பி ({answeredCount}/{questions.length})</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIndex(i => Math.min(questions.length - 1, i + 1))} activeOpacity={0.7} style={s.navBtn}>
              <Text style={s.navText}>அடுத்து</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── Result / answer sheet ──────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />
      <ScreenHeader title={quizName || 'முடிவு'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.resultCard}>
          <Ionicons name="checkmark-circle" size={44} color="#34D399" />
          <Text style={s.resultTitle}>சமர்ப்பிக்கப்பட்டது</Text>
          {result && result.total > 0 ? (
            <>
              <Text style={s.score}>{result.score}<Text style={s.scoreTotal}> / {result.total}</Text></Text>
              <Text style={s.resultSub}>
                {result.attempted} கேள்விகளுக்கு பதில் · {warnings || 0} எச்சரிக்கை
              </Text>
            </>
          ) : (
            <Text style={s.resultSub}>முடிவுகள் வெளியிடப்பட்டதும் காணலாம்</Text>
          )}
        </View>

        {sheet && (
          <>
            <Text style={s.sheetHead}>விடைத்தாள்</Text>
            {sheet.map(row => (
              <View key={row.id} style={s.sheetCard}>
                <View style={s.sheetTop}>
                  <Text style={s.sheetNum}>கேள்வி {row.number}</Text>
                  <Ionicons
                    name={row.isCorrect ? 'checkmark-circle' : 'close-circle'}
                    size={17}
                    color={row.isCorrect ? '#34D399' : '#F87171'}
                  />
                </View>
                <Text style={s.sheetQ}>{row.question}</Text>
                <View style={s.sheetAnswers}>
                  <Text style={s.sheetLabel}>உங்கள் பதில்</Text>
                  <Text style={[s.sheetValue, { color: row.isCorrect ? '#34D399' : '#F87171' }]}>
                    {row.selectedAnswer || '—'}
                  </Text>
                  {!row.isCorrect && (
                    <>
                      <Text style={[s.sheetLabel, { marginTop: 6 }]}>சரியான பதில்</Text>
                      <Text style={[s.sheetValue, { color: '#34D399' }]}>{row.correctAnswer}</Text>
                    </>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {published && (
          <TouchableOpacity onPress={openBoard} disabled={busy} activeOpacity={0.8} style={s.btn}>
            {busy ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={s.btnText}>தரவரிசை பார்க்க</Text>}
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={s.doneBtn}>
          <Text style={s.doneBtnText}>முடிந்தது</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },

  loginScroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  emblem: {
    alignSelf: 'center', width: 68, height: 68, borderRadius: 34,
    backgroundColor: ACCENT.tintSoft, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  loginTitle: { ...TYPE.title, color: theme.text, textAlign: 'center' },
  loginSub: { ...TYPE.caption, color: theme.textMuted, textAlign: 'center', marginTop: 6, marginBottom: SPACING.lg },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.surface, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: SPACING.sm,
  },
  input: { flex: 1, color: theme.text, ...TYPE.body, paddingVertical: 0 },
  btn: {
    backgroundColor: ACCENT.primary, borderRadius: RADIUS.md,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center', minHeight: 50, marginTop: 4,
  },
  btnText: { ...TYPE.bodyStrong, color: '#FFFFFF' },

  quizBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingTop: SPACING.xl, paddingBottom: SPACING.sm,
  },
  timer: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: ACCENT.tintSoft, borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  timerLow: { backgroundColor: 'rgba(248,113,113,0.12)' },
  timerText: { ...TYPE.bodyStrong, fontSize: 14, color: ACCENT.primary },
  progress: { ...TYPE.label, color: theme.textMuted, flex: 1, textAlign: 'center' },
  warn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(242,178,51,0.14)', borderRadius: RADIUS.full,
    paddingHorizontal: 9, paddingVertical: 5,
  },
  warnText: { ...TYPE.caption, color: '#F2B233' },

  track: { height: 3, backgroundColor: theme.surface, marginHorizontal: SPACING.md, borderRadius: 2 },
  trackFill: { height: 3, backgroundColor: ACCENT.primary, borderRadius: 2 },

  qScroll: { padding: SPACING.md, paddingBottom: SPACING.xl },
  qNumber: { ...TYPE.caption, color: ACCENT.primary, marginBottom: 6 },
  qText: { ...TYPE.body, fontSize: 17, lineHeight: 26, fontFamily: FONT_FAMILY.semibold, color: theme.text, marginBottom: SPACING.md },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, paddingVertical: 15, marginBottom: SPACING.sm,
  },
  optionOn: { borderColor: ACCENT.primary, backgroundColor: ACCENT.tintSoft },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5,
    borderColor: theme.textMuted, alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { borderColor: ACCENT.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT.primary },
  optionText: { ...TYPE.body, color: theme.textSecondary, flex: 1 },

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm,
    padding: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 14 },
  navText: { ...TYPE.label, color: theme.text },
  submitBtn: {
    backgroundColor: ACCENT.primary, borderRadius: RADIUS.md,
    paddingVertical: 14, paddingHorizontal: 22, minWidth: 150, alignItems: 'center',
  },
  submitText: { ...TYPE.bodyStrong, color: '#FFFFFF' },

  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.md },
  resultCard: {
    alignItems: 'center', gap: 6, paddingVertical: SPACING.lg,
    backgroundColor: theme.card, borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
  },
  resultTitle: { ...TYPE.heading, color: theme.text },
  score: { fontSize: 42, lineHeight: 48, fontFamily: FONT_FAMILY.bold, color: ACCENT.primary },
  scoreTotal: { fontSize: 20, color: theme.textMuted },
  resultSub: { ...TYPE.caption, color: theme.textMuted, textAlign: 'center' },

  sheetHead: { ...TYPE.heading, color: theme.text },
  sheetCard: {
    backgroundColor: theme.card, borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    padding: SPACING.md,
  },
  sheetTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sheetNum: { ...TYPE.caption, color: theme.textMuted },
  sheetQ: { ...TYPE.body, color: theme.text },
  sheetAnswers: {
    marginTop: SPACING.sm, paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider,
  },
  sheetLabel: { ...TYPE.caption, fontSize: 10, color: theme.textMuted },
  sheetValue: { ...TYPE.bodyStrong, fontSize: 14, marginTop: 1 },

  doneBtn: {
    borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
  },
  doneBtnText: { ...TYPE.bodyStrong, color: theme.text },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: SPACING.md },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.divider },
  dividerText: { ...TYPE.caption, color: theme.textMuted },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: RADIUS.md, paddingVertical: 14,
    borderWidth: 1, borderColor: ACCENT.border,
  },
  ghostBtnText: { ...TYPE.bodyStrong, color: ACCENT.primary },
  regDone: { alignItems: 'center', gap: 10 },

  boardRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.card, borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    padding: SPACING.sm, marginBottom: 8,
  },
  boardRowMe: { borderColor: ACCENT.primary, backgroundColor: ACCENT.tintSoft },
  rankChip: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: theme.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { ...TYPE.bodyStrong, fontSize: 13, color: theme.textSecondary },
  boardName: { ...TYPE.bodyStrong, color: theme.text },
  boardUser: { ...TYPE.caption, color: theme.textMuted, marginTop: 1 },
  boardScore: { ...TYPE.heading, color: ACCENT.primary },
  boardWarn: { ...TYPE.caption, fontSize: 10, color: '#F2B233' },
});
