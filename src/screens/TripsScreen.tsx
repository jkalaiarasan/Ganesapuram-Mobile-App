import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ScreenHeader from '../components/ScreenHeader';
import { ACCENT, SPACING, RADIUS, TYPE, FONT_FAMILY } from '../theme';
import { fetchEvents, fetchTrip, registerTripMember, logError } from '../api';

interface TripSummary { id: string; name: string; date: string | null; destination: string | null }
interface TripDetail {
  id: string; name: string; date: string | null; destination: string | null;
  departureTime: string | null; returnTime: string | null;
  totalSeats: number | null; registrations: number; accepted: number;
  rejected: number; seatsLeft: number | null;
}

function formatWhen(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function TripsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { member } = useAuth();
  const { showToast } = useToast();

  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(member?.name ?? '');
  const [mobile, setMobile] = useState(member?.phone ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const loadTrips = useCallback(async () => {
    setError('');
    try {
      const data = await fetchEvents(true);
      if (data.success) {
        setTrips(data.events);
        if (data.events.length && !activeId) setActiveId(data.events[0].id);
      } else setError('பயணங்கள் கிடைக்கவில்லை');
    } catch (e: any) {
      logError('Trips Load Failed', e?.message || 'Failed to load trips');
      setError('சேவையகத்துடன் இணைப்பு தோல்வி');
    } finally { setLoading(false); }
  }, [activeId]);

  useEffect(() => { loadTrips(); }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await fetchTrip(id);
      if (data.success) setDetail(data.trip);
    } catch (e: any) {
      logError('Trip Detail Failed', e?.message || `Failed for ${id}`);
    } finally { setDetailLoading(false); }
  }, []);

  useEffect(() => {
    if (activeId) { setDone(false); loadDetail(activeId); }
  }, [activeId, loadDetail]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    if (activeId) await loadDetail(activeId);
    setRefreshing(false);
  }, [loadTrips, loadDetail, activeId]);

  const submit = async () => {
    if (!name.trim()) return showToast('பெயரை உள்ளிடவும்', 'error');
    if (!/^\d{10}$/.test(mobile.trim())) return showToast('10 இலக்க கைபேசி எண் உள்ளிடவும்', 'error');
    if (!activeId) return;

    setSubmitting(true);
    try {
      const res = await registerTripMember(activeId, {
        name: name.trim(), mobile: mobile.trim(), email: email.trim() || undefined,
      });
      if (res.success) {
        setDone(true);
        showToast('பதிவு வெற்றி — ஒப்புதலுக்காக காத்திருக்கிறது', 'success');
        loadDetail(activeId);
      } else {
        showToast(res.message || 'பதிவு தோல்வி', 'error');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      if (status === 409) showToast('இந்த எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது', 'error');
      else showToast(message || 'பதிவு தோல்வி', 'error');
      logError('Trip Register Failed', `Status:${status ?? 'N/A'} | ${message ?? err?.message}`);
    } finally { setSubmitting(false); }
  };

  const s = styles(theme);
  const full = detail?.seatsLeft === 0;

  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />
      <ScreenHeader title="Blue Moon" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={s.center}><ActivityIndicator color={ACCENT.primary} /></View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={34} color={theme.textMuted} />
          <Text style={s.infoText}>{error}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); loadTrips(); }} activeOpacity={0.6}>
            <Text style={s.retry}>மீண்டும் முயற்சி</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT.primary} />}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pills}>
              {trips.map(t => {
                const on = t.id === activeId;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setActiveId(t.id)}
                    activeOpacity={0.7}
                    style={[s.pill, on && s.pillOn]}
                  >
                    <Text style={[s.pillText, on && s.pillTextOn]} numberOfLines={1}>{t.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {detailLoading ? (
              <ActivityIndicator color={ACCENT.primary} style={{ marginTop: SPACING.xl }} />
            ) : detail ? (
              <>
                <View style={s.card}>
                  <Text style={s.tripName}>{detail.name}</Text>
                  {detail.destination ? (
                    <View style={s.metaRow}>
                      <Ionicons name="location-outline" size={14} color={theme.textMuted} />
                      <Text style={s.metaText}>{detail.destination}</Text>
                    </View>
                  ) : null}

                  <View style={s.timeRow}>
                    {formatWhen(detail.departureTime) ? (
                      <View style={s.timeBlock}>
                        <Text style={s.timeLabel}>புறப்பாடு</Text>
                        <Text style={s.timeValue}>{formatWhen(detail.departureTime)}</Text>
                      </View>
                    ) : null}
                    {formatWhen(detail.returnTime) ? (
                      <View style={s.timeBlock}>
                        <Text style={s.timeLabel}>திரும்புதல்</Text>
                        <Text style={s.timeValue}>{formatWhen(detail.returnTime)}</Text>
                      </View>
                    ) : null}
                  </View>

                  {detail.totalSeats != null && (
                    <>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, {
                          width: `${Math.min(100, (detail.accepted / Math.max(detail.totalSeats, 1)) * 100)}%`,
                        }]} />
                      </View>
                      <View style={s.statRow}>
                        <Stat label="மொத்தம்" value={detail.totalSeats} theme={theme} />
                        <Stat label="உறுதி" value={detail.accepted} theme={theme} tint="#34D399" />
                        <Stat label="மீதம்" value={detail.seatsLeft ?? 0} theme={theme} tint={ACCENT.primary} />
                        <Stat label="விண்ணப்பம்" value={detail.registrations} theme={theme} />
                      </View>
                    </>
                  )}
                </View>

                <View style={s.card}>
                  <Text style={s.formTitle}>இருக்கை கோரிக்கை</Text>

                  {done ? (
                    <View style={s.doneBox}>
                      <Ionicons name="checkmark-circle" size={34} color="#34D399" />
                      <Text style={s.doneText}>பதிவு அனுப்பப்பட்டது</Text>
                      <Text style={s.doneSub}>நிர்வாகி ஒப்புதலுக்குப் பிறகு உறுதி செய்யப்படும்</Text>
                    </View>
                  ) : full ? (
                    <View style={s.doneBox}>
                      <Ionicons name="close-circle-outline" size={34} color={theme.textMuted} />
                      <Text style={s.doneText}>இருக்கைகள் நிரம்பிவிட்டன</Text>
                    </View>
                  ) : (
                    <>
                      <Field icon="person-outline" placeholder="பெயர்" value={name} onChange={setName} theme={theme} />
                      <Field icon="call-outline" placeholder="கைபேசி எண்" value={mobile} onChange={setMobile} theme={theme} keyboardType="number-pad" maxLength={10} />
                      <Field icon="mail-outline" placeholder="மின்னஞ்சல் (விருப்பம்)" value={email} onChange={setEmail} theme={theme} keyboardType="email-address" />

                      <TouchableOpacity onPress={submit} disabled={submitting} activeOpacity={0.8} style={s.btn}>
                        {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.btnText}>பதிவு செய்</Text>}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            ) : (
              <View style={s.center}>
                <Ionicons name="bus-outline" size={34} color={theme.textMuted} />
                <Text style={s.infoText}>பயணங்கள் இல்லை</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

function Stat({ label, value, theme, tint }: { label: string; value: number; theme: any; tint?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={{ ...TYPE.heading, color: tint ?? theme.text }}>{value}</Text>
      <Text style={{ ...TYPE.caption, fontSize: 10, color: theme.textMuted }}>{label}</Text>
    </View>
  );
}

function Field({ icon, placeholder, value, onChange, theme, keyboardType, maxLength }: any) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: theme.surface, borderRadius: RADIUS.md,
      paddingHorizontal: 14, paddingVertical: 13, marginBottom: SPACING.sm,
    }}>
      <Ionicons name={icon} size={17} color={theme.textMuted} />
      <TextInput
        style={{ flex: 1, color: theme.text, ...TYPE.body, paddingVertical: 0 }}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.md },
  pills: { gap: 8, paddingRight: SPACING.md },
  pill: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.full,
    backgroundColor: theme.surface, maxWidth: 220,
  },
  pillOn: { backgroundColor: ACCENT.primary },
  pillText: { ...TYPE.label, color: theme.textSecondary },
  pillTextOn: { color: '#FFFFFF' },

  card: {
    backgroundColor: theme.card, borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    padding: SPACING.md,
  },
  tripName: { ...TYPE.title, fontSize: 19, color: theme.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  metaText: { ...TYPE.caption, color: theme.textMuted, flex: 1 },

  timeRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  timeBlock: { flex: 1 },
  timeLabel: { ...TYPE.caption, fontSize: 10, color: theme.textMuted },
  timeValue: { ...TYPE.bodyStrong, fontSize: 13, color: theme.text, marginTop: 2 },

  barTrack: { height: 6, borderRadius: 3, backgroundColor: theme.surface, marginTop: SPACING.md, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: ACCENT.primary },
  statRow: { flexDirection: 'row', marginTop: SPACING.md },

  formTitle: { ...TYPE.heading, color: theme.text, marginBottom: SPACING.sm },
  btn: {
    backgroundColor: ACCENT.primary, borderRadius: RADIUS.md,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center', minHeight: 50,
  },
  btnText: { ...TYPE.bodyStrong, color: '#FFFFFF' },

  doneBox: { alignItems: 'center', gap: 6, paddingVertical: SPACING.lg },
  doneText: { ...TYPE.bodyStrong, color: theme.text },
  doneSub: { ...TYPE.caption, color: theme.textMuted, textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: 10 },
  infoText: { ...TYPE.label, color: theme.textSecondary, textAlign: 'center' },
  retry: { ...TYPE.bodyStrong, color: ACCENT.primary, marginTop: 4 },
});
