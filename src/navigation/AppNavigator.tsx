import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  Animated, ScrollView, Dimensions, Platform, BackHandler,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import MembersScreen from '../screens/MembersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useRefreshContext } from '../context/RefreshContext';
import {
  useNotifications,
  formatRelativeTime,
  extractIcon,
  StoredNotification,
} from '../context/NotificationContext';
import { ACCENT, ON_ACCENT, SOFT_WHITE, SPACING, RADIUS, SHADOWS, FONT_FAMILY } from '../theme';

const { height } = Dimensions.get('window');

// ── Single notification row ───────────────────────────────────────────────────
function NotifRow({
  item, index, theme, onTap,
}: {
  item: StoredNotification; index: number; theme: any;
  onTap: () => void;
}) {
  const anim  = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 300, delay: index * 45, useNativeDriver: true }).start();
  }, []);

  const { icon, cleanTitle } = extractIcon(item.title);
  const isUnread = !item.viewed;

  const onPressIn  = () => Animated.spring(press, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(press, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
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
          colors={theme.gradients.row as any}
          style={[
            np.row,
            { borderLeftColor: isUnread ? ACCENT.primary : theme.border,
              opacity: item.viewed ? 0.65 : 1 },
          ]}
        >
          <View style={[np.iconBox, { backgroundColor: isUnread ? ACCENT.tintStrong : ACCENT.tintSoft }]}>
            <Text style={{ fontSize: 18 }}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text
                style={[np.rowTitle, { color: isUnread ? theme.text : theme.textSecondary }]}
                numberOfLines={1}
              >
                {cleanTitle}
              </Text>
              <Text style={np.rowTime}>{formatRelativeTime(item.receivedAt)}</Text>
            </View>
            <Text style={[np.rowBody, { color: theme.textMuted }]} numberOfLines={2}>{item.body}</Text>
          </View>
          {isUnread && <View style={np.unreadDot} />}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Notification panel ────────────────────────────────────────────────────────
function NotifPanel({ visible, onClose, isDark, theme }: {
  visible: boolean; onClose: () => void; isDark: boolean; theme: any;
}) {
  const insets   = useSafeAreaInsets();
  const slideY   = useRef(new Animated.Value(-height)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  const { notifications, unreadCount, markViewed, markAllViewed, clearAll } = useNotifications();

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slideY,   { toValue: 0, tension: 52, friction: 12, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY,   { toValue: -height, duration: 280, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  const isEmpty = notifications.length === 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)', opacity: bgOpacity }]}
        pointerEvents="auto"
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[np.panel, { backgroundColor: theme.background, transform: [{ translateY: slideY }] }]}
        pointerEvents="auto"
      >
        {/* Top accent stripe */}
        <LinearGradient colors={[ACCENT.dark, ACCENT.primary, ACCENT.light, ACCENT.primary, ACCENT.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />

        {/* Header */}
        <LinearGradient colors={theme.gradients.header as any} style={[np.header, { paddingTop: Math.max(insets.top + 8, 24) }]}>
          <View>
            <Text style={[np.title, { color: theme.text }]}>அறிவிப்புகள்</Text>
            <Text style={np.sub}>NOTIFICATIONS</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {unreadCount > 0 && (
              <LinearGradient colors={[ACCENT.dark, ACCENT.primary]} style={np.badge}>
                <Text style={np.badgeText}>{unreadCount} புதியவை</Text>
              </LinearGradient>
            )}
            {/* Close button */}
            <TouchableOpacity onPress={onClose} activeOpacity={0.75} style={{ borderRadius: RADIUS.full, overflow: 'hidden' }}>
              <LinearGradient colors={[ACCENT.dark, ACCENT.primary]} style={np.closeBtn}>
                <Text style={{ color: ON_ACCENT, fontSize: 13, fontFamily: FONT_FAMILY.black }}>✕</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Action row — mark all read + clear all */}
        {!isEmpty && (
          <View style={[np.actionRow, { backgroundColor: isDark ? '#101724' : '#E2E5EC', borderBottomColor: ACCENT.border }]}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllViewed} activeOpacity={0.7} style={np.actionBtn}>
                <Text style={[np.actionText, { color: ACCENT.primary }]}>✓ அனைத்தும் படிக்கப்பட்டது</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={clearAll} activeOpacity={0.7} style={np.actionBtn}>
              <Text style={[np.actionText, { color: isDark ? '#FF6B6B' : '#DC2626' }]}>🗑 அனைத்தையும் நீக்கு</Text>
            </TouchableOpacity>
          </View>
        )}

        <LinearGradient colors={['transparent', ACCENT.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1 }} />

        {/* List */}
        <ScrollView
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xl, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {isEmpty ? (
            <View style={np.empty}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>🔔</Text>
              <Text style={[np.emptyText, { color: theme.textMuted }]}>அறிவிப்புகள் இல்லை</Text>
            </View>
          ) : (
            notifications.map((item, i) => (
              <NotifRow
                key={item.id}
                item={item}
                index={i}
                theme={theme}
                onTap={() => markViewed(item.id)}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const np = StyleSheet.create({
  panel:      { position: 'absolute', top: 0, left: 0, right: 0, maxHeight: height * 0.78, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden', elevation: 20 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
  title:      { fontSize: 22, fontFamily: FONT_FAMILY.black, letterSpacing: 0 },
  sub:        { color: ACCENT.primary, fontSize: 10, fontFamily: FONT_FAMILY.bold, letterSpacing: 2, marginTop: 2 },
  badge:      { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText:  { color: ON_ACCENT, fontSize: 11, fontFamily: FONT_FAMILY.extrabold },
  closeBtn:   { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  actionRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: 10, borderBottomWidth: 1 },
  actionBtn:  { paddingVertical: 2, paddingHorizontal: 4 },
  actionText: { fontSize: 12, fontFamily: FONT_FAMILY.semibold },
  row:        { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: ACCENT.border, borderLeftWidth: 3, padding: SPACING.sm },
  iconBox:    { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowTitle:   { fontSize: 13, fontFamily: FONT_FAMILY.bold, flex: 1, marginRight: 6 },
  rowTime:    { color: '#8A8F98', fontSize: 10, fontFamily: FONT_FAMILY.medium, flexShrink: 0 },
  rowBody:    { fontSize: 11, fontFamily: FONT_FAMILY.regular, lineHeight: 16 },
  unreadDot:  { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT.primary },
  empty:      { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl },
  emptyText:  { fontSize: 14, fontFamily: FONT_FAMILY.semibold, marginBottom: 8 },
  emptySubText:{ fontSize: 11, fontFamily: FONT_FAMILY.regular, textAlign: 'center', lineHeight: 17, paddingHorizontal: SPACING.md },
});

const Tab = createBottomTabNavigator();

// ── Floating dock tab bar ───────────────────────────────────────────────────────
// Replaces the old edge-to-edge docked bar: an inset, fully-rounded floating
// pill. Inactive tabs show icon-only; the focused tab expands into an
// icon+label capsule filled with the accent gradient.
const TAB_META: Record<string, { emoji: string; label: string }> = {
  Home: { emoji: '🏠', label: 'முகப்பு' },
  Members: { emoji: '👥', label: 'உறுப்பினர்' },
};

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const { isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        tb.wrap,
        {
          backgroundColor: theme.background,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0) + 10,
        },
      ]}
    >
      <View style={[tb.bar, { backgroundColor: theme.cardElevated, borderColor: ACCENT.border, ...SHADOWS.card }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = route.name === 'Profile'
            ? { emoji: isLoggedIn ? '✅' : '👤', label: isLoggedIn ? 'சுயவிவரம்' : 'உள்நுழைவு' }
            : TAB_META[route.name] ?? { emoji: '•', label: route.name };

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.8} style={tb.item}>
              {focused ? (
                <LinearGradient colors={[ACCENT.dark, ACCENT.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tb.activePill}>
                  <Text style={tb.emoji}>{meta.emoji}</Text>
                  <Text style={tb.activeLabel} numberOfLines={1}>{meta.label}</Text>
                </LinearGradient>
              ) : (
                <View style={tb.inactiveItem}>
                  <Text style={[tb.emoji, { opacity: 0.5 }]}>{meta.emoji}</Text>
                  {route.name === 'Profile' && isLoggedIn && <View style={tb.dot} />}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── App navigator ─────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { unreadCount, pendingOpenPanel, clearPendingOpen } = useNotifications();
  const { refresh } = useRefreshContext();
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const reloadAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const handleReload = () => {
    reloadAnim.setValue(0);
    Animated.timing(reloadAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start(() => {
      reloadAnim.setValue(0);
    });
    refresh(activeTab);
  };

  // Auto-open panel when user taps a notification from the OS tray
  useEffect(() => {
    if (pendingOpenPanel) {
      setNotifOpen(true);
      clearPendingOpen();
    }
  }, [pendingOpenPanel]);

  // Close notification panel on Android hardware back button press
  useEffect(() => {
    if (!notifOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setNotifOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [notifOpen]);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Tab.Navigator
          screenListeners={({ route }) => ({
            focus: () => setActiveTab(route.name),
          })}
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <FloatingTabBar {...props} />}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Members" component={MembersScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      {/* ── Floating buttons ── */}
      <View style={[ts.fab, { top: Math.max(insets.top, 28) + 4 }]} pointerEvents={notifOpen ? 'none' : 'box-none'}>
        <Animated.View style={{ opacity: notifOpen ? 0 : 1, gap: 12 }}>
          {/* Notification bell */}
          <TouchableOpacity onPress={() => setNotifOpen(true)} activeOpacity={0.8} style={ts.fabBtn}>
            <LinearGradient colors={[ACCENT.dark, ACCENT.primary]} style={ts.fabBtnInner}>
              <Text style={ts.fabIcon}>🔔</Text>
            </LinearGradient>
            {unreadCount > 0 && (
              <View style={ts.notifBadge}>
                <Text style={ts.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Reload current page */}
          <TouchableOpacity onPress={handleReload} activeOpacity={0.8} style={ts.fabBtn}>
            <LinearGradient colors={[ACCENT.dark, ACCENT.primary]} style={ts.fabBtnInner}>
              <Animated.Text style={[ts.fabReloadIcon, { transform: [{ rotate: reloadAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
                ↻
              </Animated.Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Dark / light toggle */}
          <TouchableOpacity onPress={toggleTheme} activeOpacity={0.8} style={ts.fabBtn}>
            <LinearGradient colors={[ACCENT.dark, ACCENT.primary]} style={ts.fabBtnInner}>
              <Text style={ts.fabIcon}>{isDark ? '☀️' : '🌙'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <NotifPanel visible={notifOpen} onClose={() => setNotifOpen(false)} isDark={isDark} theme={theme} />
    </View>
  );
}

const ts = StyleSheet.create({
  fab:            { position: 'absolute', top: 52, right: 14, zIndex: 100, elevation: 20 },
  fabBtn:         { borderRadius: RADIUS.full, ...SHADOWS.accent },
  fabBtnInner:    { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: ACCENT.border },
  fabIcon:        { fontSize: 18 },
  fabReloadIcon:  { fontSize: 24, color: ON_ACCENT, fontWeight: '900', lineHeight: 28 },
  notifBadge:     { position: 'absolute', top: -3, right: -3, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: '#fff', fontSize: 9, fontFamily: FONT_FAMILY.extrabold },
  errorPulse:     { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff' },
});

const tb = StyleSheet.create({
  wrap:          { paddingHorizontal: SPACING.lg, paddingTop: 10 },
  bar:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: RADIUS.full, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 8 },
  item:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activePill:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: RADIUS.full },
  inactiveItem:  { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  emoji:         { fontSize: 18 },
  activeLabel:   { fontSize: 12, fontFamily: FONT_FAMILY.bold, color: ON_ACCENT },
  dot:           { position: 'absolute', top: 2, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
});

