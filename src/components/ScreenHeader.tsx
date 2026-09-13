import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, TYPE } from '../theme';

// Header for pushed screens. The tab screens use the app bar in AppNavigator;
// anything on the stack gets this, so back navigation looks the same everywhere.
export default function ScreenHeader({ title, onBack, right }: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.background,
      paddingTop: Math.max(insets.top, 12) + 6,
      paddingBottom: 12,
      paddingHorizontal: SPACING.sm,
    }}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.6} hitSlop={8} style={styles.btn}>
        <Ionicons name="chevron-back" size={24} color={theme.text} />
      </TouchableOpacity>

      <Text style={[TYPE.title, { color: theme.text, flex: 1 }]} numberOfLines={1}>
        {title}
      </Text>

      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full },
});
