import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Animated, KeyboardAvoidingView, Platform,
  ScrollView, Image, Linking, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GOLD, SPACING, RADIUS, SHADOWS } from '../theme';
import { requestOtp, verifyOtp } from '../api';
import StarBackground from '../components/StarBackground';

const { width } = Dimensions.get('window');
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.39:3000';

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
function OtpBoxes({ value, onChange, theme, isDark }: {
  value: string; onChange: (v: string) => void; theme: any; isDark: boolean;
}) {
  const digits      = Array.from({ length: 6 }, (_, i) => value[i] || '');
  const inputRef    = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const cursorAnim  = useRef(new Animated.Value(1)).current;

  // Blink loop — only runs while focused
  useEffect(() => {
    if (focused) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      cursorAnim.setValue(1);
    }
  }, [focused]);

  // The box that will receive the next keystroke
  const activeIndex = Math.min(value.length, 5);

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.md }}>
        {digits.map((d, i) => {
          const isFilled = !!d;
          const isActive = focused && i === activeIndex && !isFilled;
          const isNext   = focused && i === activeIndex && isFilled && value.length === 6; // all filled

          return (
            <View key={i} style={{ position: 'relative' }}>
              {/* Outer glow ring for active box */}
              {isActive && (
                <Animated.View style={{
                  position: 'absolute', inset: -3,
                  borderRadius: RADIUS.md + 3,
                  borderWidth: 2,
                  borderColor: GOLD.primary,
                  opacity: cursorAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                  shadowColor: GOLD.primary,
                  shadowOpacity: 0.9,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 6,
                }} />
              )}

              <LinearGradient
                colors={
                  isFilled
                    ? [GOLD.dark, GOLD.primary]
                    : isActive
                      ? (isDark ? ['rgba(201,162,39,0.18)', 'rgba(201,162,39,0.10)'] : ['rgba(201,162,39,0.14)', 'rgba(201,162,39,0.08)'])
                      : (isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.02)'])
                }
                style={{
                  width: 44, height: 52, borderRadius: RADIUS.md,
                  borderWidth: isActive ? 1.5 : isFilled ? 0 : 1,
                  borderColor: isActive ? GOLD.primary : GOLD.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isFilled ? (
                  <Text style={{ color: '#1A0F00', fontSize: 22, fontWeight: '900' }}>{d}</Text>
                ) : isActive ? (
                  /* Blinking cursor bar instead of dot */
                  <Animated.View style={{
                    width: 2, height: 24, borderRadius: 1,
                    backgroundColor: GOLD.primary,
                    opacity: cursorAnim,
                  }} />
                ) : (
                  <Text style={{ color: GOLD.border, fontSize: 10, fontWeight: '900', opacity: 0.5 }}>•</Text>
                )}
              </LinearGradient>
            </View>
          );
        })}
      </View>

      {/* Hidden real input */}
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

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ row, index, theme, isDark }: {
  row: { icon: string; label: string; value: string; type: string };
  index: number; theme: any; isDark: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, delay: index * 70, useNativeDriver: true }).start();
  }, []);

  const isPhone = row.type === 'phone';
  const handleCall = () =>
    Linking.openURL(`tel:${row.value}`).catch(() => {});

  const card = (
    <LinearGradient colors={theme.gradients.card as any} style={IS.row}>
      <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={IS.bar} />
      <Text style={IS.icon}>{row.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={IS.label}>{row.label}</Text>
        <Text style={[IS.value, { color: isPhone ? GOLD.light : theme.text }]} numberOfLines={2}>{row.value}</Text>
      </View>
      {isPhone && (
        <View style={IS.callChip}>
          <Text style={IS.callChipText}>அழை</Text>
        </View>
      )}
    </LinearGradient>
  );

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }], marginBottom: SPACING.sm }}>
      {isPhone ? <TouchableOpacity onPress={handleCall} activeOpacity={0.8}>{card}</TouchableOpacity> : card}
    </Animated.View>
  );
}

const IS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: GOLD.border, overflow: 'hidden', minHeight: 64 },
  bar: { width: 3, alignSelf: 'stretch' },
  icon: { fontSize: 22, marginHorizontal: SPACING.md },
  label: { color: GOLD.primary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
  value: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  callChip: { backgroundColor: GOLD.primary, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5, marginRight: SPACING.sm },
  callChipText: { color: '#1A0F00', fontSize: 11, fontWeight: '800' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const { member, login, logout } = useAuth();
  const { showToast } = useToast();

  const [loginStep, setLoginStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const scaleAnim  = useRef(new Animated.Value(member ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 35, friction: 8, useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.06, duration: 2000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    if (member) {
      setImgError(false);
      scaleAnim.setValue(0.6);
      Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }).start();
    } else {
      setLoginStep('email');
      setEmail('');
      setOtp('');
      setConfirmingLogout(false);
    }
  }, [member]);

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
      if (res.success && res.member) await login(res.member);
      else showToast(res.message || 'OTP சரிபார்ப்பு தோல்வி', 'error');
    } catch (err: any) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message;
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

  const s = styles(theme, isDark);

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (member) {
    const imageUri = member.contentVersionId && !imgError
      ? `${BASE_URL}/api/member/image/${member.contentVersionId}` : null;

    const initials = member.name
      ? member.name.trim().split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase()).join('') : '?';

    const infoRows = [
      member.uprId       && { icon: '🪪', label: 'ID',       value: member.uprId,                type: 'text'  },
      member.phone       && { icon: '📞', label: 'தொலைபேசி',     value: member.phone,                type: 'phone' },
      member.email       && { icon: '📧', label: 'மின்னஞ்சல்',   value: member.email,                type: 'text'  },
      member.dateOfBirth && { icon: '🎂', label: 'பிறந்த நாள்',  value: formatDOB(member.dateOfBirth), type: 'text' },
      member.work        && { icon: '💼', label: 'தொழில்',        value: member.work,                 type: 'text'  },
      member.location    && { icon: '📍', label: 'இடம்',          value: member.location,             type: 'text'  },
    ].filter(Boolean) as Array<{ icon: string; label: string; value: string; type: string }>;

    return (
      <View style={s.root}>
        <StatusBar style={theme.statusBar} />
        <LinearGradient colors={theme.gradients.background as any} style={StyleSheet.absoluteFill} />
        <StarBackground />

        <ScrollView contentContainerStyle={s.profileScroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <LinearGradient
            colors={isDark ? ['rgba(28,20,8,0.98)', 'rgba(15,10,2,0.90)'] : ['rgba(255,252,240,0.99)', 'rgba(255,243,210,0.94)']}
            style={s.heroBanner}
          >
            <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light, GOLD.primary, GOLD.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2, width: '100%' }} />

            <View style={s.heroContent}>
              {/* Avatar */}
              <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: SPACING.md }}>
                <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light, GOLD.primary, GOLD.dark]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={s.avatarGlow}>
                  <View style={[s.avatarRing, { backgroundColor: isDark ? '#0F0A02' : '#FFF8EC' }]}>
                    {imageUri
                      ? <Image source={{ uri: imageUri }} style={s.avatar} onError={() => setImgError(true)} />
                      : <LinearGradient colors={[isDark ? '#1C1408' : '#FFF0CC', isDark ? '#2E1F08' : '#FFE08A']} style={s.avatarFallback}>
                          <Text style={s.initials}>{initials}</Text>
                        </LinearGradient>
                    }
                  </View>
                </LinearGradient>
              </Animated.View>

              <Animated.View style={{ alignItems: 'center', opacity: fadeAnim }}>
                <Text style={s.name}>{member.name}</Text>
                {member.position
                  ? <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.posBadge}>
                      <Text style={s.posText}>✦  {member.position}  ✦</Text>
                    </LinearGradient>
                  : null}
                {member.department ? <Text style={s.dept}>{member.department}</Text> : null}
              </Animated.View>
            </View>

            <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, marginTop: SPACING.md }} />
          </LinearGradient>

          {/* ── Info rows ── */}
          <Animated.View style={{ padding: SPACING.md, paddingTop: SPACING.lg, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {infoRows.map((row, i) => (
              <InfoRow key={row.label} row={row} index={i} theme={theme} isDark={isDark} />
            ))}
          </Animated.View>

          {/* ── Logout ── */}
          <View style={{ paddingHorizontal: SPACING.md, paddingBottom: 100, marginTop: SPACING.sm }}>
            <LinearGradient colors={['transparent', GOLD.border, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, marginBottom: SPACING.lg }} />

            {confirmingLogout ? (
              /* Inline confirm — no Alert.alert */
              <View style={s.confirmBox}>
                <Text style={s.confirmTitle}>வெளியேற விரும்புகிறீர்களா?</Text>
                <View style={s.confirmRow}>
                  <TouchableOpacity
                    onPress={doLogout}
                    activeOpacity={0.8}
                    style={s.confirmYes}
                  >
                    <Text style={s.confirmYesText}>ஆம், வெளியேறு</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setConfirmingLogout(false)}
                    activeOpacity={0.8}
                    style={s.confirmNo}
                  >
                    <Text style={[s.confirmNoText, { color: theme.textSecondary }]}>இல்லை</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setConfirmingLogout(true)}
                activeOpacity={0.7}
                style={s.logoutBtn}
              >
                <View style={[s.logoutInner, { borderColor: isDark ? 'rgba(255,80,80,0.35)' : 'rgba(220,38,38,0.3)' }]}>
                  <Text style={{ fontSize: 18 }}>🚪</Text>
                  <Text style={[s.logoutText, { color: isDark ? '#FF6B6B' : '#DC2626' }]}>வெளியேறு</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN FLOW
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />
      <LinearGradient colors={theme.gradients.background as any} style={StyleSheet.absoluteFill} />
      <StarBackground />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.loginScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {loginStep === 'email' ? (
            /* ── EMAIL STEP ── */
            <Animated.View style={[s.loginCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <LinearGradient colors={theme.gradients.card as any} style={s.loginCardGrad}>
                <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light, GOLD.primary, GOLD.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl }} />

                <View style={s.loginBody}>
                  <Animated.View style={[s.emblemWrap, { transform: [{ scale: pulseAnim }] }]}>
                    <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={s.emblem}>
                      <Text style={{ fontSize: 40 }}>⚜️</Text>
                    </LinearGradient>
                  </Animated.View>

                  <Text style={s.loginTitle}>உறுப்பினர் உள்நுழைவு</Text>
                  <Text style={s.loginSub}>கணேசபுரம்</Text>

                  <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, marginVertical: SPACING.lg }} />

                  <Text style={s.fieldLabel}>மின்னஞ்சல் முகவரி</Text>
                  <View style={s.inputRow}>
                    <Text style={{ fontSize: 18, marginRight: SPACING.sm }}>📧</Text>
                    <TextInput
                      style={s.input}
                      placeholder="உங்கள் பதிவு மின்னஞ்சல்"
                      placeholderTextColor={theme.textMuted}
                      value={email} onChangeText={setEmail}
                      keyboardType="email-address" autoCapitalize="none"
                      autoCorrect={false} returnKeyType="send"
                      onSubmitEditing={handleRequestOtp}
                    />
                  </View>

                  <TouchableOpacity onPress={handleRequestOtp} disabled={loading} activeOpacity={0.85} style={s.btn}>
                    <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnInner}>
                      {loading ? <ActivityIndicator color="#1A0F00" /> : <Text style={s.btnText}>OTP அனுப்பு  →</Text>}
                    </LinearGradient>
                  </TouchableOpacity>

                  <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, marginTop: SPACING.xl }} />
                  <Text style={s.footerNote}>✦  கணேசபுரம்  ✦</Text>
                </View>
              </LinearGradient>
            </Animated.View>

          ) : (
            /* ── OTP STEP ── */
            <Animated.View style={[s.loginCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <LinearGradient colors={theme.gradients.card as any} style={s.loginCardGrad}>
                <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light, GOLD.primary, GOLD.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl }} />

                <View style={s.loginBody}>
                  {/* Lock icon */}
                  <Animated.View style={[s.emblemWrap, { transform: [{ scale: pulseAnim }] }]}>
                    <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={s.emblem}>
                      <Text style={{ fontSize: 40 }}>🔐</Text>
                    </LinearGradient>
                  </Animated.View>

                  <Text style={s.loginTitle}>OTP சரிபார்ப்பு</Text>
                  <Text style={s.loginSub}>கணேசபுரம்</Text>

                  <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, marginTop: SPACING.md }} />

                  {/* Email hint */}
                  <View style={s.emailHint}>
                    <Text style={s.emailHintText}>📩  {email}</Text>
                    <Text style={s.emailHintSub}>க்கு 6-இலக்க OTP அனுப்பப்பட்டது</Text>
                  </View>

                  <Text style={[s.fieldLabel, { textAlign: 'center', marginBottom: SPACING.md }]}>OTP குறியீட்டை உள்ளிடவும்</Text>

                  {/* Visual OTP boxes */}
                  <OtpBoxes value={otp} onChange={setOtp} theme={theme} isDark={isDark} />

                  <TouchableOpacity onPress={handleVerifyOtp} disabled={loading || otp.length < 6} activeOpacity={0.85} style={[s.btn, { opacity: otp.length < 6 ? 0.5 : 1 }]}>
                    <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnInner}>
                      {loading ? <ActivityIndicator color="#1A0F00" /> : <Text style={s.btnText}>சரிபார் & உள்நுழை  ✓</Text>}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Resend / back */}
                  <TouchableOpacity onPress={() => { setLoginStep('email'); setOtp(''); setOtpToken(''); }} style={{ alignItems: 'center', marginTop: SPACING.md }}>
                    <Text style={{ color: GOLD.primary, fontSize: 13, fontWeight: '600', letterSpacing: 0.3 }}>← மின்னஞ்சல் மாற்று</Text>
                  </TouchableOpacity>

                  <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, marginTop: SPACING.xl }} />
                  <Text style={s.footerNote}>✦  கணேசபுரம்  ✦</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = (theme: any, isDark: boolean) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },

  // Profile
  profileScroll: { flexGrow: 1 },
  heroBanner: { alignItems: 'center', paddingBottom: SPACING.lg },
  heroContent: { alignItems: 'center', paddingTop: SPACING.xl, paddingHorizontal: SPACING.lg },
  avatarGlow: { padding: 3, borderRadius: 78, ...SHADOWS.gold },
  avatarRing: { padding: 4, borderRadius: 74 },
  avatar: { width: 128, height: 128, borderRadius: 64 },
  avatarFallback: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center' },
  initials: { color: GOLD.primary, fontSize: 46, fontWeight: '900' },
  name: { color: theme.text, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: SPACING.sm, letterSpacing: -0.3 },
  posBadge: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: 8, marginBottom: SPACING.sm },
  posText: { color: '#1A0F00', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  dept: { color: theme.textSecondary, fontSize: 13, fontWeight: '500' },
  logoutBtn: { borderRadius: RADIUS.lg },
  logoutInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: RADIUS.lg, borderWidth: 1.5, gap: 10 },
  logoutText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  confirmBox: { backgroundColor: isDark ? 'rgba(30,10,10,0.9)' : 'rgba(255,240,240,0.95)', borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: isDark ? 'rgba(255,80,80,0.4)' : 'rgba(220,38,38,0.35)', padding: SPACING.lg },
  confirmTitle: { color: isDark ? '#FCA5A5' : '#DC2626', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: SPACING.md },
  confirmRow: { flexDirection: 'row', gap: SPACING.sm },
  confirmYes: { flex: 1, backgroundColor: isDark ? '#DC2626' : '#DC2626', borderRadius: RADIUS.full, paddingVertical: 13, alignItems: 'center' },
  confirmYesText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  confirmNo: { flex: 1, borderRadius: RADIUS.full, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: GOLD.border },
  confirmNoText: { fontWeight: '700', fontSize: 14 },

  // Login shared
  loginScroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.md },
  loginCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: GOLD.border, ...SHADOWS.gold },
  loginCardGrad: { borderRadius: RADIUS.xl },
  loginBody: { padding: SPACING.lg },
  emblemWrap: { alignSelf: 'center', marginBottom: SPACING.md },
  emblem: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', ...SHADOWS.gold },
  loginTitle: { color: theme.text, fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  loginSub: { color: GOLD.primary, fontSize: 11, fontWeight: '700', textAlign: 'center', letterSpacing: 2 },
  fieldLabel: { color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 13, marginBottom: SPACING.md, borderWidth: 1, borderColor: GOLD.border },
  input: { flex: 1, color: theme.text, fontSize: 15 },
  btn: { borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: SPACING.sm },
  btnInner: { paddingVertical: 15, alignItems: 'center', borderRadius: RADIUS.full },
  btnText: { color: '#1A0F00', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },

  // OTP step extras
  emailHint: { backgroundColor: isDark ? 'rgba(201,162,39,0.1)' : 'rgba(201,162,39,0.08)', borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm, marginBottom: SPACING.lg, borderWidth: 1, borderColor: GOLD.border, alignItems: 'center' },
  emailHintText: { color: GOLD.primary, fontSize: 13, fontWeight: '700' },
  emailHintSub: { color: theme.textMuted, fontSize: 11, marginTop: 4 },
  footerNote: { color: GOLD.primary, fontSize: 11, textAlign: 'center', marginTop: SPACING.md, letterSpacing: 3, opacity: 0.6 },
});
