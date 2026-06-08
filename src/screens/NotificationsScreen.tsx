import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  Dimensions, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import {
  useNotifications,
  StoredNotification,
  formatRelativeTime,
  extractIcon,
} from '../context/NotificationContext';
import { GOLD, SPACING, RADIUS, SHADOWS, FONT_FAMILY } from '../theme';
import StarBackground from '../components/StarBackground';

// ── Group notifications by day ────────────────────────────────────────────────
function groupByDay(notifications: StoredNotification[]) {
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo   = new Date(today); weekAgo.setDate(today.getDate() - 7);

  const groups: { label: string; items: StoredNotification[] }[] = [
    { label: 'இன்று',       items: [] },
    { label: 'நேற்று',      items: [] },
    { label: 'இந்த வாரம்', items: [] },
    { label: 'பழைய',        items: [] },
  ];

  for (const n of notifications) {
    const d = new Date(n.receivedAt); d.setHours(0, 0, 0, 0);
    if (d >= today)          groups[0].items.push(n);
    else if (d >= yesterday) groups[1].items.push(n);
    else if (d >= weekAgo)   groups[2].items.push(n);
    else                     groups[3].items.push(n);
  }

  return groups.filter(g => g.items.length > 0);
}

// ── Single notification card ──────────────────────────────────────────────────
function NotifCard({
  item, index, theme, isDark, onTap,
}: {
  item: StoredNotification; index: number; theme: any; isDark: boolean; onTap: () => void;
}) {
  const anim  = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 420, delay: index * 70, useNativeDriver: true }).start();
  }, []);

  const { icon, cleanTitle } = extractIcon(item.title);
  const isUnread = !item.viewed;

  const onPressIn  = () => Animated.spring(press, { toValue: 0.98, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(press, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) },
        { scale: press },
      ],
      marginBottom: SPACING.sm,
    }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onTap}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <LinearGradient
          colors={theme.gradients.card}
          style={[
            s.card,
            { borderLeftColor: isUnread ? GOLD.primary : (isDark ? '#2A2A2A' : '#D4B87A'),
              opacity: item.viewed ? 0.7 : 1,
              ...SHADOWS.card },
          ]}
        >
          {isUnread && <View style={[s.unreadDot, { backgroundColor: GOLD.primary }]} />}

          <View style={[s.iconWrap, { backgroundColor: isUnread ? 'rgba(201,162,39,0.18)' : 'rgba(201,162,39,0.08)' }]}>
            <Text style={{ fontSize: 22 }}>{icon}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={s.titleRow}>
              <Text
                style={[s.title, { color: isUnread ? theme.text : theme.textSecondary }]}
                numberOfLines={1}
              >
                {cleanTitle}
              </Text>
              <Text style={[s.time, { color: theme.textMuted }]}>{formatRelativeTime(item.receivedAt)}</Text>
            </View>
            <Text style={[s.body, { color: theme.textMuted }]} numberOfLines={2}>{item.body}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <View style={s.sectionRow}>
      <LinearGradient colors={[GOLD.dark, GOLD.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.sectionLine} />
      <Text style={s.sectionLabel}>{label}</Text>
      <LinearGradient colors={[GOLD.primary, GOLD.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.sectionLine} />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, markViewed, markAllViewed, clearAll } = useNotifications();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 35, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const groups = groupByDay(notifications);
  const isEmpty = notifications.length === 0;

  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />
      <LinearGradient colors={theme.gradients.background as any} style={StyleSheet.absoluteFill} />
      <StarBackground />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingTop: insets.top + 8 }]}>
          <View>
            <Text style={[s.headerTitle, { color: theme.text }]}>அறிவிப்புகள்</Text>
            <Text style={s.headerSub}>NOTIFICATIONS</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {unreadCount > 0 && (
              <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={s.badge}>
                <Text style={s.badgeText}>{unreadCount} புதியவை</Text>
              </LinearGradient>
            )}
          </View>
        </Animated.View>

        {/* Divider */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm }}>
          <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1 }} />
        </Animated.View>

        {/* Action buttons */}
        {!isEmpty && (
          <Animated.View style={[s.actionRow, { opacity: fadeAnim }]}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllViewed} activeOpacity={0.7} style={[s.actionBtn, { borderColor: GOLD.border }]}>
                <Text style={[s.actionBtnText, { color: GOLD.primary }]}>✓ அனைத்தும் படிக்கப்பட்டது</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={clearAll} activeOpacity={0.7} style={[s.actionBtn, { borderColor: isDark ? 'rgba(239,68,68,0.35)' : 'rgba(220,38,38,0.3)' }]}>
              <Text style={[s.actionBtnText, { color: isDark ? '#FF6B6B' : '#DC2626' }]}>🗑 அனைத்தையும் நீக்கு</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Empty state */}
        {isEmpty && (
          <Animated.View style={[s.empty, { opacity: fadeAnim }]}>
            <Text style={{ fontSize: 52, marginBottom: 14 }}>🔔</Text>
            <Text style={[s.emptyTitle, { color: theme.textSecondary }]}>அறிவிப்புகள் இல்லை</Text>
            <Text style={[s.emptyBody, { color: theme.textMuted }]}>
              Salesforce-ல் Notification__c record உருவாக்கும்போது push notification வரும், அது இங்கு சேமிக்கப்படும்.
            </Text>
            <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.emptyDivider} />
            <Text style={[s.emptyHint, { color: theme.textMuted }]}>NotificationTrigger → ExpoPushNotificationController → Expo Push API → Mobile</Text>
          </Animated.View>
        )}

        {/* Grouped notifications */}
        {groups.map((group, gi) => (
          <Animated.View key={group.label} style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingHorizontal: SPACING.md }}>
            <SectionLabel label={group.label} />
            {group.items.map((item, i) => (
              <NotifCard
                key={item.id}
                item={item}
                index={gi * 10 + i}
                theme={theme}
                isDark={isDark}
                onTap={() => markViewed(item.id)}
              />
            ))}
          </Animated.View>
        ))}

        {/* Footer */}
        {!isEmpty && (
          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', paddingBottom: SPACING.xxl, paddingTop: SPACING.lg }}>
            <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, width: '60%', marginBottom: SPACING.md }} />
            <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: FONT_FAMILY.medium, letterSpacing: 1 }}>
              ✦  UPR நட்பு சாம்ராஜ்யம்  ✦
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  scroll:       { paddingBottom: SPACING.xxl },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
  headerTitle:  { fontSize: 30, fontFamily: FONT_FAMILY.black, letterSpacing: -0.5 },
  headerSub:    { color: GOLD.primary, fontSize: 10, fontFamily: FONT_FAMILY.bold, letterSpacing: 2.5, marginTop: 2 },
  badge:        { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText:    { color: '#1A0F00', fontSize: 12, fontFamily: FONT_FAMILY.extrabold },
  actionRow:    { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, flexWrap: 'wrap' },
  actionBtn:    { borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  actionBtnText:{ fontSize: 12, fontFamily: FONT_FAMILY.semibold },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, marginTop: SPACING.sm, gap: SPACING.sm },
  sectionLine:  { flex: 1, height: 1 },
  sectionLabel: { color: GOLD.primary, fontSize: 11, fontFamily: FONT_FAMILY.extrabold, letterSpacing: 1.5 },
  card:         {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: GOLD.border,
    borderLeftWidth: 3, padding: SPACING.md,
  },
  unreadDot:    { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
  iconWrap:     { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  titleRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title:        { fontSize: 14, fontFamily: FONT_FAMILY.bold, flex: 1, marginRight: 8 },
  time:         { fontSize: 10, fontFamily: FONT_FAMILY.medium, flexShrink: 0 },
  body:         { fontSize: 13, fontFamily: FONT_FAMILY.regular, lineHeight: 19 },
  empty:        { alignItems: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.xl },
  emptyTitle:   { fontSize: 18, fontFamily: FONT_FAMILY.bold, marginBottom: 10, textAlign: 'center' },
  emptyBody:    { fontSize: 13, fontFamily: FONT_FAMILY.regular, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.xl },
  emptyDivider: { height: 2, width: 80, borderRadius: 2, marginBottom: SPACING.md },
  emptyHint:    { fontSize: 10, fontFamily: FONT_FAMILY.medium, textAlign: 'center', lineHeight: 16, opacity: 0.6 },
});

export { NotificationsScreen as default };
