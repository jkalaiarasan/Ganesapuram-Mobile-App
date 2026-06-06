import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import { GOLD, SPACING, RADIUS, FONTS, SHADOWS } from '../theme';
import { fetchKural, fetchWeather } from '../api';

const { width } = Dimensions.get('window');

interface KuralData {
  number: number;
  line1: string;
  line2: string;
  translation?: string;
  explanation?: string;
  chapter?: string;
}

interface WeatherData {
  location: { name: string; region: string };
  current: {
    temp_c: number;
    condition: { text: string; icon: string };
    humidity: number;
    wind_kph: number;
    feelslike_c: number;
  };
  forecast?: {
    forecastday: Array<{
      astro: { sunrise: string; sunset: string };
      day: { maxtemp_c: number; mintemp_c: number };
    }>;
  };
}

export default function HomeScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [kural, setKural] = useState<KuralData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [kuralLoading, setKuralLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadKural = useCallback(async () => {
    setKuralLoading(true);
    try {
      const data = await fetchKural();
      if (data.success) {
        const k = data.kural;
        setKural({
          number: data.number,
          line1: k.line1 || k.couplet?.split('\n')[0] || '',
          line2: k.line2 || k.couplet?.split('\n')[1] || '',
          translation: k.transliteration || k.translation || '',
          explanation: k.meaning?.en?.ainsi || k.explanation || '',
          chapter: k.chapter?.name || '',
        });
      }
    } catch {
      setKural({
        number: 1,
        line1: 'அகர முதல எழுத்தெல்லாம் ஆதி',
        line2: 'பகவன் முதற்றே உலகு.',
        translation: 'All letters begin with A; the world begins with God.',
        chapter: 'கடவுள் வாழ்த்து',
      });
    } finally {
      setKuralLoading(false);
    }
  }, []);

  const loadWeather = useCallback(async () => {
    setWeatherLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat: number | undefined;
      let lon: number | undefined;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        lat = loc.coords.latitude;
        lon = loc.coords.longitude;
      }
      const data = await fetchWeather(lat, lon);
      if (data.success) setWeather(data.data);
    } catch {
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKural();
    loadWeather();
  }, [loadKural, loadWeather]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadKural(), loadWeather()]);
    setRefreshing(false);
  }, [loadKural, loadWeather]);

  const rotateStyle = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const getWeatherEmoji = (condition: string) => {
    const c = condition?.toLowerCase() || '';
    if (c.includes('sun') || c.includes('clear')) return '☀️';
    if (c.includes('cloud')) return '⛅';
    if (c.includes('rain')) return '🌧️';
    if (c.includes('thunder')) return '⛈️';
    if (c.includes('fog') || c.includes('mist')) return '🌫️';
    return '🌤️';
  };

  const s = styles(theme, isDark);

  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />
      <LinearGradient colors={theme.gradients.background as [string, string, string]} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD.primary} />}
      >
        {/* Header */}
        <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={s.headerSub}>UPR நட்பு சாம்ராஜ்யம்</Text>
            <Text style={s.headerTitle}>கணேசாபுரம்</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={s.themeBtn}>
            <Text style={s.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Gold Divider */}
        <Animated.View style={[s.divider, { opacity: fadeAnim }]}>
          <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.dividerLine} />
        </Animated.View>

        {/* Thirukural Card */}
        <Animated.View style={[s.cardWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={theme.gradients.card as [string, string]} style={s.card}>
            <LinearGradient colors={theme.gradients.gold as [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cardBadge}>
              <Text style={s.cardBadgeText}>திருக்குறள்</Text>
              {kural && <Text style={s.kuralNumber}>#{kural.number}</Text>}
            </LinearGradient>

            {kuralLoading ? (
              <ActivityIndicator color={GOLD.primary} size="large" style={{ marginVertical: 32 }} />
            ) : kural ? (
              <View style={s.kuralBody}>
                <Animated.Text style={[s.kuralLine, { transform: [{ scale: pulseAnim }] }]}>
                  {kural.line1}
                </Animated.Text>
                <Text style={s.kuralLine}>{kural.line2}</Text>
                {kural.chapter ? (
                  <View style={s.chapterTag}>
                    <Text style={s.chapterText}>அதிகாரம்: {kural.chapter}</Text>
                  </View>
                ) : null}
                {kural.translation ? (
                  <View style={s.translationBox}>
                    <Text style={s.translationLabel}>பொருள்</Text>
                    <Text style={s.translationText}>{kural.translation}</Text>
                  </View>
                ) : null}
                {kural.explanation ? (
                  <Text style={s.explanation}>{kural.explanation}</Text>
                ) : null}
              </View>
            ) : null}

            <TouchableOpacity onPress={loadKural} style={s.refreshBtn}>
              <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={s.refreshBtnInner}>
                <Text style={s.refreshBtnText}>மற்றொரு குறள் →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Weather Card */}
        <Animated.View style={[s.cardWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={theme.gradients.card as [string, string]} style={s.card}>
            <LinearGradient colors={['#1e3a5f', '#2563eb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cardBadge}>
              <Text style={[s.cardBadgeText, { color: '#fff' }]}>வானிலை</Text>
            </LinearGradient>

            {weatherLoading ? (
              <ActivityIndicator color={GOLD.primary} size="large" style={{ marginVertical: 32 }} />
            ) : weather ? (
              <View style={s.weatherBody}>
                <View style={s.weatherTop}>
                  <View>
                    <Text style={s.weatherLocation}>
                      📍 {weather.location.name}
                    </Text>
                    <Text style={s.weatherRegion}>{weather.location.region}</Text>
                    <Text style={s.weatherTemp}>{Math.round(weather.current.temp_c)}°C</Text>
                    <Text style={s.weatherCondition}>
                      {getWeatherEmoji(weather.current.condition.text)} {weather.current.condition.text}
                    </Text>
                  </View>
                  <View style={s.weatherDetails}>
                    <WeatherStat label="உணர்வு" value={`${Math.round(weather.current.feelslike_c)}°`} theme={theme} />
                    <WeatherStat label="ஈரப்பதம்" value={`${weather.current.humidity}%`} theme={theme} />
                    <WeatherStat label="காற்று" value={`${Math.round(weather.current.wind_kph)} kmph`} theme={theme} />
                  </View>
                </View>
                {weather.forecast?.forecastday[0] && (
                  <View style={s.sunRow}>
                    <Text style={s.sunText}>🌅 {weather.forecast.forecastday[0].astro.sunrise}</Text>
                    <Text style={s.sunText}>🌇 {weather.forecast.forecastday[0].astro.sunset}</Text>
                    <Text style={s.sunText}>
                      ↑{Math.round(weather.forecast.forecastday[0].day.maxtemp_c)}° ↓{Math.round(weather.forecast.forecastday[0].day.mintemp_c)}°
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={s.weatherError}>வானிலை தகவல் கிடைக்கவில்லை</Text>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[s.footer, { opacity: fadeAnim }]}>
          <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.dividerLine} />
          <Text style={s.footerText}>நன்றி. UPR நட்பு சாம்ராஜ்யம்</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function WeatherStat({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={{ alignItems: 'center', marginBottom: 8 }}>
      <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: GOLD.light, fontSize: 14, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    scroll: { flex: 1 },
    content: { paddingBottom: SPACING.xxl },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingTop: 56,
      paddingBottom: SPACING.md,
    },
    headerSub: {
      color: GOLD.primary,
      fontSize: 12,
      fontWeight: FONTS.semibold,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    headerTitle: {
      color: theme.text,
      fontSize: 28,
      fontWeight: FONTS.black,
      letterSpacing: -0.5,
    },
    themeBtn: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.full,
      backgroundColor: GOLD.subtle,
      borderWidth: 1,
      borderColor: GOLD.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeIcon: { fontSize: 20 },
    divider: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
    dividerLine: { height: 1, borderRadius: 1 },
    cardWrap: { paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
    card: {
      borderRadius: RADIUS.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: GOLD.border,
      ...SHADOWS.card,
    },
    cardBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    cardBadgeText: {
      color: '#1A1020',
      fontSize: 13,
      fontWeight: FONTS.bold,
      letterSpacing: 1,
    },
    kuralNumber: {
      color: 'rgba(26,16,32,0.6)',
      fontSize: 12,
      fontWeight: FONTS.medium,
    },
    kuralBody: { padding: SPACING.md },
    kuralLine: {
      color: theme.text,
      fontSize: 20,
      fontWeight: FONTS.bold,
      lineHeight: 32,
      textAlign: 'center',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    chapterTag: {
      alignSelf: 'center',
      backgroundColor: GOLD.subtle,
      borderRadius: RADIUS.full,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginTop: SPACING.sm,
      borderWidth: 1,
      borderColor: GOLD.border,
    },
    chapterText: {
      color: GOLD.primary,
      fontSize: 11,
      fontWeight: FONTS.semibold,
    },
    translationBox: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginTop: SPACING.sm,
      borderLeftWidth: 3,
      borderLeftColor: GOLD.primary,
    },
    translationLabel: {
      color: GOLD.primary,
      fontSize: 11,
      fontWeight: FONTS.bold,
      marginBottom: 4,
      letterSpacing: 1,
    },
    translationText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 22,
      fontStyle: 'italic',
    },
    explanation: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 20,
      marginTop: SPACING.sm,
      textAlign: 'center',
    },
    refreshBtn: { margin: SPACING.md, marginTop: 0, borderRadius: RADIUS.full, overflow: 'hidden' },
    refreshBtnInner: { paddingVertical: 12, alignItems: 'center', borderRadius: RADIUS.full },
    refreshBtnText: { color: '#fff', fontWeight: FONTS.bold, fontSize: 14 },
    weatherBody: { padding: SPACING.md },
    weatherTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    weatherLocation: { color: theme.text, fontSize: 15, fontWeight: FONTS.semibold },
    weatherRegion: { color: theme.textMuted, fontSize: 12, marginBottom: SPACING.sm },
    weatherTemp: { color: GOLD.light, fontSize: 52, fontWeight: FONTS.black, lineHeight: 60 },
    weatherCondition: { color: theme.textSecondary, fontSize: 14, marginTop: 4 },
    weatherDetails: { alignItems: 'flex-end' },
    sunRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: SPACING.md,
      paddingTop: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    },
    sunText: { color: theme.textSecondary, fontSize: 12, fontWeight: FONTS.medium },
    weatherError: { color: theme.textMuted, textAlign: 'center', padding: SPACING.xl },
    footer: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, alignItems: 'center', gap: SPACING.sm },
    footerText: { color: theme.textMuted, fontSize: 12, letterSpacing: 0.5 },
  });
