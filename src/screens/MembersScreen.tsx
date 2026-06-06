import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { GOLD, SPACING, RADIUS, FONTS, SHADOWS } from '../theme';
import { fetchMemberList } from '../api';

const { width } = Dimensions.get('window');
const CARD_W = (width - SPACING.lg * 2 - SPACING.sm) / 2;

interface Member {
  Id: string;
  Name: string;
  Username__c?: string;
  UPRId__c?: string;
  Position__c?: string;
  Department__c?: string;
  profileImageUrl?: string;
  contentVersionId?: string;
}

function MemberCard({ item, onPress, index, theme }: { item: Member; onPress: () => void; index: number; theme: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 60,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const initials = item.Name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <Animated.View style={{ opacity: anim, transform: [{ scale: anim }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <LinearGradient colors={theme.gradients.card as [string, string]} style={[cardStyles.card, { width: CARD_W }]}>
          <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light]} style={cardStyles.imageBorder}>
            {item.contentVersionId ? (
              <Image
                source={{ uri: item.profileImageUrl }}
                style={cardStyles.image}
                defaultSource={require('../../assets/icon.png')}
              />
            ) : (
              <LinearGradient colors={['#2A2540', '#1A1625']} style={cardStyles.initialsBox}>
                <Text style={cardStyles.initials}>{initials}</Text>
              </LinearGradient>
            )}
          </LinearGradient>
          <Text style={[cardStyles.name, { color: theme.text }]} numberOfLines={2}>{item.Name}</Text>
          {item.Position__c ? (
            <View style={cardStyles.badge}>
              <Text style={cardStyles.badgeText} numberOfLines={1}>{item.Position__c}</Text>
            </View>
          ) : null}
          {item.UPRId__c ? (
            <Text style={[cardStyles.uprId, { color: theme.textMuted }]}>{item.UPRId__c}</Text>
          ) : null}
          {item.Department__c ? (
            <Text style={[cardStyles.dept, { color: theme.textMuted }]} numberOfLines={1}>{item.Department__c}</Text>
          ) : null}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GOLD.border,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  imageBorder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2,
    marginBottom: 10,
    marginTop: 6,
  },
  image: { width: 68, height: 68, borderRadius: 34 },
  initialsBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: GOLD.light, fontSize: 24, fontWeight: '800' },
  name: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  badge: {
    backgroundColor: GOLD.subtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: GOLD.border,
    marginBottom: 4,
    maxWidth: CARD_W - 16,
  },
  badgeText: { color: GOLD.primary, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  uprId: { fontSize: 10, marginBottom: 2 },
  dept: { fontSize: 10, textAlign: 'center' },
});

export default function MembersScreen() {
  const { theme } = useTheme();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadMembers = useCallback(async () => {
    try {
      const data = await fetchMemberList();
      if (data.success) setMembers(data.members);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  }, []);

  const s = styles(theme);
  const initials = selected?.Name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />
      <LinearGradient colors={theme.gradients.background as [string, string, string]} style={StyleSheet.absoluteFill} />

      <Animated.View style={[s.header, { opacity: fadeAnim }]}>
        <Text style={s.headerSub}>UPR நட்பு சாம்ராஜ்யம்</Text>
        <Text style={s.headerTitle}>உறுப்பினர்கள்</Text>
        <Text style={s.memberCount}>{members.length} உறுப்பினர்கள்</Text>
      </Animated.View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={GOLD.primary} size="large" />
          <Text style={s.loadingText}>உறுப்பினர் விவரங்கள் ஏற்றுகிறது...</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          numColumns={2}
          keyExtractor={item => item.Id}
          contentContainerStyle={s.list}
          columnWrapperStyle={s.row}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD.primary} />}
          renderItem={({ item, index }) => (
            <MemberCard item={item} index={index} theme={theme} onPress={() => setSelected(item)} />
          )}
        />
      )}

      {/* Member Detail Modal */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
          {selected && (
            <LinearGradient colors={theme.gradients.card as [string, string]} style={s.modal}>
              <LinearGradient colors={theme.gradients.gold as [string, string, string]} style={s.modalHeader}>
                <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} style={s.modalImageBorder}>
                  {selected.contentVersionId ? (
                    <Image source={{ uri: selected.profileImageUrl }} style={s.modalImage} />
                  ) : (
                    <View style={[s.modalImage, { backgroundColor: '#1A1625', alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ color: GOLD.light, fontSize: 40, fontWeight: '800' }}>{initials}</Text>
                    </View>
                  )}
                </LinearGradient>
              </LinearGradient>
              <View style={s.modalBody}>
                <Text style={s.modalName}>{selected.Name}</Text>
                {selected.UPRId__c && <Text style={s.modalId}>{selected.UPRId__c}</Text>}
                <View style={s.modalDivider} />
                {selected.Position__c && (
                  <DetailRow label="பதவி" value={selected.Position__c} theme={theme} />
                )}
                {selected.Department__c && (
                  <DetailRow label="துறை" value={selected.Department__c} theme={theme} />
                )}
                {selected.Username__c && (
                  <DetailRow label="பயனர் பெயர்" value={selected.Username__c} theme={theme} />
                )}
              </View>
              <TouchableOpacity onPress={() => setSelected(null)} style={s.closeBtn}>
                <Text style={s.closeBtnText}>மூடு</Text>
              </TouchableOpacity>
            </LinearGradient>
          )}
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text style={{ color: theme.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    header: {
      paddingHorizontal: SPACING.lg,
      paddingTop: 56,
      paddingBottom: SPACING.md,
    },
    headerSub: { color: GOLD.primary, fontSize: 12, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
    headerTitle: { color: theme.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    memberCount: { color: theme.textMuted, fontSize: 13, marginTop: 2 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: theme.textMuted, fontSize: 14 },
    list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl },
    row: { gap: SPACING.sm },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
    modal: {
      width: '100%',
      borderRadius: RADIUS.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: GOLD.border,
      ...SHADOWS.gold,
    },
    modalHeader: { paddingVertical: SPACING.xl, alignItems: 'center' },
    modalImageBorder: { width: 104, height: 104, borderRadius: 52, padding: 3 },
    modalImage: { width: 98, height: 98, borderRadius: 49 },
    modalBody: { padding: SPACING.lg },
    modalName: { color: theme.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
    modalId: { color: GOLD.primary, fontSize: 14, textAlign: 'center', fontWeight: '600', marginBottom: SPACING.md },
    modalDivider: { height: 1, backgroundColor: GOLD.border, marginBottom: SPACING.md },
    closeBtn: { margin: SPACING.md, marginTop: 0, backgroundColor: GOLD.subtle, borderRadius: RADIUS.full, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: GOLD.border },
    closeBtnText: { color: GOLD.primary, fontWeight: '700', fontSize: 14 },
  });
