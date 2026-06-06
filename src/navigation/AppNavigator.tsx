import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import HomeScreen from '../screens/HomeScreen';
import MembersScreen from '../screens/MembersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { GOLD } from '../theme';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, label, focused, theme }: { emoji: string; label: string; focused: boolean; theme: any }) {
  return (
    <View style={styles.tabIcon}>
      {focused ? (
        <LinearGradient colors={[GOLD.dark, GOLD.primary]} style={styles.tabIconActive}>
          <Text style={styles.tabEmoji}>{emoji}</Text>
        </LinearGradient>
      ) : (
        <Text style={[styles.tabEmoji, { opacity: 0.5 }]}>{emoji}</Text>
      )}
      <Text style={[styles.tabLabel, focused ? styles.tabLabelActive : { color: theme.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export default function AppNavigator() {
  const { theme, isDark } = useTheme();
  const { isLoggedIn } = useAuth();

  return (
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
          options={{
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="முகப்பு" focused={focused} theme={theme} />,
          }}
        />
        <Tab.Screen
          name="Members"
          component={MembersScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="உறுப்பினர்" focused={focused} theme={theme} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <View>
                <TabIcon emoji={isLoggedIn ? '✅' : '👤'} label={isLoggedIn ? 'சுயவிவரம்' : 'உள்நுழைவு'} focused={focused} theme={theme} />
                {isLoggedIn && !focused && <View style={styles.dot} />}
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabIconActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: { fontSize: 22 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  tabLabelActive: { color: GOLD.primary, fontWeight: '700' },
  dot: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
});
