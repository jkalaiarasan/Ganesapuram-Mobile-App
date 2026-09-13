import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useRefreshContext } from '../context/RefreshContext';
import { ACCENT, SPACING, RADIUS, TYPE, FONT_FAMILY } from '../theme';
import { fetchKural, fetchWeather, fetchTodaysBirthdays, logError } from '../api';

interface KuralData {
  number: number; line1: string; line2: string;
  porul?: string; chapter?: string;
  urai1?: string; urai2?: string;
}
interface Birthday {
  id: string; name: string; uprId: string | null;
  position: string | null; turning: number | null;
}
interface WeatherData {
  location: { name: string; region: string };
  current: { temp_c: number; condition: { text: string }; humidity: number; wind_kph: number; feelslike_c: number };
  forecast?: { forecastday: Array<{ astro: { sunrise: string; sunset: string }; day: { maxtemp_c: number; mintemp_c: number } }> };
}

const weatherIcon = (c = ''): keyof typeof Ionicons.glyphMap => {
  const t = c.toLowerCase();
  if (t.includes('sun') || t.includes('clear')) return 'sunny-outline';
  if (t.includes('rain') || t.includes('drizzle')) return 'rainy-outline';
  if (t.includes('thunder')) return 'thunderstorm-outline';
  if (t.includes('cloud')) return 'partly-sunny-outline';
  if (t.includes('fog') || t.includes('mist')) return 'cloudy-outline';
  return 'partly-sunny-outline';
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const { register, unregister } = useRefreshContext();
  const [kural, setKural] = useState<KuralData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [kuralLoading, setKuralLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const loadKural = useCallback(async () => {
    setKuralLoading(true);
    try {
      const data = await fetchKural();
      if (data.success) setKural({ number: data.number, line1: data.kural.line1 || '', line2: data.kural.line2 || '', urai1: data.kural.urai1 || '', urai2: data.kural.urai2 || '', chapter: data.kural.chapter || '' });
    } catch (e: any) {
      logError('Kural Load Failed', e?.message || 'Failed to load Thirukural');
      setKural({ number: 1, line1: 'அகர முதல எழுத்தெல்லாம் ஆதி', line2: 'பகவன் முதற்றே உலகு.', urai1: 'எழுத்துக்கள் எல்லாம் அகரத்தை அடிப்படையாகக் கொண்டிருக்கின்றன; அதுபோல உலகம் கடவுளை அடிப்படையாகக் கொண்டிருக்கிறது.', chapter: 'கடவுள் வாழ்த்து' });
    } finally { setKuralLoading(false); }
  }, []);

  const loadWeather = useCallback(async (lat?: number, lon?: number) => {
    setWeatherLoading(true);
    try {
      const data = await fetchWeather(lat, lon);
      if (data.success) setWeather(data.data);
      else console.warn('Weather error:', data.message, data.detail);
    } catch (e: any) {
      console.warn('loadWeather failed:', e.message);
      logError('Weather Load Failed', e?.message || 'Failed to load weather data');
    }
    finally { setWeatherLoading(false); }
  }, []);

  const handleLocationPress = useCallback(async () => {
    if (usingCurrentLocation) {
      coordsRef.current = null;
      setUsingCurrentLocation(false);
      loadWeather();
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      coordsRef.current = { lat: loc.coords.latitude, lon: loc.coords.longitude };
      setUsingCurrentLocation(true);
      loadWeather(loc.coords.latitude, loc.coords.longitude);
    } catch (e: any) { console.warn('Location error:', e.message); }
  }, [usingCurrentLocation, loadWeather]);

  // Quiet on failure — a missing birthday card should never disrupt the screen.
  const loadBirthdays = useCallback(async () => {
    try {
      const data = await fetchTodaysBirthdays();
      if (data.success) setBirthdays(data.birthdays ?? []);
    } catch {
      setBirthdays([]);
    }
  }, []);

  useEffect(() => { loadKural(); loadWeather(); loadBirthdays(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const c = coordsRef.current;
    await Promise.all([loadKural(), loadWeather(c?.lat, c?.lon), loadBirthdays()]);
    setRefreshing(false);
  }, [loadKural, loadWeather, loadBirthdays]);

  useEffect(() => {
    register('Home', onRefresh);
    return () => unregister('Home');
  }, [onRefresh, register, unregister]);

  const s = styles(theme);
  const day = weather?.forecast?.forecastday?.[0];

  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT.primary} />}
      >
        <Animated.View style={{ opacity: fade }}>

          {/* ── Today's birthdays — only rendered when there are any ── */}
          {birthdays.length > 0 && (
            <View style={s.bdayCard}>
              <View style={s.bdayHead}>
                <Ionicons name="gift" size={17} color="#FF69B4" />
                <Text style={s.bdayTitle}>இன்றைய பிறந்தநாள்</Text>
              </View>
              {birthdays.map(b => (
                <View key={b.id} style={s.bdayRow}>
                  <View style={s.bdayAvatar}>
                    <Text style={s.bdayInitial}>{b.name?.[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.bdayName}>{b.name}</Text>
                    <Text style={s.bdayMeta}>
                      {[b.position, b.turning ? `${b.turning} வயது` : null]
                        .filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Thirukural ── */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={s.cardHeadLeft}>
                <Ionicons name="book-outline" size={17} color={ACCENT.primary} />
                <Text style={s.cardTitle}>திருக்குறள்</Text>
              </View>
              {kural && <Text style={s.cardMeta}>#{kural.number}</Text>}
            </View>

            {kuralLoading ? (
              <ActivityIndicator color={ACCENT.primary} style={{ marginVertical: 40 }} />
            ) : kural ? (
              <View style={s.cardBody}>
                <Text style={s.kuralLine}>{kural.line1}</Text>
                <Text style={s.kuralLine}>{kural.line2}</Text>

                {kural.chapter ? (
                  <View style={s.chip}>
                    <Text style={s.chipText}>{kural.chapter}</Text>
                  </View>
                ) : null}

                {kural.urai1 ? (
                  <View style={s.meaning}>
                    <Text style={s.meaningLabel}>பொருள்</Text>
                    <Text style={s.meaningText}>{kural.urai1}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <TouchableOpacity onPress={loadKural} activeOpacity={0.6} style={s.cardAction}>
              <Text style={s.cardActionText}>அடுத்த குறள்</Text>
              <Ionicons name="arrow-forward" size={15} color={ACCENT.primary} />
            </TouchableOpacity>
          </View>

          {/* ── Weather ── */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={s.cardHeadLeft}>
                <Ionicons name="partly-sunny-outline" size={17} color={ACCENT.primary} />
                <Text style={s.cardTitle}>வானிலை</Text>
              </View>
              <TouchableOpacity
                onPress={handleLocationPress}
                activeOpacity={0.6}
                style={[s.locChip, usingCurrentLocation && s.locChipOn]}
                hitSlop={6}
              >
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={usingCurrentLocation ? ACCENT.primary : theme.textMuted}
                />
                <Text style={[s.locChipText, usingCurrentLocation && { color: ACCENT.primary }]}>
                  {usingCurrentLocation ? 'என் இடம்' : 'இடம்'}
                </Text>
              </TouchableOpacity>
            </View>

            {weatherLoading ? (
              <ActivityIndicator color={ACCENT.primary} style={{ marginVertical: 40 }} />
            ) : weather ? (
              <View style={s.cardBody}>
                <Text style={s.place}>{weather.location.name}</Text>
                {weather.location.region ? <Text style={s.region}>{weather.location.region}</Text> : null}

                <View style={s.tempRow}>
                  <Text style={s.temp}>{Math.round(weather.current.temp_c)}°</Text>
                  <View style={s.condBlock}>
                    <Ionicons name={weatherIcon(weather.current.condition.text)} size={26} color={ACCENT.primary} />
                    <Text style={s.cond}>{weather.current.condition.text}</Text>
                  </View>
                </View>

                <View style={s.stats}>
                  <Stat icon="thermometer-outline" label="உணர்வு" value={`${Math.round(weather.current.feelslike_c)}°`} theme={theme} />
                  <Stat icon="water-outline" label="ஈரப்பதம்" value={`${weather.current.humidity}%`} theme={theme} />
                  <Stat icon="navigate-outline" label="காற்று" value={`${Math.round(weather.current.wind_kph)}`} theme={theme} />
                </View>

                {day && (
                  <View style={s.sunRow}>
                    <SunItem icon="arrow-up-outline" text={`${Math.round(day.day.maxtemp_c)}°`} theme={theme} />
                    <SunItem icon="arrow-down-outline" text={`${Math.round(day.day.mintemp_c)}°`} theme={theme} />
                    <SunItem icon="sunny-outline" text={day.astro.sunrise} theme={theme} />
                    <SunItem icon="moon-outline" text={day.astro.sunset} theme={theme} />
                  </View>
                )}
              </View>
            ) : (
              <View style={s.errorBox}>
                <Ionicons name="cloud-offline-outline" size={30} color={theme.textMuted} />
                <Text style={s.errorText}>வானிலை தகவல் கிடைக்கவில்லை</Text>
                <TouchableOpacity onPress={() => loadWeather()} activeOpacity={0.6}>
                  <Text style={s.retry}>மீண்டும் முயற்சி</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={s.footer}>G One · கணேசபுரம்</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function Stat({ icon, label, value, theme }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; theme: any;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={17} color={theme.textMuted} />
      <Text style={{ ...TYPE.bodyStrong, color: theme.text }}>{value}</Text>
      <Text style={{ ...TYPE.caption, color: theme.textMuted }}>{label}</Text>
    </View>
  );
}

function SunItem({ icon, text, theme }: {
  icon: keyof typeof Ionicons.glyphMap; text: string; theme: any;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={13} color={theme.textMuted} />
      <Text style={{ ...TYPE.caption, color: theme.textSecondary }}>{text}</Text>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  root:    { flex: 1, backgroundColor: theme.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.md },

  card: {
    backgroundColor: theme.card,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  cardHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.divider,
  },
  cardHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { ...TYPE.heading, color: theme.text },
  cardMeta:  { ...TYPE.caption, color: theme.textMuted },
  cardBody:  { padding: SPACING.md },
  cardAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider,
  },
  cardActionText: { ...TYPE.bodyStrong, color: ACCENT.primary },

  locChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.full, backgroundColor: theme.surface,
  },
  locChipOn: { backgroundColor: ACCENT.tintSoft },
  locChipText: { ...TYPE.caption, color: theme.textMuted },

  kuralLine: { ...TYPE.body, fontFamily: FONT_FAMILY.semibold, fontSize: 17, lineHeight: 30, color: theme.text },
  chip: {
    alignSelf: 'flex-start', marginTop: SPACING.sm,
    backgroundColor: ACCENT.tintSoft, borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  chipText: { ...TYPE.caption, color: ACCENT.primary },
  meaning: {
    marginTop: SPACING.md, paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider,
  },
  meaningLabel: { ...TYPE.caption, color: theme.textMuted, marginBottom: 5 },
  meaningText:  { ...TYPE.body, color: theme.textSecondary },

  place:  { ...TYPE.heading, color: theme.text },
  region: { ...TYPE.caption, color: theme.textMuted, marginTop: 2 },
  tempRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm },
  temp:   { fontSize: 56, lineHeight: 62, fontFamily: FONT_FAMILY.bold, color: theme.text, letterSpacing: -2 },
  condBlock: { alignItems: 'flex-end', gap: 4, flex: 1, paddingLeft: SPACING.md },
  cond:   { ...TYPE.caption, color: theme.textSecondary, textAlign: 'right' },

  stats: {
    flexDirection: 'row', marginTop: SPACING.md, paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider,
  },
  sunRow: {
    flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: SPACING.sm,
    marginTop: SPACING.md, paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider,
  },

  errorBox:  { alignItems: 'center', gap: 8, paddingVertical: SPACING.xl },
  errorText: { ...TYPE.label, color: theme.textMuted },
  retry:     { ...TYPE.bodyStrong, color: ACCENT.primary, marginTop: 4 },

  footer: { ...TYPE.caption, color: theme.textMuted, textAlign: 'center', marginTop: SPACING.sm },

  bdayCard: {
    backgroundColor: theme.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(255,105,180,0.35)',
    padding: SPACING.md,
  },
  bdayHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
  bdayTitle: { ...TYPE.heading, color: theme.text },
  bdayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  bdayAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,105,180,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  bdayInitial: { ...TYPE.bodyStrong, color: '#FF69B4' },
  bdayName: { ...TYPE.bodyStrong, color: theme.text },
  bdayMeta: { ...TYPE.caption, color: theme.textMuted, marginTop: 1 },
});
