import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Animated, Image, RefreshControl, LayoutAnimation,
  Platform, UIManager,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useRefreshContext } from '../context/RefreshContext';
import { ACCENT, SPACING, RADIUS, TYPE, FONT_FAMILY } from '../theme';
import { fetchEvents, fetchEventDetail, imageUrl, logError } from '../api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface EventItem {
  id: string; name: string; nameEnglish: string | null;
  date: string | null; type: string | null;
  venue: string | null; destination: string | null;
  totalSeats: number | null; eventCode: string | null;
  organizer: string | null; imageIds: string[];
}

interface Winner { id: string; name: string | null; prize: string | null }
interface Competition { id: string; name: string; winners: Winner[] }
interface TripMember { id: string; name: string; status: string }
interface Participant { id: string; name: string; type: string | null }

interface Detail {
  competitions: Competition[];
  tripMembers: TripMember[];
  participants: Participant[];
  statusCounts: Record<string, number>;
}

const MONTHS = ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'];

function formatDate(raw: string | null) {
  if (!raw) return { day: '—', month: '' };
  const [y, m, d] = raw.split('-');
  return { day: d ?? '—', month: `${MONTHS[parseInt(m, 10) - 1] ?? ''} ${y ?? ''}`.trim() };
}

const PRIZE_TONE: Record<string, string> = {
  '1': '#F2B233',
  '2': '#A8B3C0',
  '3': '#CE8250',
};

function prizeColor(prize: string | null) {
  if (!prize) return undefined;
  const n = prize.trim()[0];
  return PRIZE_TONE[n];
}

function EventCard({ item, expanded, detail, loading, onToggle, theme }: {
  item: EventItem; expanded: boolean; detail: Detail | null; loading: boolean;
  onToggle: () => void; theme: any;
}) {
  const s = cardStyles(theme);
  const { day, month } = formatDate(item.date);
  const cover = item.imageIds?.[0];

  return (
    <View style={s.card}>
      <TouchableOpacity activeOpacity={0.7} onPress={onToggle}>
        {cover ? (
          <Image source={{ uri: imageUrl(cover) }} style={s.cover} resizeMode="cover" />
        ) : null}

        <View style={s.head}>
          <View style={s.dateBlock}>
            <Text style={s.dateDay}>{day}</Text>
            <Text style={s.dateMonth}>{month}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={s.name} numberOfLines={2}>{item.name}</Text>
            {item.nameEnglish ? <Text style={s.nameEn} numberOfLines={1}>{item.nameEnglish}</Text> : null}

            <View style={s.metaRow}>
              {item.type ? (
                <View style={s.typeChip}><Text style={s.typeChipText}>{item.type}</Text></View>
              ) : null}
              {item.venue || item.destination ? (
                <View style={s.metaItem}>
                  <Ionicons name="location-outline" size={12} color={theme.textMuted} />
                  <Text style={s.metaText} numberOfLines={1}>{item.venue || item.destination}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={19}
            color={theme.textMuted}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={s.body}>
          {loading ? (
            <ActivityIndicator color={ACCENT.primary} style={{ marginVertical: SPACING.md }} />
          ) : detail ? (
            <>
              {detail.competitions.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>போட்டிகள்</Text>
                  {detail.competitions.map(c => (
                    <View key={c.id} style={s.comp}>
                      <Text style={s.compName}>{c.name}</Text>
                      {c.winners.length === 0 ? (
                        <Text style={s.emptyInline}>முடிவுகள் இல்லை</Text>
                      ) : c.winners.map(w => (
                        <View key={w.id} style={s.winnerRow}>
                          <Ionicons
                            name="trophy"
                            size={13}
                            color={prizeColor(w.prize) ?? theme.textMuted}
                          />
                          <Text style={s.winnerName} numberOfLines={1}>{w.name}</Text>
                          <Text style={s.winnerPrize}>{w.prize}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {detail.tripMembers.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>பயணிகள் · {detail.tripMembers.length}</Text>
                  {detail.tripMembers.slice(0, 40).map(m => (
                    <View key={m.id} style={s.rosterRow}>
                      <Text style={s.rosterName} numberOfLines={1}>{m.name}</Text>
                      <View style={[s.statusChip, statusTone(m.status)]}>
                        <Text style={[s.statusText, statusTone(m.status)]}>{m.status}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {detail.participants.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>பங்கேற்பாளர்கள் · {detail.participants.length}</Text>
                  <Text style={s.participantList}>
                    {detail.participants.map(p => p.name).join(', ')}
                  </Text>
                </View>
              )}

              {detail.competitions.length === 0
                && detail.tripMembers.length === 0
                && detail.participants.length === 0 && (
                <Text style={s.emptyInline}>விவரங்கள் இல்லை</Text>
              )}
            </>
          ) : (
            <Text style={s.emptyInline}>விவரங்கள் ஏற்ற முடியவில்லை</Text>
          )}
        </View>
      )}
    </View>
  );
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes('accept')) return { color: '#34D399', borderColor: '#34D399' };
  if (s.includes('reject')) return { color: '#F87171', borderColor: '#F87171' };
  if (s.includes('cancel')) return { color: '#A8A29E', borderColor: '#A8A29E' };
  return { color: ACCENT.primary, borderColor: ACCENT.primary };
}

export default function EventsScreen() {
  const { theme } = useTheme();
  const { register, unregister } = useRefreshContext();

  const [tab, setTab] = useState<'events' | 'trips'>('events');
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, Detail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);

  const load = useCallback(async (tripsOnly: boolean) => {
    setError('');
    try {
      const data = await fetchEvents(tripsOnly);
      if (data.success) setItems(data.events);
      else setError('நிகழ்வுகள் கிடைக்கவில்லை');
    } catch (e: any) {
      logError('Events Load Failed', e?.message || 'Failed to load events');
      setError('சேவையகத்துடன் இணைப்பு தோல்வி');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setLoading(true);
    setOpenId(null);
    load(tab === 'trips');
  }, [tab, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setDetails({});
    await load(tab === 'trips');
    setRefreshing(false);
  }, [load, tab]);

  useEffect(() => {
    register('Events', onRefresh);
    return () => unregister('Events');
  }, [onRefresh, register, unregister]);

  const toggle = useCallback(async (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);

    if (details[id]) return;
    setDetailLoading(id);
    try {
      const data = await fetchEventDetail(id);
      if (data.success) {
        setDetails(prev => ({
          ...prev,
          [id]: {
            competitions: data.competitions ?? [],
            tripMembers: data.tripMembers ?? [],
            participants: data.participants ?? [],
            statusCounts: data.statusCounts ?? {},
          },
        }));
      }
    } catch (e: any) {
      logError('Event Detail Failed', e?.message || `Failed for ${id}`);
    } finally { setDetailLoading(null); }
  }, [openId, details]);

  const s = styles(theme);

  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />

      <View style={s.segment}>
        {(['events', 'trips'] as const).map(key => {
          const on = tab === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setTab(key)}
              activeOpacity={0.7}
              style={[s.segmentBtn, on && s.segmentBtnOn]}
            >
              <Text style={[s.segmentText, on && s.segmentTextOn]}>
                {key === 'events' ? 'நிகழ்வுகள்' : 'பயணங்கள்'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={ACCENT.primary} /></View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={34} color={theme.textMuted} />
          <Text style={s.infoText}>{error}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); load(tab === 'trips'); }} activeOpacity={0.6}>
            <Text style={s.retry}>மீண்டும் முயற்சி</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fade }}>
          <FlatList
            data={items}
            keyExtractor={i => i.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT.primary} />}
            ListEmptyComponent={
              <View style={s.center}>
                <Ionicons name="calendar-outline" size={34} color={theme.textMuted} />
                <Text style={s.infoText}>பதிவுகள் இல்லை</Text>
              </View>
            }
            renderItem={({ item }) => (
              <EventCard
                item={item}
                expanded={openId === item.id}
                detail={details[item.id] ?? null}
                loading={detailLoading === item.id}
                onToggle={() => toggle(item.id)}
                theme={theme}
              />
            )}
          />
        </Animated.View>
      )}
    </View>
  );
}

const cardStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  cover: { width: '100%', height: 140, backgroundColor: theme.surface },
  head: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md },
  dateBlock: {
    width: 52, paddingVertical: 8, borderRadius: RADIUS.sm,
    backgroundColor: ACCENT.tintSoft, alignItems: 'center',
  },
  dateDay: { fontSize: 20, fontFamily: FONT_FAMILY.bold, color: ACCENT.primary, lineHeight: 24 },
  dateMonth: { ...TYPE.caption, fontSize: 10, color: ACCENT.primary },
  name: { ...TYPE.heading, color: theme.text },
  nameEn: { ...TYPE.caption, color: theme.textMuted, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  typeChip: { backgroundColor: theme.surface, borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3 },
  typeChipText: { ...TYPE.caption, fontSize: 10, color: theme.textSecondary },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 1 },
  metaText: { ...TYPE.caption, color: theme.textMuted, flexShrink: 1 },

  body: {
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider,
  },
  section: { marginTop: SPACING.md },
  sectionLabel: { ...TYPE.caption, color: theme.textMuted, marginBottom: 8 },
  comp: { marginBottom: SPACING.sm },
  compName: { ...TYPE.bodyStrong, color: theme.text, marginBottom: 5 },
  winnerRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 3 },
  winnerName: { ...TYPE.caption, color: theme.textSecondary, flex: 1 },
  winnerPrize: { ...TYPE.caption, fontSize: 10, color: theme.textMuted },
  rosterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5, gap: 8 },
  rosterName: { ...TYPE.caption, color: theme.textSecondary, flex: 1 },
  statusChip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontFamily: FONT_FAMILY.medium },
  participantList: { ...TYPE.caption, color: theme.textSecondary, lineHeight: 19 },
  emptyInline: { ...TYPE.caption, color: theme.textMuted, marginTop: SPACING.sm },
});

const styles = (theme: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  segment: {
    flexDirection: 'row', gap: 6, marginHorizontal: SPACING.md, marginBottom: SPACING.sm,
    backgroundColor: theme.surface, borderRadius: RADIUS.md, padding: 4,
  },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: RADIUS.sm, alignItems: 'center' },
  segmentBtnOn: { backgroundColor: theme.background },
  segmentText: { ...TYPE.label, color: theme.textMuted },
  segmentTextOn: { color: ACCENT.primary },
  list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: 10 },
  infoText: { ...TYPE.label, color: theme.textSecondary, textAlign: 'center' },
  retry: { ...TYPE.bodyStrong, color: ACCENT.primary, marginTop: 4 },
});
