import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Animated, Image, TextInput,
  RefreshControl, Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useRefreshContext } from '../context/RefreshContext';
import { ACCENT, SPACING, RADIUS, TYPE, FONT_FAMILY } from '../theme';
import { fetchMemberList, imageUrl, logError } from '../api';

interface Member {
  id: string; name: string; email?: string;
  position?: string; department?: string; phone?: string | null;
  work?: string | null; location?: string | null; contentVersionId?: string;
  lastSeen?: string | null;
}

const ONLINE_WINDOW_MS = 2 * 60 * 1000; // heartbeat is 60s — within 2 min counts as online
const ONLINE_GREEN = '#34D399';

function presenceInfo(lastSeen: string | null | undefined, now: number): { online: boolean; label: string } | null {
  if (!lastSeen) return null;
  const diff = now - new Date(lastSeen).getTime();
  if (Number.isNaN(diff) || diff < 0) return null;
  if (diff < ONLINE_WINDOW_MS) return { online: true, label: 'Online' };
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return { online: false, label: `${mins}m` };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { online: false, label: `${hours}h` };
  const days = Math.floor(hours / 24);
  if (days <= 30) return { online: false, label: `${days}d` };
  return null; // last seen over a month ago — show nothing
}

function MemberRow({ member, showDeptPos, now }: { member: Member; showDeptPos: boolean; now: number }) {
  const { theme } = useTheme();
  const [imgError, setImgError] = useState(false);

  const imageUri = member.contentVersionId && !imgError
    ? imageUrl(member.contentVersionId) : null;

  const initials = member.name
    ? member.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?';

  const presence = presenceInfo(member.lastSeen, now);
  const s = rowStyles(theme);

  // Build one subtitle line instead of stacking four muted rows.
  const subtitle = [
    showDeptPos ? member.position : null,
    showDeptPos ? member.department : null,
    member.work,
    member.location,
  ].filter(Boolean).join(' · ');

  return (
    <View style={s.row}>
      <View>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={s.avatar} onError={() => setImgError(true)} />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Text style={s.initials}>{initials}</Text>
          </View>
        )}
        {presence?.online && <View style={s.onlineDot} />}
      </View>

      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>{member.name}</Text>
          {presence && !presence.online && (
            <Text style={s.ago}>{presence.label}</Text>
          )}
        </View>
        {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>

      {member.phone ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(`tel:${member.phone}`)}
          activeOpacity={0.6}
          style={s.callBtn}
          hitSlop={8}
        >
          <Ionicons name="call-outline" size={18} color={ACCENT.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function MembersScreen() {
  const { theme } = useTheme();
  const { member: authMember, isLoggedIn } = useAuth();
  const { register, unregister } = useRefreshContext();
  const isFocused = useIsFocused();
  const isUPR = isLoggedIn && authMember?.type === 'UPR';

  const [members,  setMembers]  = useState<Member[]>([]);
  const [filtered, setFiltered] = useState<Member[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,   setSearch]   = useState('');
  const [error,    setError]    = useState('');
  const [now,      setNow]      = useState(Date.now());

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await fetchMemberList();
      if (data.success) { setMembers(data.members); setFiltered(data.members); }
      else setError('உறுப்பினர்கள் பட்டியல் கிடைக்கவில்லை');
    } catch (e: any) {
      console.error('MembersScreen load error:', e.message);
      logError('Members List Failed', e?.message || 'Failed to load member list', authMember?.id);
      setError('சேவையகத்துடன் இணைப்பு தோல்வி');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  // Presence polling — while this screen is focused, silently refresh lastSeen
  // every 60s and tick the clock every 30s so the "Xm" labels stay current.
  useEffect(() => {
    if (!isFocused) return;
    const tick = setInterval(() => setNow(Date.now()), 30 * 1000);
    const poll = setInterval(async () => {
      try {
        const data = await fetchMemberList();
        if (data.success) { setMembers(data.members); setNow(Date.now()); }
      } catch {
        // silent — keep showing the last known list
      }
    }, 60 * 1000);
    return () => { clearInterval(tick); clearInterval(poll); };
  }, [isFocused]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    register('Members', onRefresh);
    return () => unregister('Members');
  }, [onRefresh, register, unregister]);

  useEffect(() => {
    let list = isUPR ? members : [...members].sort((a, b) => a.name.localeCompare(b.name));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        m.position?.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q) ||
        m.work?.toLowerCase().includes(q) ||
        m.location?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [search, members, isUPR]);

  const s = styles(theme);

  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />

      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={17} color={theme.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="தேடுங்கள்"
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8} activeOpacity={0.6}>
            <Ionicons name="close-circle" size={17} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={ACCENT.primary} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={34} color={theme.textMuted} />
          <Text style={s.infoText}>{error}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); load(); }} activeOpacity={0.6}>
            <Text style={s.retry}>மீண்டும் முயற்சி</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fade }}>
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={s.sep} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT.primary} />}
            ListHeaderComponent={
              <Text style={s.count}>{filtered.length} பேர்</Text>
            }
            ListEmptyComponent={
              <View style={s.center}>
                <Ionicons name="people-outline" size={34} color={theme.textMuted} />
                <Text style={s.infoText}>தேடல் முடிவு இல்லை</Text>
              </View>
            }
            renderItem={({ item }) => <MemberRow member={item} showDeptPos={isUPR} now={now} />}
          />
        </Animated.View>
      )}
    </View>
  );
}

const rowStyles = (theme: any) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT.tintSoft },
  initials: { ...TYPE.bodyStrong, color: ACCENT.primary },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderRadius: 7,
    backgroundColor: ONLINE_GREEN, borderWidth: 2, borderColor: theme.background,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...TYPE.bodyStrong, color: theme.text, flexShrink: 1 },
  ago: { ...TYPE.caption, color: theme.textMuted, flexShrink: 0 },
  subtitle: { ...TYPE.caption, color: theme.textMuted, marginTop: 2 },
  callBtn: {
    width: 38, height: 38, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: ACCENT.tintSoft,
  },
});

const styles = (theme: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: SPACING.md, marginBottom: SPACING.sm,
    paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: theme.surface, borderRadius: RADIUS.md,
  },
  searchInput: { flex: 1, color: theme.text, ...TYPE.body, paddingVertical: 0 },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: theme.divider, marginLeft: 58 },
  count: { ...TYPE.caption, color: theme.textMuted, paddingBottom: SPACING.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: 10 },
  infoText: { ...TYPE.label, color: theme.textSecondary, textAlign: 'center' },
  retry: { ...TYPE.bodyStrong, color: ACCENT.primary, marginTop: 4 },
});
