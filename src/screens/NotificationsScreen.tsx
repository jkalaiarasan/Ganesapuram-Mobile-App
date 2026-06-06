import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { GOLD, SPACING, RADIUS, SHADOWS } from '../theme';
import StarBackground from '../components/StarBackground';

const { width } = Dimensions.get('window');

interface Notification {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  type: 'announcement' | 'member' | 'event' | 'info';
}

const STATIC_NOTIFICATIONS: { section: string; items: Notification[] }[] = [
  {
    section: 'இன்று',
    items: [
      {
        id: '1',
        icon: '📢',
        title: 'குழு கூட்டம் அறிவிப்பு',
        body: 'இந்த ஞாயிற்றுக்கிழமை மாலை 5 மணிக்கு மாதாந்திர கூட்டம் நடைபெறும். அனைவரும் கலந்துகொள்ள அழைக்கிறோம்.',
        time: '2 மணி நேரம் முன்பு',
        unread: true,
        type: 'announcement',
      },
      {
        id: '2',
        icon: '🎉',
        title: 'புதிய உறுப்பினர் வரவேற்பு',
        body: 'திரு. ரவிக்குமார் நம் குழுவில் புதிதாக இணைந்துள்ளார். அனைவரும் வரவேற்கிறோம்!',
        time: '5 மணி நேரம் முன்பு',
        unread: true,
        type: 'member',
      },
    ],
  },
  {
    section: 'நேற்று',
    items: [
      {
        id: '3',
        icon: '🏆',
        title: 'நிகழ்ச்சி நினைவூட்டல்',
        body: 'வரும் திங்கட்கிழமை கலாச்சார நிகழ்ச்சி. பதிவு செய்துகொள்ள இறுதி நாள் இன்றோடு முடிவடைகிறது.',
        time: 'நேற்று மாலை 6:30',
        unread: true,
        type: 'event',
      },
      {
        id: '4',
        icon: '📸',
        title: 'புகைப்பட தொகுப்பு',
        body: 'கடந்த மாதம் நடைபெற்ற பொங்கல் விழாவின் புகைப்படங்கள் பதிவேற்றப்பட்டுள்ளன.',
        time: 'நேற்று மதியம் 2:15',
        unread: false,
        type: 'info',
      },
    ],
  },
  {
    section: 'கடந்த வாரம்',
    items: [
      {
        id: '5',
        icon: '💰',
        title: 'சேமிப்பு திட்டம்',
        body: 'இம்மாத சேமிப்பு தொகை செலுத்தும் கடைசி நாள் மாதம் 15. தவறவிட வேண்டாம்.',
        time: '3 நாள் முன்பு',
        unread: false,
        type: 'announcement',
      },
      {
        id: '6',
        icon: '🌟',
        title: 'UPR நட்பு சாம்ராஜ்யம்',
        body: 'UPR குழுவில் நீங்கள் பதிவு செய்யப்பட்டுள்ளீர்கள். நன்றி! உங்கள் உறுப்பினர் அட்டை விரைவில் வழங்கப்படும்.',
        time: '5 நாள் முன்பு',
        unread: false,
        type: 'info',
      },
    ],
  },
];

const UNREAD_COUNT = STATIC_NOTIFICATIONS
  .flatMap(s => s.items)
  .filter(n => n.unread).length;

const TYPE_COLORS: Record<string, string> = {
  announcement: '#C9A227',
  member:       '#4ADE80',
  event:        '#60A5FA',
  info:         '#A78BFA',
};

function NotifCard({ item, index }: { item: Notification; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 420,
      delay: index * 80, useNativeDriver: true,
    }).start();
  }, []);

  const accentColor = TYPE_COLORS[item.type] || GOLD.primary;

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      marginBottom: SPACING.sm,
    }}>
      <LinearGradient
        colors={['rgba(28,20,8,0.92)', 'rgba(17,12,3,0.88)']}
        style={[styles.card, { borderLeftColor: accentColor }]}
      >
        {/* Unread dot */}
        {item.unread && <View style={[styles.unreadDot, { backgroundColor: accentColor }]} />}

        <View style={[styles.iconWrap, { backgroundColor: `${accentColor}22` }]}>
          <Text style={{ fontSize: 22 }}>{item.icon}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, item.unread && { color: '#F5ECD7' }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const { theme, isDark } = useTheme();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 35, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />
      <LinearGradient colors={theme.gradients.background as any} style={StyleSheet.absoluteFill} />
      <StarBackground />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={[s.headerTitle, { color: theme.text }]}>அறிவிப்புகள்</Text>
            <Text style={s.headerSub}>NOTIFICATIONS</Text>
          </View>
          {UNREAD_COUNT > 0 && (
            <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={s.badge}>
              <Text style={s.badgeText}>{UNREAD_COUNT} புதியவை</Text>
            </LinearGradient>
          )}
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
          <LinearGradient
            colors={['transparent', GOLD.primary, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ height: 1 }}
          />
        </Animated.View>

        {/* Sections */}
        {STATIC_NOTIFICATIONS.map((section, si) => (
          <Animated.View
            key={section.section}
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingHorizontal: SPACING.md }}
          >
            {/* Section label */}
            <View style={s.sectionRow}>
              <LinearGradient
                colors={[GOLD.dark, GOLD.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.sectionLine}
              />
              <Text style={s.sectionLabel}>{section.section}</Text>
              <LinearGradient
                colors={[GOLD.primary, GOLD.dark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.sectionLine}
              />
            </View>

            {section.items.map((item, i) => (
              <NotifCard key={item.id} item={item} index={si * 4 + i} />
            ))}
          </Animated.View>
        ))}

        {/* Footer */}
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', paddingBottom: SPACING.xxl, paddingTop: SPACING.lg }}>
          <LinearGradient
            colors={['transparent', GOLD.primary, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ height: 1, width: '60%', marginBottom: SPACING.md }}
          />
          <Text style={{ color: theme.textMuted, fontSize: 11, letterSpacing: 1 }}>
            ✦  UPR நட்பு சாம்ராஜ்யம்  ✦
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  scroll:       { paddingBottom: SPACING.xxl },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
  headerTitle:  { fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  headerSub:    { color: GOLD.primary, fontSize: 10, fontWeight: '700', letterSpacing: 2.5, marginTop: 2 },
  badge:        { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText:    { color: '#1A0F00', fontSize: 12, fontWeight: '800' },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, marginTop: SPACING.sm, gap: SPACING.sm },
  sectionLine:  { flex: 1, height: 1 },
  sectionLabel: { color: GOLD.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  card:         {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: GOLD.border,
    borderLeftWidth: 3, padding: SPACING.md,
    ...SHADOWS.gold,
  },
  unreadDot:    { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
  iconWrap:     { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  titleRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title:        { color: '#C4A882', fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  time:         { color: '#7A6040', fontSize: 10, fontWeight: '500', flexShrink: 0 },
  body:         { color: '#7A6040', fontSize: 13, lineHeight: 19 },
});

// Export unread count for badge use in navigator
export { UNREAD_COUNT };
