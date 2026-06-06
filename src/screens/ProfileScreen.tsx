import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useAuth, MemberProfile } from '../context/AuthContext';
import { GOLD, SPACING, RADIUS, FONTS, SHADOWS } from '../theme';
import { requestOtp, verifyOtp } from '../api';

type Step = 'email' | 'otp' | 'profile';

export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const { member, isLoggedIn, login, logout } = useAuth();

  const [step, setStep] = useState<Step>(isLoggedIn ? 'profile' : 'email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 35, friction: 8, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 35, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [step]);

  useEffect(() => {
    if (isLoggedIn) setStep('profile');
  }, [isLoggedIn]);

  const handleRequestOtp = async () => {
    if (!email.trim()) return Alert.alert('', 'மின்னஞ்சல் உள்ளிடவும்');
    setLoading(true);
    try {
      const result = await requestOtp(email.trim().toLowerCase());
      if (result.success) {
        fadeAnim.setValue(0);
        slideAnim.setValue(40);
        setStep('otp');
        Alert.alert('OTP அனுப்பப்பட்டது', `${email} க்கு OTP அனுப்பப்பட்டது`);
      } else {
        Alert.alert('பிழை', result.message || 'OTP அனுப்ப முடியவில்லை');
      }
    } catch (e: any) {
      Alert.alert('பிழை', 'சேவையகத்துடன் இணைக்க முடியவில்லை');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) return Alert.alert('', '6 இலக்க OTP உள்ளிடவும்');
    setLoading(true);
    try {
      const result = await verifyOtp(email.trim().toLowerCase(), otp.trim());
      if (!result.success) {
        Alert.alert('தவறான OTP', result.message || 'OTP சரியில்லை');
        return;
      }

      await login({ ...result.member, contentVersionId: result.member.profileImageUrl ? result.member.id : null });

      fadeAnim.setValue(0);
      slideAnim.setValue(40);
      setStep('profile');
    } catch {
      Alert.alert('பிழை', 'இணைப்பு பிழை. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('வெளியேறு', 'வெளியேற விரும்புகிறீர்களா?', [
      { text: 'ரத்து', style: 'cancel' },
      { text: 'வெளியேறு', style: 'destructive', onPress: async () => { await logout(); setStep('email'); setEmail(''); setOtp(''); } },
    ]);
  };

  const s = styles(theme, isDark);
  const initials = member?.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style={theme.statusBar} />
      <LinearGradient colors={theme.gradients.background as [string, string, string]} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerSub}>UPR நட்பு சாம்ராஜ்யம்</Text>
          <Text style={s.headerTitle}>{step === 'profile' ? 'சுயவிவரம்' : 'உள்நுழைவு'}</Text>
        </View>

        {/* Gold divider */}
        <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.divider} />

        {/* EMAIL STEP */}
        {step === 'email' && (
          <Animated.View style={[s.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <LinearGradient colors={theme.gradients.card as [string, string]} style={s.formInner}>
              <LinearGradient colors={theme.gradients.gold as [string, string, string]} style={s.logoCircle}>
                <Text style={s.logoEmoji}>🏛️</Text>
              </LinearGradient>
              <Text style={s.formTitle}>வரவேற்கிறோம்</Text>
              <Text style={s.formSubtitle}>உங்கள் பதிவு செய்யப்பட்ட மின்னஞ்சலை உள்ளிடவும்</Text>

              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>மின்னஞ்சல்</Text>
                <TextInput
                  style={[s.input, { color: theme.text, borderColor: GOLD.border }]}
                  placeholder="உங்கள் மின்னஞ்சல்"
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity onPress={handleRequestOtp} disabled={loading} style={s.primaryBtn} activeOpacity={0.85}>
                <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light]} style={s.primaryBtnInner}>
                  {loading ? <ActivityIndicator color="#1A1020" /> : <Text style={s.primaryBtnText}>OTP அனுப்பவும்</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* OTP STEP */}
        {step === 'otp' && (
          <Animated.View style={[s.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <LinearGradient colors={theme.gradients.card as [string, string]} style={s.formInner}>
              <LinearGradient colors={theme.gradients.gold as [string, string, string]} style={s.logoCircle}>
                <Text style={s.logoEmoji}>🔐</Text>
              </LinearGradient>
              <Text style={s.formTitle}>OTP சரிபார்ப்பு</Text>
              <Text style={s.formSubtitle}>{email} க்கு அனுப்பப்பட்ட 6 இலக்க OTP</Text>

              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>OTP</Text>
                <TextInput
                  style={[s.input, s.otpInput, { color: theme.text, borderColor: GOLD.border }]}
                  placeholder="000000"
                  placeholderTextColor={theme.textMuted}
                  value={otp}
                  onChangeText={t => setOtp(t.replace(/\D/g, '').substring(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity onPress={handleVerifyOtp} disabled={loading} style={s.primaryBtn} activeOpacity={0.85}>
                <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light]} style={s.primaryBtnInner}>
                  {loading ? <ActivityIndicator color="#1A1020" /> : <Text style={s.primaryBtnText}>உள்நுழைய</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setStep('email'); setOtp(''); }} style={s.backBtn}>
                <Text style={s.backBtnText}>← மின்னஞ்சல் மாற்றவும்</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleRequestOtp} disabled={loading} style={s.resendBtn}>
                <Text style={s.resendBtnText}>OTP மீண்டும் அனுப்பவும்</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* PROFILE STEP */}
        {step === 'profile' && member && (
          <Animated.View style={[s.profileCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <LinearGradient colors={theme.gradients.card as [string, string]} style={s.profileInner}>

              {/* Profile Image */}
              <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light]} style={s.profileImageBorder}>
                {member.contentVersionId ? (
                  <Image source={{ uri: member.profileImageUrl || '' }} style={s.profileImage} />
                ) : (
                  <LinearGradient colors={['#2A2540', '#1A1625']} style={s.profileImage}>
                    <Text style={s.profileInitials}>{initials}</Text>
                  </LinearGradient>
                )}
              </LinearGradient>

              {/* Name + Position */}
              <Text style={s.profileName}>{member.name}</Text>
              {member.position && (
                <View style={s.positionBadge}>
                  <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={s.positionBadgeInner}>
                    <Text style={s.positionText}>{member.position}</Text>
                  </LinearGradient>
                </View>
              )}
              {member.uprId && <Text style={s.profileId}>{member.uprId}</Text>}

              {/* Divider */}
              <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.divider, { marginVertical: SPACING.md }]} />

              {/* Details */}
              <View style={s.detailsGrid}>
                <ProfileDetail icon="📧" label="மின்னஞ்சல்" value={member.email} theme={theme} />
                {member.department && <ProfileDetail icon="🏢" label="துறை" value={member.department} theme={theme} />}
                {member.username && <ProfileDetail icon="👤" label="பயனர் பெயர்" value={member.username} theme={theme} />}
              </View>

              {/* Logout */}
              <TouchableOpacity onPress={handleLogout} style={s.logoutBtn} activeOpacity={0.8}>
                <Text style={s.logoutText}>வெளியேறு</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProfileDetail({ icon, label, value, theme }: { icon: string; label: string; value: string; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md, gap: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: GOLD.subtle, borderWidth: 1, borderColor: GOLD.border, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 }}>{label.toUpperCase()}</Text>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    scroll: { flexGrow: 1, paddingBottom: SPACING.xxl },
    header: { paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
    headerSub: { color: GOLD.primary, fontSize: 12, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
    headerTitle: { color: theme.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    divider: { height: 1, marginHorizontal: SPACING.lg, marginBottom: SPACING.lg },
    formCard: { paddingHorizontal: SPACING.md },
    formInner: {
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: GOLD.border,
      alignItems: 'center',
      ...SHADOWS.gold,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.md,
      ...SHADOWS.gold,
    },
    logoEmoji: { fontSize: 36 },
    formTitle: { color: theme.text, fontSize: 22, fontWeight: '800', marginBottom: 6 },
    formSubtitle: { color: theme.textMuted, fontSize: 13, textAlign: 'center', marginBottom: SPACING.lg, lineHeight: 20 },
    inputWrap: { width: '100%', marginBottom: SPACING.md },
    inputLabel: { color: GOLD.primary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
    input: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      borderWidth: 1.5,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: 14,
      fontSize: 16,
      width: '100%',
    },
    otpInput: { textAlign: 'center', fontSize: 28, fontWeight: '800', letterSpacing: 12 },
    primaryBtn: { width: '100%', borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: SPACING.sm },
    primaryBtnInner: { paddingVertical: 16, alignItems: 'center', borderRadius: RADIUS.full },
    primaryBtnText: { color: '#1A1020', fontSize: 16, fontWeight: '800' },
    backBtn: { paddingVertical: 8 },
    backBtnText: { color: theme.textMuted, fontSize: 13 },
    resendBtn: { paddingVertical: 8 },
    resendBtnText: { color: GOLD.primary, fontSize: 13, fontWeight: '600' },
    profileCard: { paddingHorizontal: SPACING.md },
    profileInner: {
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: GOLD.border,
      alignItems: 'center',
      ...SHADOWS.gold,
    },
    profileImageBorder: {
      width: 112,
      height: 112,
      borderRadius: 56,
      padding: 3,
      marginBottom: SPACING.md,
      ...SHADOWS.gold,
    },
    profileImage: {
      width: 106,
      height: 106,
      borderRadius: 53,
      alignItems: 'center',
      justifyContent: 'center',
    } as any,
    profileInitials: { color: GOLD.light, fontSize: 42, fontWeight: '800' },
    profileName: { color: theme.text, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    positionBadge: { borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 8 },
    positionBadgeInner: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: RADIUS.full },
    positionText: { color: '#1A1020', fontSize: 13, fontWeight: '700' },
    profileId: { color: GOLD.primary, fontSize: 13, fontWeight: '600', marginBottom: SPACING.sm },
    detailsGrid: { width: '100%', marginBottom: SPACING.md },
    logoutBtn: {
      width: '100%',
      borderRadius: RADIUS.full,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: 'rgba(220,38,38,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(220,38,38,0.3)',
    },
    logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
  });
