import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  Animated, ScrollView, Dimensions,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import HomeScreen from '../screens/HomeScreen';
import MembersScreen from '../screens/MembersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { GOLD, SPACING, RADIUS, SHADOWS } from '../theme';

const { height } = Dimensions.get('window');

// ── Static notifications ──────────────────────────────────────────────────────
const NOTIFICATIONS = [
  { id: '1', icon: '📢', title: 'குழு கூட்டம் அறிவிப்பு',    body: 'இந்த ஞாயிற்றுக்கிழமை மாலை 5 மணிக்கு மாதாந்திர கூட்டம்.',  time: '2 மணி முன்பு',  unread: true  },
  { id: '2', icon: '🎉', title: 'புதிய உறுப்பினர் வரவேற்பு', body: 'திரு. ரவிக்குமார் நம் குழுவில் புதிதாக இணைந்துள்ளார்.',        time: '5 மணி முன்பு',  unread: true  },
  { id: '3', icon: '🏆', title: 'நிகழ்ச்சி நினைவூட்டல்',      body: 'வரும் திங்கட்கிழமை கலாச்சார நிகழ்ச்சி. பதிவு இன்று வரை.',    time: 'நேற்று 6:30',   unread: true  },
  { id: '4', icon: '📸', title: 'புகைப்பட தொகுப்பு',          body: 'பொங்கல் விழா புகைப்படங்கள் பதிவேற்றப்பட்டுள்ளன.',             time: 'நேற்று 2:15',   unread: false },
  { id: '5', icon: '💰', title: 'சேமிப்பு திட்டம்',           body: 'இம்மாத சேமிப்பு தொகை கடைசி நாள் மாதம் 15.',                 time: '3 நாள் முன்பு', unread: false },
  { id: '6', icon: '🌟', title: 'UPR நட்பு சாம்ராஜ்யம்',      body: 'UPR குழுவில் நீங்கள் பதிவு செய்யப்பட்டுள்ளீர்கள். நன்றி!',  time: '5 நாள் முன்பு', unread: false },
];
const UNREAD_COUNT = NOTIFICATIONS.filter(n => n.unread).length;

// ── Notification row ──────────────────────────────────────────────────────────
function NotifRow({ item, index, isDark, theme }: {
  item: typeof NOTIFICATIONS[0]; index: number; isDark: boolean; theme: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 320, delay: index * 50, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      marginBottom: SPACING.sm,
    }}>
      <LinearGradient
        colors={isDark ? ['rgba(28,20,8,0.95)', 'rgba(17,12,3,0.90)'] : ['rgba(255,252,235,0.98)', 'rgba(255,243,210,0.95)']}
        style={[np.row, { borderLeftColor: item.unread ? GOLD.primary : (isDark ? '#3A2A08' : '#D4B87A') }]}
      >
        <View style={[np.iconBox, { backgroundColor: item.unread ? 'rgba(201,162,39,0.18)' : 'rgba(201,162,39,0.07)' }]}>
          <Text style={{ fontSize: 18 }}>{item.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={[np.rowTitle, { color: item.unread ? (isDark ? '#F5ECD7' : '#3A2A08') : theme.textSecondary }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={np.rowTime}>{item.time}</Text>
          </View>
          <Text style={[np.rowBody, { color: theme.textMuted }]} numberOfLines={2}>{item.body}</Text>
        </View>
        {item.unread && <View style={np.unreadDot} />}
      </LinearGradient>
    </Animated.View>
  );
}

// ── Notification panel ────────────────────────────────────────────────────────
function NotifPanel({ visible, onClose, isDark, theme }: {
  visible: boolean; onClose: () => void; isDark: boolean; theme: any;
}) {
  const slideY  = useRef(new Animated.Value(-height)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slideY,  { toValue: 0, tension: 50, friction: 12, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY,  { toValue: -height, duration: 280, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,       duration: 220, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', opacity }]} pointerEvents="auto">
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View
        style={[np.panel, { backgroundColor: isDark ? '#0F0A02' : '#FFF8EC', transform: [{ translateY: slideY }] }]}
        pointerEvents="auto"
      >
        <LinearGradient colors={[GOLD.dark, GOLD.primary, GOLD.light, GOLD.primary, GOLD.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />

        <LinearGradient colors={isDark ? ['#1C1408', '#110C03'] : ['#FFF3D4', '#FFF8EC']} style={np.header}>
          <View>
            <Text style={[np.title, { color: theme.text }]}>அறிவிப்புகள்</Text>
            <Text style={np.sub}>NOTIFICATIONS</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            {UNREAD_COUNT > 0 && (
              <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={np.badge}>
                <Text style={np.badgeText}>{UNREAD_COUNT} புதியவை</Text>
              </LinearGradient>
            )}
            <TouchableOpacity onPress={onClose} activeOpacity={0.75} style={{ borderRadius: RADIUS.full, overflow: 'hidden' }}>
              <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={np.closeBtn}>
                <Text style={{ color: '#1A0F00', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <LinearGradient colors={['transparent', GOLD.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1 }} />

        <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xl }} showsVerticalScrollIndicator={false}>
          {NOTIFICATIONS.map((item, i) => (
            <NotifRow key={item.id} item={item} index={i} isDark={isDark} theme={theme} />
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const np = StyleSheet.create({
  panel:     { position: 'absolute', top: 0, left: 0, right: 0, maxHeight: height * 0.75, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden', elevation: 20 },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
  title:     { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  sub:       { color: GOLD.primary, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 2 },
  badge:     { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: '#1A0F00', fontSize: 11, fontWeight: '800' },
  closeBtn:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  row:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: GOLD.border, borderLeftWidth: 3, padding: SPACING.sm },
  iconBox:   { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowTitle:  { fontSize: 13, fontWeight: '700', flex: 1, marginRight: 6 },
  rowTime:   { color: '#7A6040', fontSize: 10, flexShrink: 0 },
  rowBody:   { fontSize: 11, lineHeight: 16 },
  unreadDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: GOLD.primary },
});

// ── Tab icon ──────────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, label, focused, theme }: { emoji: string; label: string; focused: boolean; theme: any }) {
  return (
    <View style={ts.tabIcon}>
      {focused ? (
        <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={ts.tabActive}>
          <Text style={ts.tabEmoji}>{emoji}</Text>
        </LinearGradient>
      ) : (
        <Text style={[ts.tabEmoji, { opacity: 0.5 }]}>{emoji}</Text>
      )}
      <Text style={[ts.tabLabel, focused ? ts.tabLabelActive : { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

// ── App navigator ─────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { isLoggedIn } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.tabBar,
              borderTopColor: GOLD.border,
              borderTopWidth: 1,
              height: 72,
              paddingBottom: 8,
              paddingTop: 4,
            },
            tabBarShowLabel: false,
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="முகப்பு" focused={focused} theme={theme} /> }}
          />
          <Tab.Screen
            name="Members"
            component={MembersScreen}
            options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="உறுப்பினர்" focused={focused} theme={theme} /> }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <View>
                  <TabIcon emoji={isLoggedIn ? '✅' : '👤'} label={isLoggedIn ? 'சுயவிவரம்' : 'உள்நுழைவு'} focused={focused} theme={theme} />
                  {isLoggedIn && !focused && <View style={ts.dot} />}
                </View>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>

      {/* ── Floating action buttons — hidden while notification panel is open ── */}
      <View style={ts.fab} pointerEvents={notifOpen ? 'none' : 'box-none'}>
        <Animated.View style={{ opacity: notifOpen ? 0 : 1 }}>
        {/* Notification bell */}
        <TouchableOpacity onPress={() => setNotifOpen(true)} activeOpacity={0.8} style={ts.fabBtn}>
          <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={ts.fabBtnInner}>
            <Text style={ts.fabIcon}>🔔</Text>
          </LinearGradient>
          {UNREAD_COUNT > 0 && (
            <View style={ts.notifBadge}>
              <Text style={ts.notifBadgeText}>{UNREAD_COUNT}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Dark / light toggle */}
        <TouchableOpacity onPress={toggleTheme} activeOpacity={0.8} style={ts.fabBtn}>
          <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={ts.fabBtnInner}>
            <Text style={ts.fabIcon}>{isDark ? '☀️' : '🌙'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Notification panel overlay */}
      <NotifPanel visible={notifOpen} onClose={() => setNotifOpen(false)} isDark={isDark} theme={theme} />
    </View>
  );
}

const ts = StyleSheet.create({
  tabIcon:      { alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabActive:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tabEmoji:     { fontSize: 22 },
  tabLabel:     { fontSize: 10, fontWeight: '600' },
  tabLabelActive: { color: GOLD.primary, fontWeight: '700' },
  dot:          { position: 'absolute', top: 0, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },

  // Floating buttons
  fab:          { position: 'absolute', top: 52, right: 14, gap: 10, zIndex: 100, pointerEvents: 'box-none' },
  fabBtn:       { borderRadius: RADIUS.full, ...SHADOWS.gold },
  fabBtnInner:  { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fabIcon:      { fontSize: 18 },
  notifBadge:   { position: 'absolute', top: -3, right: -3, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
