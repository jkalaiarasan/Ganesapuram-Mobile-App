import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Animated, Image, TextInput, Dimensions,
  RefreshControl, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { GOLD, SPACING, RADIUS, SHADOWS, FONT_FAMILY } from '../theme';
import { fetchMemberList } from '../api';
import StarBackground from '../components/StarBackground';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://ganesapuram-mobile-app-server.vercel.app/';

interface Member {
  id: string; name: string; email?: string; uprId?: string;
  position?: string; department?: string; phone?: string | null; contentVersionId?: string;
}

function MemberCard({ member, index, showDeptPos }: { member: Member; index: number; showDeptPos: boolean }) {
  const { theme, isDark } = useTheme();
  const anim     = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 400,
      delay: (index % 12) * 50,
      useNativeDriver: true,
    }).start();
  }, [index]);

  const onPressIn  = () => Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true }).start();

  const imageUri = member.contentVersionId && !imgError
    ? `${BASE_URL}/api/member/image/${member.contentVersionId}` : null;

  const initials = member.name
    ? member.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?';

  const handleCall = () => {
    if (member.phone) Linking.openURL(`tel:${member.phone}`);
  };

  const s = cardStyles(theme, isDark);

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
        { scale: pressAnim },
      ],
      marginBottom: SPACING.sm,
    }}>
      <TouchableOpacity activeOpacity={0.9} onPressIn={onPressIn} onPressOut={onPressOut}>
        <LinearGradient colors={theme.gradients.card as any} style={s.card}>
          {/* Gold left accent bar */}
          <LinearGradient
            colors={[GOLD.dark, GOLD.primary, GOLD.light, GOLD.primary, GOLD.dark]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={s.leftBar}
          />

          {/* Avatar */}
          <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={s.avatarRing}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={s.avatar} onError={() => setImgError(true)} />
            ) : (
              <LinearGradient
                colors={isDark ? ['#1A1A1A', '#222222'] : ['#F8F8F8', '#F0F0F0']}
                style={s.avatarFallback}
              >
                <Text style={s.initials}>{initials}</Text>
              </LinearGradient>
            )}
          </LinearGradient>

          {/* Info */}
          <View style={s.info}>
            <Text style={s.name} numberOfLines={1}>{member.name}</Text>

            {showDeptPos && member.position ? (
              <View style={s.posTag}>
                <Text style={s.posText} numberOfLines={1}>✦ {member.position}</Text>
              </View>
            ) : null}

            <View style={s.metaRow}>
              {showDeptPos && member.department ? (
                <Text style={s.meta} numberOfLines={1}>{member.department}</Text>
              ) : null}
              {showDeptPos && member.department && member.uprId ? (
                <Text style={[s.meta, { color: GOLD.border, marginHorizontal: 4 }]}>•</Text>
              ) : null}
              {member.uprId ? (
                <Text style={[s.meta, { color: GOLD.dark }]}>#{member.uprId}</Text>
              ) : null}
            </View>
          </View>

          {/* Call button */}
          {member.phone ? (
            <TouchableOpacity onPress={handleCall} activeOpacity={0.75} style={s.callBtn}>
              <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={s.callBtnInner}>
                <Text style={s.callIcon}>📞</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MembersScreen() {
  const { theme, isDark } = useTheme();
  const { member: authMember, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const isUPR = isLoggedIn && authMember?.type === 'UPR';

  const [members,  setMembers]  = useState<Member[]>([]);
  const [filtered, setFiltered] = useState<Member[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,   setSearch]   = useState('');
  const [error,    setError]    = useState('');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 35, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await fetchMemberList();
      if (data.success) { setMembers(data.members); setFiltered(data.members); }
      else setError('உறுப்பினர்கள் பட்டியல் கிடைக்கவில்லை');
    } catch (e: any) {
      console.error('MembersScreen load error:', e.message);
      setError('சேவையகத்துடன் இணைப்பு தோல்வி');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    let list = isUPR ? members : [...members].sort((a, b) => a.name.localeCompare(b.name));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        m.position?.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q) ||
        m.uprId?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [search, members, isUPR]);

  const s = styles(theme, isDark);

  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />
      <LinearGradient colors={theme.gradients.background as any} style={StyleSheet.absoluteFill} />
      <StarBackground />

      {/* Header */}
      <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={theme.gradients.header as any} style={[s.headerBg, { paddingTop: insets.top + 8 }]}>
          <View style={s.headerInner}>
            <Text style={s.headerTitle}>உறுப்பினர்கள்</Text>
            <Text style={s.headerCount}>{members.length} பேர்</Text>
          </View>
          <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, marginBottom: SPACING.sm }} />
          <View style={s.searchWrap}>
            <Text style={{ color: GOLD.primary, marginRight: 8, fontSize: 16 }}>🔍</Text>
            <TextInput
              style={s.searchInput} placeholder="தேடுங்கள்..." placeholderTextColor={theme.textMuted}
              value={search} onChangeText={setSearch} autoCapitalize="none" autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={{ color: GOLD.primary, fontSize: 16, paddingLeft: 8 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={GOLD.primary} size="large" />
          <Text style={[s.infoText, { marginTop: 12 }]}>ஏற்றுகிறது...</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🌐</Text>
          <Text style={s.infoText}>{error}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); load(); }} style={s.retryBtn}>
            <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={s.retryBtnInner}>
              <Text style={{ color: '#1A0F00', fontFamily: FONT_FAMILY.extrabold }}>மீண்டும் முயற்சி</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD.primary} />}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>👥</Text>
              <Text style={s.infoText}>"{search}" - தேடல் முடிவு இல்லை</Text>
            </View>
          }
          renderItem={({ item, index }) => <MemberCard member={item} index={index} showDeptPos={isUPR} />}
        />
      )}
    </View>
  );
}

const cardStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: GOLD.border,
    overflow: 'hidden', minHeight: 80, ...SHADOWS.card,
  },
  leftBar:      { width: 3, alignSelf: 'stretch' },
  avatarRing:   { padding: 2.5, borderRadius: 36, marginHorizontal: SPACING.md, flexShrink: 0 },
  avatar:       { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  initials:     { color: GOLD.primary, fontSize: 18, fontFamily: FONT_FAMILY.black },
  info:         { flex: 1, paddingVertical: SPACING.md, paddingRight: SPACING.sm },
  name:         { color: theme.text, fontSize: 15, fontFamily: FONT_FAMILY.extrabold, marginBottom: 4 },
  posTag:       { alignSelf: 'flex-start', backgroundColor: GOLD.subtle, borderRadius: RADIUS.full, paddingVertical: 3, paddingHorizontal: 8, borderWidth: 1, borderColor: GOLD.border, marginBottom: 4 },
  posText:      { color: GOLD.primary, fontSize: 10, fontFamily: FONT_FAMILY.bold, letterSpacing: 0.3 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  meta:         { color: theme.textMuted, fontSize: 11, fontFamily: FONT_FAMILY.medium },
  callBtn:      { marginRight: SPACING.md, flexShrink: 0 },
  callBtnInner: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  callIcon:     { fontSize: 18 },
});

const styles = (theme: any, isDark: boolean) => StyleSheet.create({
  root:        { flex: 1, backgroundColor: theme.background },
  header:      { zIndex: 10 },
  headerBg:    { paddingTop: 50, paddingHorizontal: SPACING.md, paddingBottom: 0 },
  headerInner: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: SPACING.sm },
  headerTitle: { color: theme.text, fontSize: 22, fontFamily: FONT_FAMILY.black },
  headerCount: { color: theme.textMuted, fontSize: 12, fontFamily: FONT_FAMILY.medium },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 10, marginBottom: SPACING.md, borderWidth: 1, borderColor: GOLD.border },
  searchInput: { flex: 1, color: theme.text, fontSize: 14, fontFamily: FONT_FAMILY.regular },
  listContent: { padding: SPACING.md, paddingBottom: 100 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  infoText:    { color: theme.textSecondary, fontSize: 14, fontFamily: FONT_FAMILY.regular, textAlign: 'center' },
  retryBtn:    { marginTop: SPACING.md, borderRadius: RADIUS.full, overflow: 'hidden' },
  retryBtnInner: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: RADIUS.full },
});
