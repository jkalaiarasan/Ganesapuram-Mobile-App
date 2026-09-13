import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ACCENT, SPACING, RADIUS, TYPE } from '../theme';

type Entry = {
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  uprOnly?: boolean;
};

// Everything that does not earn a bottom tab lives here. Four tabs is the
// practical ceiling on a phone, so this is the overflow — still one tap away.
const ENTRIES: Entry[] = [
  { route: 'Calendar', icon: 'calendar-outline', title: 'நாள்காட்டி', subtitle: 'பிறந்தநாள் மற்றும் நிகழ்வுகள்' },
  { route: 'Trips',    icon: 'bus-outline',      title: 'Blue Moon',   subtitle: 'பயண பதிவு மற்றும் இருக்கைகள்' },
  { route: 'Quiz',     icon: 'help-circle-outline', title: 'வினாடி வினா', subtitle: 'குறியீட்டுடன் உள்நுழைக' },
  { route: 'News',     icon: 'newspaper-outline', title: 'செய்திகள்',  subtitle: 'அறிவிப்புகள்' },
  { route: 'About',    icon: 'information-circle-outline', title: 'எங்களைப் பற்றி', subtitle: 'வரலாறு மற்றும் தலைமை', uprOnly: true },
];

export default function MoreScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { member, isLoggedIn } = useAuth();
  const isUPR = isLoggedIn && member?.type === 'UPR';

  const visible = ENTRIES.filter(e => !e.uprOnly || isUPR);
  const hiddenCount = ENTRIES.length - visible.length;
  const s = styles(theme);

  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <View style={s.card}>
          {visible.map((e, i) => (
            <TouchableOpacity
              key={e.route}
              activeOpacity={0.6}
              onPress={() => navigation.navigate(e.route)}
              style={[s.row, i > 0 && s.rowBorder]}
            >
              <View style={s.icon}>
                <Ionicons name={e.icon} size={19} color={ACCENT.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{e.title}</Text>
                <Text style={s.subtitle}>{e.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Only say something is hidden when something actually is. */}
        {hiddenCount > 0 && (
          <Text style={s.note}>
            சில பகுதிகள் UPR உறுப்பினர்களுக்கு மட்டும்
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl, gap: SPACING.md },
  card: {
    backgroundColor: theme.card, borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    paddingHorizontal: SPACING.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider },
  icon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: ACCENT.tintSoft, alignItems: 'center', justifyContent: 'center',
  },
  title: { ...TYPE.bodyStrong, color: theme.text },
  subtitle: { ...TYPE.caption, color: theme.textMuted, marginTop: 2 },
  note: { ...TYPE.caption, color: theme.textMuted, textAlign: 'center' },
});
