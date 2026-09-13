import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Animated, KeyboardAvoidingView, Platform,
  ScrollView, Image, Linking, RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useRefreshContext } from '../context/RefreshContext';
import ScreenHeader from '../components/ScreenHeader';
import { ACCENT, SPACING, RADIUS, TYPE, FONT_FAMILY } from '../theme';
import { requestOtp, verifyOtp, imageUrl, logError } from '../api';

const DANGER = '#F87171';

type LoginStep = 'email' | 'otp';

function formatDOB(raw: string | null): string {
  if (!raw) return '';
  try {
    const [y, m, d] = raw.split('-');
    const months = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
    return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
  } catch { return raw; }
}

// ── OTP digit boxes ───────────────────────────────────────────────────────────
function OtpBoxes({ value, onChange, theme }: {
  value: string; onChange: (v: string) => void; theme: any;
}) {
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const activeIndex = Math.min(value.length, 5);

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.md }}>
        {digits.map((d, i) => {
          const isFilled = !!d;
          const isActive = focused && i === activeIndex && !isFilled;
          return (
            <View
              key={i}
              style={{
                width: 46, height: 54, borderRadius: RADIUS.sm,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: isFilled ? ACCENT.tintSoft : theme.surface,
                borderWidth: 1.5,
                borderColor: isActive ? ACCENT.primary : isFilled ? ACCENT.border : 'transparent',
              }}
            >
              <Text style={{ fontSize: 21, fontFamily: FONT_FAMILY.semibold, color: isFilled ? theme.text : theme.textMuted }}>
                {d || ''}
              </Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={v => onChange(v.replace(/\D/g, '').slice(0, 6))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={6}
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
      />
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { member, login, logout, refreshMember } = useAuth();
  const { register, unregister } = useRefreshContext();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshMember();
    setRefreshing(false);
  }, [refreshMember]);

  useEffect(() => {
    register('Profile', onRefresh);
    return () => unregister('Profile');
  }, [onRefresh, register, unregister]);

  const [loginStep, setLoginStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (member) {
      setImgError(false);
    } else {
      setLoginStep('email');
      setEmail('');
      setOtp('');
      setConfirmingLogout(false);
    }
  }, [member]);

  const RESEND_COOLDOWN = 30;

  const startResendCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current!); timerRef.current = null; return 0; }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (loginStep === 'otp') startResendCountdown();
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [loginStep]);

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      const res = await requestOtp(email.trim().toLowerCase());
      if (res.success) {
        setOtpToken(res.token || '');
        setOtp('');
        startResendCountdown();
        showToast('OTP மீண்டும் அனுப்பப்பட்டது', 'success');
      } else {
        showToast(res.message || 'OTP அனுப்ப முடியவில்லை', 'error');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message;
      showToast(message || 'OTP அனுப்ப தோல்வி', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!email.trim()) return showToast('மின்னஞ்சல் முகவரி உள்ளிடவும்', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return showToast('சரியான மின்னஞ்சல் முகவரி உள்ளிடவும்', 'error');
    setLoading(true);
    try {
      const res = await requestOtp(email.trim().toLowerCase());
      if (res.success) { setOtpToken(res.token || ''); setLoginStep('otp'); }
      else showToast(res.message || 'OTP அனுப்ப முடியவில்லை', 'error');
    } catch (err: any) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message;
      logError('OTP Request Failed', `Status:${status ?? 'N/A'} | ${message ?? err?.message ?? 'Unknown'}`);
      if (status === 404)
        showToast('இந்த மின்னஞ்சல் பதிவு செய்யப்படவில்லை.\nதயவுசெய்து சரியான மின்னஞ்சலை உள்ளிடவும்.', 'error');
      else if (message)
        showToast(message, 'error');
      else
        showToast('சேவையகத்துடன் இணைப்பு தோல்வி. மீண்டும் முயற்சிக்கவும்.', 'error');
    }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return showToast('6 இலக்க OTP குறியீட்டை உள்ளிடவும்', 'error');
    setLoading(true);
    try {
      const res = await verifyOtp(email.trim().toLowerCase(), otp, otpToken);
      if (res.success && res.member) {
        await login(res.member, res.sessionToken);
        const firstName = res.member.name?.split(' ')[0] || res.member.name;
        const welcome = res.member.type === 'UPR'
          ? `Welcome to UPR, ${firstName}!`
          : `Hi ${firstName}, welcome to G One App`;
        showToast(welcome, 'success');
      } else {
        showToast(res.message || 'OTP சரிபார்ப்பு தோல்வி', 'error');
      }
    } catch (err: any) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message;
      logError('OTP Verify Failed', `Status:${status ?? 'N/A'} | ${message ?? err?.message ?? 'Unknown'}`);
      if (status === 401)
        showToast('OTP சரியில்லை அல்லது காலாவதியாகிவிட்டது.', 'error');
      else if (message)
        showToast(message, 'error');
      else
        showToast('சேவையகத்துடன் இணைப்பு தோல்வி. மீண்டும் முயற்சிக்கவும்.', 'error');
    }
    finally { setLoading(false); }
  };

  const doLogout = () => {
    setConfirmingLogout(false);
    logout();
  };

  const s = styles(theme);

  // ── Signed in ───────────────────────────────────────────────────────────────
  if (member) {
    const imageUri = member.contentVersionId && !imgError
      ? imageUrl(member.contentVersionId) : null;

    const initials = member.name
      ? member.name.trim().split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase()).join('') : '?';

    const rows = [
      member.phone       && { icon: 'call-outline',     label: 'தொலைபேசி',   value: member.phone,                  phone: true },
      member.email       && { icon: 'mail-outline',     label: 'மின்னஞ்சல்', value: member.email },
      member.dateOfBirth && { icon: 'gift-outline',     label: 'பிறந்த நாள்', value: formatDOB(member.dateOfBirth) },
      member.work        && { icon: 'briefcase-outline',label: 'தொழில்',      value: member.work },
      member.location    && { icon: 'location-outline', label: 'இடம்',        value: member.location },
    ].filter(Boolean) as Array<{ icon: any; label: string; value: string; phone?: boolean }>;

    return (
      <View style={s.root}>
        <StatusBar style={theme.statusBar} />
        <ScreenHeader title="சுயவிவரம்" onBack={() => navigation.goBack()} />
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT.primary} />}
        >
          <Animated.View style={{ opacity: fade }}>

            {/* Identity */}
            <View style={s.identity}>
              {imageUri
                ? <Image source={{ uri: imageUri }} style={s.avatar} onError={() => setImgError(true)} />
                : <View style={[s.avatar, s.avatarFallback]}><Text style={s.initials}>{initials}</Text></View>}

              <Text style={s.name}>{member.name}</Text>
              {member.position ? (
                <View style={s.posChip}><Text style={s.posText}>{member.position}</Text></View>
              ) : null}
              {member.department ? <Text style={s.dept}>{member.department}</Text> : null}
              {member.uprId ? <Text style={s.uprId}>ID · {member.uprId}</Text> : null}
            </View>

            {/* Details */}
            <View style={s.card}>
              {rows.map((row, i) => {
                const content = (
                  <View style={[s.row, i > 0 && s.rowBorder]}>
                    <Ionicons name={row.icon} size={18} color={theme.textMuted} style={{ width: 26 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowLabel}>{row.label}</Text>
                      <Text style={s.rowValue} numberOfLines={2}>{row.value}</Text>
                    </View>
                    {row.phone && <Ionicons name="chevron-forward" size={17} color={ACCENT.primary} />}
                  </View>
                );
                return row.phone ? (
                  <TouchableOpacity key={row.label} activeOpacity={0.6} onPress={() => Linking.openURL(`tel:${row.value}`).catch(() => {})}>
                    {content}
                  </TouchableOpacity>
                ) : <View key={row.label}>{content}</View>;
              })}
            </View>

            {/* Logout */}
            {confirmingLogout ? (
              <View style={s.confirm}>
                <Text style={s.confirmTitle}>வெளியேற விரும்புகிறீர்களா?</Text>
                <View style={s.confirmRow}>
                  <TouchableOpacity onPress={doLogout} activeOpacity={0.8} style={s.confirmYes}>
                    <Text style={s.confirmYesText}>ஆம், வெளியேறு</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setConfirmingLogout(false)} activeOpacity={0.8} style={s.confirmNo}>
                    <Text style={[s.confirmNoText, { color: theme.textSecondary }]}>இல்லை</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setConfirmingLogout(true)} activeOpacity={0.6} style={s.logout}>
                <Ionicons name="log-out-outline" size={19} color={DANGER} />
                <Text style={s.logoutText}>வெளியேறு</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ── Signed out ──────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />
      <ScreenHeader title="உள்நுழைவு" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.loginScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fade }}>

            <View style={s.emblem}>
              <Ionicons name={loginStep === 'email' ? 'person-circle-outline' : 'shield-checkmark-outline'} size={34} color={ACCENT.primary} />
            </View>

            <Text style={s.loginTitle}>
              {loginStep === 'email' ? 'உறுப்பினர் உள்நுழைவு' : 'OTP சரிபார்ப்பு'}
            </Text>
            <Text style={s.loginSub}>
              {loginStep === 'email'
                ? 'உங்கள் பதிவு மின்னஞ்சலை உள்ளிடவும்'
                : `${email} க்கு 6-இலக்க குறியீடு அனுப்பப்பட்டது`}
            </Text>

            {loginStep === 'email' ? (
              <>
                <View style={s.inputRow}>
                  <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
                  <TextInput
                    style={s.input}
                    placeholder="name@example.com"
                    placeholderTextColor={theme.textMuted}
                    value={email} onChangeText={setEmail}
                    keyboardType="email-address" autoCapitalize="none"
                    autoCorrect={false} returnKeyType="send"
                    onSubmitEditing={handleRequestOtp}
                  />
                </View>

                <TouchableOpacity onPress={handleRequestOtp} disabled={loading} activeOpacity={0.8} style={s.btn}>
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.btnText}>OTP அனுப்பு</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <OtpBoxes value={otp} onChange={setOtp} theme={theme} />

                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                  activeOpacity={0.8}
                  style={[s.btn, { opacity: otp.length < 6 ? 0.45 : 1 }]}
                >
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.btnText}>உள்நுழை</Text>}
                </TouchableOpacity>

                <View style={s.linkRow}>
                  <TouchableOpacity onPress={() => { setLoginStep('email'); setOtp(''); setOtpToken(''); }} activeOpacity={0.6}>
                    <Text style={s.link}>மின்னஞ்சல் மாற்று</Text>
                  </TouchableOpacity>

                  {resendTimer > 0 ? (
                    <Text style={s.timer}>{resendTimer}s</Text>
                  ) : resendLoading ? (
                    <ActivityIndicator color={ACCENT.primary} size="small" />
                  ) : (
                    <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.6}>
                      <Text style={s.link}>மீண்டும் அனுப்பு</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  identity: { alignItems: 'center', paddingVertical: SPACING.md, gap: 6 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT.tintSoft },
  initials: { fontSize: 32, fontFamily: FONT_FAMILY.semibold, color: ACCENT.primary },
  name: { ...TYPE.title, color: theme.text, marginTop: 6, textAlign: 'center' },
  posChip: { backgroundColor: ACCENT.tintSoft, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4 },
  posText: { ...TYPE.caption, color: ACCENT.primary },
  dept: { ...TYPE.caption, color: theme.textSecondary },
  uprId: { ...TYPE.caption, color: theme.textMuted },

  card: {
    marginTop: SPACING.md,
    backgroundColor: theme.card,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    paddingHorizontal: SPACING.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider },
  rowLabel: { ...TYPE.caption, color: theme.textMuted, marginBottom: 2 },
  rowValue: { ...TYPE.bodyStrong, color: theme.text },

  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: SPACING.lg, paddingVertical: 15,
    borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, borderColor: DANGER,
  },
  logoutText: { ...TYPE.bodyStrong, color: DANGER },

  confirm: {
    marginTop: SPACING.lg, padding: SPACING.md,
    borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, borderColor: DANGER,
  },
  confirmTitle: { ...TYPE.bodyStrong, color: DANGER, textAlign: 'center', marginBottom: SPACING.md },
  confirmRow: { flexDirection: 'row', gap: SPACING.sm },
  confirmYes: { flex: 1, backgroundColor: DANGER, borderRadius: RADIUS.sm, paddingVertical: 12, alignItems: 'center' },
  confirmYesText: { ...TYPE.bodyStrong, color: '#FFFFFF' },
  confirmNo: {
    flex: 1, borderRadius: RADIUS.sm, paddingVertical: 12, alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
  },
  confirmNoText: { ...TYPE.bodyStrong },

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
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center', minHeight: 50,
  },
  btnText: { ...TYPE.bodyStrong, color: '#FFFFFF' },

  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.md },
  link: { ...TYPE.label, color: ACCENT.primary },
  timer: { ...TYPE.label, color: theme.textMuted },
});
