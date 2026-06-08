import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  Animated, ScrollView, Dimensions, Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
import { GOLD, SPACING, RADIUS, SHADOWS, FONT_FAMILY } from '../theme';

const { height } = Dimensions.get('window');

// ── Single notification row ───────────────────────────────────────────────────
function NotifRow({
  item, index, isDark, theme, onTap,
}: {
  item: StoredNotification; index: number; isDark: boolean; theme: any;
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
          colors={isDark
            ? ['rgba(22,22,22,0.96)', 'rgba(16,16,16,0.93)']
            : ['rgba(255,255,255,0.98)', 'rgba(248,248,250,0.96)']}
          style={[
            np.row,
            { borderLeftColor: isUnread ? GOLD.primary : (isDark ? '#2A2A2A' : '#D4B87A'),
              opacity: item.viewed ? 0.65 : 1 },
          ]}
        >
          <View style={[np.iconBox, { backgroundColor: isUnread ? 'rgba(201,162,39,0.18)' : 'rgba(201,162,39,0.07)' }]}>
            <Text style={{ fontSize: 18 }}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text
                style={[np.rowTitle, { color: isUnread ? (isDark ? '#FFFFFF' : '#111111') : theme.textSecondary }]}
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
        style={[np.panel, { backgroundColor: isDark ? '#0C0C0C' : '#FFFFFF', transform: [{ translateY: slideY }] }]}
        pointerEvents="auto"
      >
        {/* Top gold stripe */}
        <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light, GOLD.primary, GOLD.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />

        {/* Header */}
        <LinearGradient colors={isDark ? ['#161616', '#0E0E0E'] : ['#FFFFFF', '#F8F8FA']} style={[np.header, { paddingTop: Math.max(insets.top + 8, 24) }]}>
          <View>
            <Text style={[np.title, { color: theme.text }]}>அறிவிப்புகள்</Text>
            <Text style={np.sub}>NOTIFICATIONS</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {unreadCount > 0 && (
              <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={np.badge}>
                <Text style={np.badgeText}>{unreadCount} புதியவை</Text>
              </LinearGradient>
            )}
            {/* Close button */}
            <TouchableOpacity onPress={onClose} activeOpacity={0.75} style={{ borderRadius: RADIUS.full, overflow: 'hidden' }}>
              <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={np.closeBtn}>
                <Text style={{ color: '#1A0F00', fontSize: 13, fontFamily: FONT_FAMILY.black }}>✕</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Action row — mark all read + clear all */}
        {!isEmpty && (
          <View style={[np.actionRow, { backgroundColor: isDark ? '#111111' : '#F8F8FA', borderBottomColor: GOLD.border }]}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllViewed} activeOpacity={0.7} style={np.actionBtn}>
                <Text style={[np.actionText, { color: GOLD.primary }]}>✓ அனைத்தும் படிக்கப்பட்டது</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={clearAll} activeOpacity={0.7} style={np.actionBtn}>
              <Text style={[np.actionText, { color: isDark ? '#FF6B6B' : '#DC2626' }]}>🗑 அனைத்தையும் நீக்கு</Text>
            </TouchableOpacity>
          </View>
        )}

        <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1 }} />

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
                isDark={isDark}
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
  title:      { fontSize: 22, fontFamily: FONT_FAMILY.black, letterSpacing: -0.3 },
  sub:        { color: GOLD.primary, fontSize: 10, fontFamily: FONT_FAMILY.bold, letterSpacing: 2, marginTop: 2 },
  badge:      { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText:  { color: '#1A0F00', fontSize: 11, fontFamily: FONT_FAMILY.extrabold },
  closeBtn:   { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  actionRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: 10, borderBottomWidth: 1 },
  actionBtn:  { paddingVertical: 2, paddingHorizontal: 4 },
  actionText: { fontSize: 12, fontFamily: FONT_FAMILY.semibold },
  row:        { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: GOLD.border, borderLeftWidth: 3, padding: SPACING.sm },
  iconBox:    { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowTitle:   { fontSize: 13, fontFamily: FONT_FAMILY.bold, flex: 1, marginRight: 6 },
  rowTime:    { color: '#888888', fontSize: 10, fontFamily: FONT_FAMILY.medium, flexShrink: 0 },
  rowBody:    { fontSize: 11, fontFamily: FONT_FAMILY.regular, lineHeight: 16 },
  unreadDot:  { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: GOLD.primary },
  empty:      { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl },
  emptyText:  { fontSize: 14, fontFamily: FONT_FAMILY.semibold, marginBottom: 8 },
  emptySubText:{ fontSize: 11, fontFamily: FONT_FAMILY.regular, textAlign: 'center', lineHeight: 17, paddingHorizontal: SPACING.md },
});

// ── Tab label ─────────────────────────────────────────────────────────────────
function TabLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text
      numberOfLines={1}
      allowFontScaling={false}
      textBreakStrategy="simple"
      style={{ fontSize: 11, fontFamily: FONT_FAMILY.bold, color, textAlign: 'center' }}
    >
      {label}
    </Text>
  );
}

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return focused ? (
    <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={ts.tabActive}>
      <Text style={ts.tabEmoji}>{emoji}</Text>
    </LinearGradient>
  ) : (
    <View style={ts.tabInactive}>
      <Text style={[ts.tabEmoji, { opacity: 0.5 }]}>{emoji}</Text>
    </View>
  );
}

// ── App navigator ─────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { isLoggedIn } = useAuth();
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

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Tab.Navigator
          screenListeners={({ route }) => ({
            focus: () => setActiveTab(route.name),
          })}
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.tabBar,
              borderTopColor: GOLD.border,
              borderTopWidth: 1,
              height: 72 + Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0),
              paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0) + 6,
              paddingTop: 6,
            },
            tabBarActiveTintColor: GOLD.primary,
            tabBarInactiveTintColor: theme.textMuted,
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: ({ color }) => <TabLabel label="முகப்பு" color={color} />,
              tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Members"
            component={MembersScreen}
            options={{
              tabBarLabel: ({ color }) => <TabLabel label="உறுப்பினர்" color={color} />,
              tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarLabel: ({ color }) => (
                <TabLabel label={isLoggedIn ? 'சுயவிவரம்' : 'உள்நுழைவு'} color={color} />
              ),
              tabBarIcon: ({ focused }) => (
                <View>
                  <TabIcon emoji={isLoggedIn ? '✅' : '👤'} focused={focused} />
                  {isLoggedIn && !focused && <View style={ts.dot} />}
                </View>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>

      {/* ── Floating buttons ── */}
      <View style={[ts.fab, { top: Math.max(insets.top, 28) + 4 }]} pointerEvents={notifOpen ? 'none' : 'box-none'}>
        <Animated.View style={{ opacity: notifOpen ? 0 : 1, gap: 12 }}>
          {/* Notification bell */}
          <TouchableOpacity onPress={() => setNotifOpen(true)} activeOpacity={0.8} style={ts.fabBtn}>
            <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={ts.fabBtnInner}>
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
            <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={ts.fabBtnInner}>
              <Animated.Text style={[ts.fabReloadIcon, { transform: [{ rotate: reloadAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
                ↻
              </Animated.Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Dark / light toggle */}
          <TouchableOpacity onPress={toggleTheme} activeOpacity={0.8} style={ts.fabBtn}>
            <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={ts.fabBtnInner}>
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
  tabActive:      { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tabInactive:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tabEmoji:       { fontSize: 22 },
  dot:            { position: 'absolute', top: 0, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  fab:            { position: 'absolute', top: 52, right: 14, zIndex: 100, elevation: 20 },
  fabBtn:         { borderRadius: RADIUS.full, ...SHADOWS.gold },
  fabBtnInner:    { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fabIcon:        { fontSize: 18 },
  fabReloadIcon:  { fontSize: 24, color: '#1A0F00', fontWeight: '900', lineHeight: 28 },
  notifBadge:     { position: 'absolute', top: -3, right: -3, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: '#fff', fontSize: 9, fontFamily: FONT_FAMILY.extrabold },
});
