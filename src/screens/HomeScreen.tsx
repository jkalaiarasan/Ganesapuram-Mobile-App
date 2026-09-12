import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, RefreshControl, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useRefreshContext } from '../context/RefreshContext';
import { ACCENT, DEEP, ON_ACCENT, SOFT_WHITE, SPACING, RADIUS, SHADOWS, FONT_FAMILY } from '../theme';
import { fetchKural, fetchWeather, logError } from '../api';
import StarBackground from '../components/StarBackground';

const { width } = Dimensions.get('window');

interface KuralData {
  number: number; line1: string; line2: string;
  porul?: string; chapter?: string;
  urai1?: string; urai2?: string;
}
interface WeatherData {
  location: { name: string; region: string };
  current: { temp_c: number; condition: { text: string }; humidity: number; wind_kph: number; feelslike_c: number };
  forecast?: { forecastday: Array<{ astro: { sunrise: string; sunset: string }; day: { maxtemp_c: number; mintemp_c: number } }> };
}

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { register, unregister } = useRefreshContext();
  const insets = useSafeAreaInsets();
  const [kural, setKural] = useState<KuralData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [kuralLoading, setKuralLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 35, friction: 8, useNativeDriver: true }),
    ]).start();
    Animated.sequence([Animated.delay(300),  Animated.timing(card1Anim, { toValue: 1, duration: 600, useNativeDriver: true })]).start();
    Animated.sequence([Animated.delay(550),  Animated.timing(card2Anim, { toValue: 1, duration: 600, useNativeDriver: true })]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.04, duration: 2500, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 2500, useNativeDriver: true }),
    ])).start();
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

  useEffect(() => { loadKural(); loadWeather(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const c = coordsRef.current;
    await Promise.all([loadKural(), loadWeather(c?.lat, c?.lon)]);
    setRefreshing(false);
  }, [loadKural, loadWeather]);

  useEffect(() => {
    register('Home', onRefresh);
    return () => unregister('Home');
  }, [onRefresh, register, unregister]);

  const weatherEmoji = (c = '') => {
    const t = c.toLowerCase();
    if (t.includes('sun') || t.includes('clear'))  return '☀️';
    if (t.includes('rain') || t.includes('drizzle')) return '🌧️';
    if (t.includes('thunder'))                      return '⛈️';
    if (t.includes('cloud'))                        return '⛅';
    if (t.includes('fog') || t.includes('mist'))   return '🌫️';
    return '🌤️';
  };

  const s = styles(theme, isDark);

  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />
      <LinearGradient colors={theme.gradients.background as any} style={StyleSheet.absoluteFill} />
      <StarBackground />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT.primary} />}>

        {/* Header */}
        <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingTop: Math.max(insets.top, 28) + 8 }]}>
          <View style={s.headerTextBlock}>
            <Text style={s.headerOverline}>G ONE COMMUNITY</Text>
            <Text style={s.headerTitle}>கணேசபுரம்</Text>
          </View>
          <LinearGradient colors={theme.gradients.accent as any} style={s.headerMark}>
            <Text style={s.headerMarkText}>G</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
          <LinearGradient colors={['transparent', ACCENT.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1 }} />
        </Animated.View>

        {/* Thirukural Card */}
        <Animated.View style={[s.cardWrap, { opacity: card1Anim, transform: [{ translateY: card1Anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
          <LinearGradient colors={theme.gradients.card as any} style={s.card}>
            <View style={s.cardInnerBorder}>
              <LinearGradient colors={theme.gradients.accent as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.badge}>
                <Text style={s.badgeText}>✦ திருக்குறள் ✦</Text>
                {kural && <Text style={s.badgeNum}>#{kural.number}</Text>}
              </LinearGradient>

              {kuralLoading ? (
                <ActivityIndicator color={ACCENT.primary} size="large" style={{ marginVertical: 32 }} />
              ) : kural ? (
                <View style={s.kuralBody}>
                  <Animated.Text style={[s.kuralLine, { transform: [{ scale: pulseAnim }] }]}>{kural.line1}</Animated.Text>
                  <Text style={s.kuralLine}>{kural.line2}</Text>
                  {kural.chapter ? (
                    <View style={s.chapterTag}>
                      <Text style={s.chapterText}>அதிகாரம்: {kural.chapter}</Text>
                    </View>
                  ) : null}
                  {kural.urai1 ? (
                    <View style={s.translationBox}>
                      <Text style={s.translationLabel}>✦ பொருள்</Text>
                      <Text style={s.translationText}>{kural.urai1}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <TouchableOpacity onPress={loadKural} style={s.nextBtn} activeOpacity={0.85}>
                <LinearGradient colors={[ACCENT.dark, ACCENT.primary, ACCENT.light]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.nextBtnInner}>
                  <Text style={s.nextBtnText}>அடுத்த குறள் ✦</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Weather Card */}
        <Animated.View style={[s.cardWrap, { opacity: card2Anim, transform: [{ translateY: card2Anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
          <LinearGradient colors={theme.gradients.card as any} style={s.card}>
            <View style={s.cardInnerBorder}>
              <LinearGradient colors={isDark ? [DEEP.deep, DEEP.primary] : [DEEP.primary, DEEP.light]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.badge}>
                <Text style={[s.badgeText, { color: SOFT_WHITE }]}>✦ வானிலை ✦</Text>
                <TouchableOpacity
                  onPress={handleLocationPress}
                  activeOpacity={0.75}
                  style={[s.locBtn, usingCurrentLocation && s.locBtnActive]}
                >
                  <Text style={s.locBtnText}>
                    {usingCurrentLocation ? '📍 என் இடம்' : '📍 இடம்'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>

              {weatherLoading ? (
                <ActivityIndicator color={ACCENT.primary} size="large" style={{ marginVertical: 32 }} />
              ) : weather ? (
                <View style={s.weatherBody}>
                  <View style={s.weatherRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.weatherLoc}>📍 {weather.location.name}</Text>
                      <Text style={s.weatherRegion}>{weather.location.region}</Text>
                      <Text style={s.weatherTemp}>{Math.round(weather.current.temp_c)}°</Text>
                      <Text style={s.weatherCond}>{weatherEmoji(weather.current.condition.text)} {weather.current.condition.text}</Text>
                    </View>
                    <View style={s.weatherStats}>
                      <WeatherStat icon="🌡" label="உணர்வு"   value={`${Math.round(weather.current.feelslike_c)}°`}  theme={theme} />
                      <WeatherStat icon="💧" label="ஈரப்பதம்" value={`${weather.current.humidity}%`}                 theme={theme} />
                      <WeatherStat icon="💨" label="காற்று"    value={`${Math.round(weather.current.wind_kph)}km/h`}  theme={theme} />
                    </View>
                  </View>
                  {weather.forecast?.forecastday[0] && (
                    <View style={s.sunRow}>
                      <Text style={s.sunText}>🌅 {weather.forecast.forecastday[0].astro.sunrise}</Text>
                      <Text style={s.sunText}>🌇 {weather.forecast.forecastday[0].astro.sunset}</Text>
                      <Text style={s.sunText}>↑{Math.round(weather.forecast.forecastday[0].day.maxtemp_c)}° ↓{Math.round(weather.forecast.forecastday[0].day.mintemp_c)}°</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🌤️</Text>
                  <Text style={[s.weatherRegion, { textAlign: 'center' }]}>வானிலை தகவல் கிடைக்கவில்லை</Text>
                  <TouchableOpacity onPress={() => loadWeather()} style={{ marginTop: 12 }}>
                    <Text style={{ color: ACCENT.primary, fontFamily: FONT_FAMILY.semibold }}>மீண்டும் முயற்சி</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', paddingBottom: SPACING.xl }}>
          <LinearGradient colors={['transparent', ACCENT.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, width: '60%', marginBottom: SPACING.md }} />
          <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: FONT_FAMILY.medium, letterSpacing: 1 }}>நன்றி. G One Mobile App Development Team ✦</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function WeatherStat({ icon, label, value, theme }: any) {
  return (
    <View style={{ alignItems: 'center', marginBottom: 10 }}>
      <Text style={{ fontSize: 14 }}>{icon}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 9, fontFamily: FONT_FAMILY.semibold, marginTop: 2 }}>{label}</Text>
      <Text style={{ color: ACCENT.light, fontSize: 13, fontFamily: FONT_FAMILY.bold }}>{value}</Text>
    </View>
  );
}

const styles = (theme: any, isDark: boolean) => StyleSheet.create({
  root:            { flex: 1, backgroundColor: theme.background },
  scroll:          { flex: 1 },
  content:         { paddingBottom: SPACING.xxl },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
  headerTextBlock: { flex: 1, paddingRight: SPACING.md },
  headerOverline:  { color: ACCENT.primary, fontSize: 11, fontFamily: FONT_FAMILY.extrabold, letterSpacing: 2.4, marginBottom: 6 },
  headerTitle:     { color: theme.text, fontSize: width < 380 ? 28 : 34, fontFamily: FONT_FAMILY.black },
  headerMark:      { width: 50, height: 50, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', ...SHADOWS.accent },
  headerMarkText:  { color: ON_ACCENT, fontSize: 24, fontFamily: FONT_FAMILY.black },
  cardWrap:        { paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  card:            { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: ACCENT.border, backgroundColor: theme.card, ...SHADOWS.card },
  cardInnerBorder: { margin: 1, borderRadius: RADIUS.xl - 1 },
  badge:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 12 },
  badgeText:       { color: ON_ACCENT, fontSize: 13, fontFamily: FONT_FAMILY.extrabold, letterSpacing: 1 },
  badgeNum:        { color: 'rgba(6,19,28,0.58)', fontSize: 12, fontFamily: FONT_FAMILY.semibold },
  kuralBody:       { padding: SPACING.lg, paddingBottom: SPACING.md },
  kuralLine:       { color: theme.text, fontSize: width < 380 ? 18 : 20, fontFamily: FONT_FAMILY.extrabold, lineHeight: 34, textAlign: 'center', marginBottom: 4 },
  chapterTag:      { alignSelf: 'center', backgroundColor: ACCENT.subtle, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4, marginTop: SPACING.sm, borderWidth: 1, borderColor: ACCENT.border },
  chapterText:     { color: ACCENT.primary, fontSize: 11, fontFamily: FONT_FAMILY.bold },
  translationBox:  { backgroundColor: isDark ? ACCENT.tintSoft : 'rgba(58,46,40,0.05)', borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md, borderLeftWidth: 3, borderLeftColor: ACCENT.primary },
  translationLabel:{ color: ACCENT.primary, fontSize: 11, fontFamily: FONT_FAMILY.extrabold, marginBottom: 4, letterSpacing: 0.5 },
  translationText: { color: theme.textSecondary, fontSize: 14, fontFamily: FONT_FAMILY.regular, lineHeight: 22, fontStyle: 'italic' },
  nextBtn:         { margin: SPACING.md, marginTop: 4, borderRadius: RADIUS.full, overflow: 'hidden' },
  nextBtnInner:    { paddingVertical: 14, alignItems: 'center', borderRadius: RADIUS.full },
  nextBtnText:     { color: ON_ACCENT, fontFamily: FONT_FAMILY.extrabold, fontSize: 14, letterSpacing: 0.5 },
  locBtn:          { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  locBtnActive:    { backgroundColor: 'rgba(74,222,128,0.25)', borderColor: '#4ADE80' },
  locBtnText:      { color: SOFT_WHITE, fontSize: 11, fontFamily: FONT_FAMILY.bold },
  weatherBody:     { padding: SPACING.lg },
  weatherRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  weatherLoc:      { color: theme.text, fontSize: 14, fontFamily: FONT_FAMILY.bold },
  weatherRegion:   { color: theme.textMuted, fontSize: 12, fontFamily: FONT_FAMILY.regular, marginBottom: 4 },
  weatherTemp:     { color: ACCENT.light, fontSize: 60, fontFamily: FONT_FAMILY.black, lineHeight: 66 },
  weatherCond:     { color: theme.textSecondary, fontSize: 13, fontFamily: FONT_FAMILY.regular, marginTop: 2 },
  weatherStats:    { alignItems: 'center', paddingTop: 8 },
  sunRow:          { flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: ACCENT.border },
  sunText:         { color: theme.textSecondary, fontSize: 11, fontFamily: FONT_FAMILY.semibold },
});
