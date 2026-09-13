import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Animated, RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useRefreshContext } from '../context/RefreshContext';
import ScreenHeader from '../components/ScreenHeader';
import { ACCENT, SPACING, RADIUS, TYPE, FONT_FAMILY } from '../theme';
import { fetchCalendar, logError } from '../api';

interface Birthday { id: string; name: string; uprId: string | null; dob: string }
interface Occasion { id: string; name: string; message: string | null; date: string | null }

const MONTHS = [
  'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
  'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்',
];
const WEEKDAYS = ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'];

// Matches the colour coding on the Salesforce calendar, so the two read the
// same: pink birthdays, green occasions, blue today, amber for the selection.
const CAL = {
  today:         { bg: '#1976D2', border: '#1565C0' },
  selected:      { bg: '#FFB300', border: '#FFA000' },
  birthday:      { bg: '#FF69B4', border: '#D81B60' },
  todayBirthday: { bg: '#C2185B', border: '#AD1457' },
  event:         { bg: '#43A047', border: '#2E7031' },
};

// Precedence: an explicit tap wins, then today-and-a-birthday, then birthday,
// then occasion, then plain today.
function dayTone(o: { selected: boolean; today: boolean; birthday: boolean; event: boolean }) {
  if (o.selected) return CAL.selected;
  if (o.today && o.birthday) return CAL.todayBirthday;
  if (o.birthday) return CAL.birthday;
  if (o.event) return CAL.event;
  if (o.today) return CAL.today;
  return null;
}

// month is 0-indexed
function monthGrid(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { register, unregister } = useRefreshContext();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<number | null>(today.getDate());

  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await fetchCalendar();
      if (data.success) {
        setBirthdays(data.birthdays ?? []);
        setOccasions(data.occasions ?? []);
      } else setError('நாள்காட்டி கிடைக்கவில்லை');
    } catch (e: any) {
      logError('Calendar Load Failed', e?.message || 'Failed to load calendar');
      setError('சேவையகத்துடன் இணைப்பு தோல்வி');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    register('Calendar', onRefresh);
    return () => unregister('Calendar');
  }, [onRefresh, register, unregister]);

  // Birthdays recur, so index by month-day and ignore the birth year.
  const birthdaysByDay = useMemo(() => {
    const map: Record<string, Birthday[]> = {};
    for (const b of birthdays) {
      const [, m, d] = b.dob.split('-');
      const key = `${parseInt(m, 10) - 1}-${parseInt(d, 10)}`;
      (map[key] ||= []).push(b);
    }
    return map;
  }, [birthdays]);

  // Occasions are specific dates, so they key on the full year.
  const occasionsByDay = useMemo(() => {
    const map: Record<string, Occasion[]> = {};
    for (const o of occasions) {
      if (!o.date) continue;
      const [y, m, d] = o.date.split('-');
      const key = `${y}-${parseInt(m, 10) - 1}-${parseInt(d, 10)}`;
      (map[key] ||= []).push(o);
    }
    return map;
  }, [occasions]);

  const cells = useMemo(() => monthGrid(year, month), [year, month]);

  const step = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y); setSelected(null);
  };

  const dayBirthdays = selected ? (birthdaysByDay[`${month}-${selected}`] ?? []) : [];
  const dayOccasions = selected ? (occasionsByDay[`${year}-${month}-${selected}`] ?? []) : [];

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const s = styles(theme);

  if (loading) {
    return (
      <View style={s.root}>
        <StatusBar style={theme.statusBar} />
        <ScreenHeader title="நாள்காட்டி" onBack={() => navigation.goBack()} />
        <View style={s.center}><ActivityIndicator color={ACCENT.primary} /></View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.root}>
        <StatusBar style={theme.statusBar} />
        <ScreenHeader title="நாள்காட்டி" onBack={() => navigation.goBack()} />
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={34} color={theme.textMuted} />
          <Text style={s.infoText}>{error}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); load(); }} activeOpacity={0.6}>
            <Text style={s.retry}>மீண்டும் முயற்சி</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />
      <ScreenHeader title="நாள்காட்டி" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT.primary} />}
      >
        <Animated.View style={{ opacity: fade }}>

          <View style={s.card}>
            <View style={s.monthBar}>
              <TouchableOpacity onPress={() => step(-1)} hitSlop={10} activeOpacity={0.6}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </TouchableOpacity>
              <Text style={s.monthLabel}>{MONTHS[month]} {year}</Text>
              <TouchableOpacity onPress={() => step(1)} hitSlop={10} activeOpacity={0.6}>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={s.weekRow}>
              {WEEKDAYS.map(w => <Text key={w} style={s.weekday}>{w}</Text>)}
            </View>

            <View style={s.grid}>
              {cells.map((d, i) => {
                if (d === null) return <View key={`e${i}`} style={s.cell} />;
                const hasB = !!birthdaysByDay[`${month}-${d}`];
                const hasO = !!occasionsByDay[`${year}-${month}-${d}`];
                const on = selected === d;
                const tone = dayTone({ selected: on, today: isToday(d), birthday: hasB, event: hasO });

                return (
                  <TouchableOpacity
                    key={d}
                    style={s.cell}
                    activeOpacity={0.6}
                    onPress={() => setSelected(on ? null : d)}
                  >
                    <View style={[
                      s.dayBubble,
                      tone && { backgroundColor: tone.bg, borderColor: tone.border, borderWidth: 1.5 },
                    ]}>
                      <Text style={[s.dayText, tone && s.dayTextOnTone]}>{d}</Text>

                      {/* A day can be both. The fill shows the birthday, so the
                          occasion gets a corner pip rather than being dropped. */}
                      {hasB && hasO && (
                        <View style={[s.pip, { backgroundColor: CAL.event.bg, borderColor: '#FFFFFF' }]} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={s.legend}>
              <View style={s.legendItem}>
                <View style={[s.swatch, { backgroundColor: CAL.birthday.bg, borderColor: CAL.birthday.border }]} />
                <Text style={s.legendText}>பிறந்தநாள்</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.swatch, { backgroundColor: CAL.event.bg, borderColor: CAL.event.border }]} />
                <Text style={s.legendText}>நிகழ்வு</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.swatch, { backgroundColor: CAL.today.bg, borderColor: CAL.today.border }]} />
                <Text style={s.legendText}>இன்று</Text>
              </View>
            </View>
          </View>

          {selected !== null && (
            <View style={s.card}>
              <Text style={s.detailHead}>{selected} {MONTHS[month]}</Text>

              {dayBirthdays.length === 0 && dayOccasions.length === 0 ? (
                <Text style={s.empty}>இந்நாளில் நிகழ்வுகள் இல்லை</Text>
              ) : (
                <>
                  {dayBirthdays.map(b => (
                    <View key={b.id} style={s.detailRow}>
                      <View style={[s.detailIcon, { backgroundColor: CAL.birthday.bg }]}>
                        <Ionicons name="gift" size={15} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.detailName}>{b.name}</Text>
                        <Text style={s.detailSub}>
                          பிறந்தநாள்{b.uprId ? ` · ${b.uprId}` : ''}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {dayOccasions.map(o => (
                    <View key={o.id} style={s.detailRow}>
                      <View style={[s.detailIcon, { backgroundColor: CAL.event.bg }]}>
                        <Ionicons name="flag" size={15} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.detailName}>{o.name}</Text>
                        {o.message ? <Text style={s.detailSub}>{o.message}</Text> : null}
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          <Text style={s.footer}>
            {birthdays.length} பிறந்தநாள் · {occasions.length} நிகழ்வு
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },

  card: {
    backgroundColor: theme.card,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    padding: SPACING.md,
  },

  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  monthLabel: { ...TYPE.heading, color: theme.text },

  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', ...TYPE.caption, fontSize: 11, color: theme.textMuted },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  dayBubble: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  dayText: { ...TYPE.label, color: theme.textSecondary },
  dayTextOnTone: { color: '#FFFFFF', fontFamily: FONT_FAMILY.semibold },
  pip: {
    position: 'absolute', bottom: -1, right: -1,
    width: 11, height: 11, borderRadius: 6, borderWidth: 1.5,
  },

  legend: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md,
    marginTop: SPACING.sm, paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
  legendText: { ...TYPE.caption, color: theme.textMuted },

  detailHead: { ...TYPE.heading, color: theme.text, marginBottom: SPACING.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  detailIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  detailName: { ...TYPE.bodyStrong, color: theme.text },
  detailSub: { ...TYPE.caption, color: theme.textMuted, marginTop: 1 },
  empty: { ...TYPE.caption, color: theme.textMuted },

  infoText: { ...TYPE.label, color: theme.textSecondary, textAlign: 'center' },
  retry: { ...TYPE.bodyStrong, color: ACCENT.primary, marginTop: 4 },
  footer: { ...TYPE.caption, color: theme.textMuted, textAlign: 'center' },
});
