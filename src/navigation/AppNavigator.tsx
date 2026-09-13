import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  Animated, ScrollView, Dimensions, Platform, BackHandler, Image,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import MembersScreen from '../screens/MembersScreen';
import MoreScreen from '../screens/MoreScreen';
import CalendarScreen from '../screens/CalendarScreen';
import TripsScreen from '../screens/TripsScreen';
import NewsScreen from '../screens/NewsScreen';
import QuizScreen from '../screens/QuizScreen';
import AboutScreen from '../screens/AboutScreen';
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
import { imageUrl } from '../api';
import { ACCENT, SPACING, RADIUS, TYPE } from '../theme';

const { height } = Dimensions.get('window');

// Four tabs is the ceiling on a phone; everything else lives behind More.
const TABS: Record<string, { icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap; label: string; title: string }> = {
  Home:    { icon: 'home-outline',            active: 'home',            label: 'முகப்பு',   title: 'கணேசபுரம்' },
  Events:  { icon: 'albums-outline',          active: 'albums',          label: 'நிகழ்வு',   title: 'நிகழ்வுகள்' },
  Members: { icon: 'people-outline',          active: 'people',          label: 'உறுப்பினர்', title: 'உறுப்பினர்கள்' },
  More:    { icon: 'ellipsis-horizontal',     active: 'ellipsis-horizontal', label: 'மேலும்', title: 'மேலும்' },
};

// ── Top app bar ───────────────────────────────────────────────────────────────
function AppBar({ title, onNotifications, onReload, onProfile }: {
  title: string; onNotifications: () => void; onReload: () => void; onProfile: () => void;
}) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { member, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const spin = useRef(new Animated.Value(0)).current;

  const reload = () => {
    spin.setValue(0);
    Animated.timing(spin, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    onReload();
  };

  const avatar = member?.contentVersionId ? imageUrl(member.contentVersionId) : null;
  const s = barStyles(theme);

  return (
    <View style={[s.bar, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <Text style={s.title} numberOfLines={1}>{title}</Text>

      <View style={s.actions}>
        <TouchableOpacity onPress={onNotifications} activeOpacity={0.6} style={s.iconBtn} hitSlop={6}>
          <Ionicons name="notifications-outline" size={21} color={theme.text} />
          {unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={reload} activeOpacity={0.6} style={s.iconBtn} hitSlop={6}>
          <Animated.View style={{
            transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
          }}>
            <Ionicons name="refresh-outline" size={21} color={theme.text} />
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleTheme} activeOpacity={0.6} style={s.iconBtn} hitSlop={6}>
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={21} color={theme.text} />
        </TouchableOpacity>

        {/* Profile moved out of the tab bar to keep it to four. */}
        <TouchableOpacity onPress={onProfile} activeOpacity={0.6} style={s.avatarBtn} hitSlop={6}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Ionicons
                name={isLoggedIn ? 'person' : 'person-outline'}
                size={16}
                color={isLoggedIn ? ACCENT.primary : theme.textMuted}
              />
            </View>
          )}
          {isLoggedIn && <View style={[s.onlineDot, { borderColor: theme.background }]} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const barStyles = (theme: any) => StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingBottom: 12,
    backgroundColor: theme.background,
  },
  title:   { ...TYPE.title, color: theme.text, flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full },
  badge: {
    position: 'absolute', top: 5, right: 3, minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: ACCENT.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontFamily: TYPE.micro.fontFamily },
  avatarBtn: { marginLeft: 4 },
  avatar: { width: 30, height: 30, borderRadius: 15 },
  avatarFallback: { backgroundColor: ACCENT.tintSoft, alignItems: 'center', justifyContent: 'center' },
  onlineDot: {
    position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#34D399', borderWidth: 2,
  },
});

// ── Notification row ──────────────────────────────────────────────────────────
function NotifRow({ item, index, theme, onTap }: {
  item: StoredNotification; index: number; theme: any; onTap: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 260, delay: index * 40, useNativeDriver: true }).start();
  }, []);

  const { icon, cleanTitle } = extractIcon(item.title);
  const isUnread = !item.viewed;
  const s = sheetStyles(theme);

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
    }}>
      <TouchableOpacity activeOpacity={0.7} onPress={onTap} style={s.row}>
        <View style={[s.rowIcon, { backgroundColor: isUnread ? ACCENT.tintStrong : ACCENT.tintSoft }]}>
          <Text style={{ fontSize: 16 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.rowTop}>
            <Text style={[s.rowTitle, { color: isUnread ? theme.text : theme.textSecondary }]} numberOfLines={1}>
              {cleanTitle}
            </Text>
            <Text style={s.rowTime}>{formatRelativeTime(item.receivedAt)}</Text>
          </View>
          <Text style={s.rowBody} numberOfLines={2}>{item.body}</Text>
        </View>
        {isUnread && <View style={s.dot} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Notification sheet ────────────────────────────────────────────────────────
function NotifSheet({ visible, onClose, theme }: {
  visible: boolean; onClose: () => void; theme: any;
}) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(height)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  const { notifications, unreadCount, markViewed, markAllViewed, clearAll } = useNotifications();

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slide, { toValue: 0, tension: 58, friction: 12, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, { toValue: height, duration: 240, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  const s = sheetStyles(theme);
  const isEmpty = notifications.length === 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: fade }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View style={[s.sheet, { backgroundColor: theme.surface, transform: [{ translateY: slide }] }]}>
        <View style={s.grabber} />

        <View style={s.sheetHead}>
          <Text style={s.sheetTitle}>அறிவிப்புகள்</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.6} hitSlop={10}>
            <Ionicons name="close" size={22} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {!isEmpty && (
          <View style={s.actions}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllViewed} activeOpacity={0.6}>
                <Text style={[s.actionText, { color: ACCENT.primary }]}>அனைத்தும் படித்தது</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={clearAll} activeOpacity={0.6}>
              <Text style={[s.actionText, { color: theme.textMuted }]}>நீக்கு</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: insets.bottom + SPACING.lg, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {isEmpty ? (
            <View style={s.empty}>
              <Ionicons name="notifications-off-outline" size={34} color={theme.textMuted} />
              <Text style={s.emptyText}>அறிவிப்புகள் இல்லை</Text>
            </View>
          ) : (
            notifications.map((item, i) => (
              <NotifRow key={item.id} item={item} index={i} theme={theme} onTap={() => markViewed(item.id)} />
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const sheetStyles = (theme: any) => StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: height * 0.8,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, overflow: 'hidden',
  },
  grabber: {
    width: 38, height: 4, borderRadius: 2, backgroundColor: theme.textMuted,
    opacity: 0.35, alignSelf: 'center', marginTop: 10,
  },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm,
  },
  sheetTitle: { ...TYPE.title, color: theme.text },
  actions: { flexDirection: 'row', gap: SPACING.md, paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  actionText: { ...TYPE.label },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.divider,
  },
  rowIcon: { width: 38, height: 38, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  rowTitle: { ...TYPE.bodyStrong, flex: 1, marginRight: 8 },
  rowTime: { ...TYPE.caption, color: theme.textMuted },
  rowBody: { ...TYPE.caption, color: theme.textMuted, lineHeight: 17 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT.primary, marginLeft: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl, gap: 10 },
  emptyText: { ...TYPE.label, color: theme.textMuted },
});

// ── Flat tab bar ──────────────────────────────────────────────────────────────
function FlatTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: theme.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.divider,
      paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 6),
      paddingTop: 8,
    }}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TABS[route.name];
        if (!meta) return null;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 2 }}
          >
            <Ionicons
              name={focused ? meta.active : meta.icon}
              size={23}
              color={focused ? ACCENT.primary : theme.textMuted}
            />
            <Text
              numberOfLines={1}
              style={{ ...TYPE.micro, fontSize: 10, color: focused ? ACCENT.primary : theme.textMuted }}
            >
              {meta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// The tab shell, including the app bar that sits above the tab screens.
function TabShell({ navigation }: any) {
  const { refresh } = useRefreshContext();
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const { theme } = useTheme();
  const { pendingOpenPanel, clearPendingOpen } = useNotifications();

  useEffect(() => {
    if (pendingOpenPanel) {
      setNotifOpen(true);
      clearPendingOpen();
    }
  }, [pendingOpenPanel]);

  useEffect(() => {
    if (!notifOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setNotifOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [notifOpen]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <AppBar
        title={TABS[activeTab]?.title ?? ''}
        onNotifications={() => setNotifOpen(true)}
        onReload={() => refresh(activeTab)}
        onProfile={() => navigation.navigate('Profile')}
      />

      <Tab.Navigator
        screenListeners={({ route }) => ({ focus: () => setActiveTab(route.name) })}
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <FlatTabBar {...props} />}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Events" component={EventsScreen} />
        <Tab.Screen name="Members" component={MembersScreen} />
        <Tab.Screen name="More" component={MoreScreen} />
      </Tab.Navigator>

      <NotifSheet visible={notifOpen} onClose={() => setNotifOpen(false)} theme={theme} />
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabShell} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Trips" component={TripsScreen} />
        <Stack.Screen name="News" component={NewsScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
