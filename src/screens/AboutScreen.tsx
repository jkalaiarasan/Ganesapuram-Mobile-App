import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import { ACCENT, SPACING, RADIUS, TYPE, FONT_FAMILY } from '../theme';

const LEADERSHIP = [
  { name: 'Logesh Reddy', role: 'First President' },
  { name: 'MP Dharmar', role: 'President' },
  { name: 'Sundaram', role: 'President' },
  { name: 'Naveen Thawaan', role: 'President' },
  { name: 'Thiruppathi', role: 'President', current: true },
  { name: 'Prasanna', role: 'Vice President', current: true },
];

const TRIPS = ['Ooty', 'Kodaikanal', 'Kolli Hills'];

const ACTIVITIES = [
  { icon: 'flag-outline' as const, text: 'Flag hoisting every 15 August and 26 January' },
  { icon: 'trophy-outline' as const, text: 'Pongal celebrations with competitions and prizes' },
  { icon: 'people-outline' as const, text: 'Funded by village public members' },
];

const RECORDS = [
  'Participant and winner details recorded in Salesforce',
  'Soft copy certificates issued through the website',
  'Transparent documentation and recognition for everyone involved',
];

const SOCIALS = [
  { icon: 'logo-whatsapp' as const, label: 'WhatsApp', url: 'https://wa.me/', tint: '#25D366' },
  { icon: 'paper-plane-outline' as const, label: 'Telegram', url: 'https://t.me/', tint: '#2AABEE' },
  { icon: 'logo-instagram' as const, label: 'Instagram', url: 'https://instagram.com/', tint: '#E1306C' },
];

function Section({ title, children, theme }: { title: string; children: React.ReactNode; theme: any }) {
  const s = styles(theme);
  return (
    <View style={s.card}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function AboutScreen({ navigation }: any) {
  const { theme } = useTheme();
  const s = styles(theme);

  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />
      <ScreenHeader title="எங்களைப் பற்றி" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <View style={s.hero}>
          <View style={s.badge}><Text style={s.badgeText}>EST. 01 JAN 2023</Text></View>
          <Text style={s.heroTitle}>UPR Friendship Empire</Text>
          <Text style={s.heroSub}>
            Discover our journey, vision, and the people who make it all possible
          </Text>
        </View>

        <Section title="Our Story" theme={theme}>
          <Text style={s.body}>
            UPR Friendship Empire began unexpectedly on 01 January 2023 as a small friendship
            group named <Text style={s.em}>Universal Paarai Boys</Text>, founded by
            <Text style={s.em}> Kalaiarasan</Text>, who serves as Founder, Proprietor and IT
            Administrator.
          </Text>
          <Text style={s.body}>
            There was originally a plan to build a mobile application, but it could not be
            completed. A Salesforce-based website was created instead, and that became the
            backbone of our operations.
          </Text>
        </Section>

        <Section title="Leadership Journey" theme={theme}>
          {LEADERSHIP.map((l, i) => (
            <View key={l.name} style={s.timelineRow}>
              <View style={s.timelineCol}>
                <View style={[s.node, l.current && s.nodeCurrent]} />
                {i < LEADERSHIP.length - 1 && <View style={s.line} />}
              </View>
              <View style={s.timelineBody}>
                <Text style={s.timelineName}>{l.name}</Text>
                <Text style={[s.timelineRole, l.current && { color: ACCENT.primary }]}>
                  {l.role}{l.current ? ' · current' : ''}
                </Text>
              </View>
            </View>
          ))}
          <Text style={[s.body, { marginTop: SPACING.sm }]}>
            During this journey the group was renamed from Universal Paarai Boys to
            UPR Friendship Empire, reflecting a broader vision of unity, friendship and
            social responsibility.
          </Text>
        </Section>

        <Section title="Bluemoon Holidays & Tourism" theme={theme}>
          <Text style={s.body}>
            Launched under the UPR banner to organise group trips and tours.
          </Text>
          <View style={s.chipRow}>
            {TRIPS.map(t => (
              <View key={t} style={s.chip}>
                <Ionicons name="bus-outline" size={13} color={ACCENT.primary} />
                <Text style={s.chipText}>{t}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Social & Cultural Activities" theme={theme}>
          {ACTIVITIES.map(a => (
            <View key={a.text} style={s.bulletRow}>
              <Ionicons name={a.icon} size={16} color={ACCENT.primary} />
              <Text style={s.bulletText}>{a.text}</Text>
            </View>
          ))}
        </Section>

        <Section title="Digital Record & Recognition" theme={theme}>
          {RECORDS.map(r => (
            <View key={r} style={s.bulletRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={ACCENT.primary} />
              <Text style={s.bulletText}>{r}</Text>
            </View>
          ))}
        </Section>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Connect</Text>
          <View style={s.socialRow}>
            {SOCIALS.map(so => (
              <TouchableOpacity
                key={so.label}
                style={s.social}
                activeOpacity={0.6}
                onPress={() => Linking.openURL(so.url).catch(() => {})}
              >
                <Ionicons name={so.icon} size={20} color={so.tint} />
                <Text style={s.socialText}>{so.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.sign}>
          <Text style={s.signName}>— Kalaiarasan</Text>
          <Text style={s.signRole}>Founder, Proprietor & IT Administrator</Text>
          <Text style={s.signOrg}>UPR Friendship Empire</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.md },

  hero: { alignItems: 'center', paddingVertical: SPACING.md, gap: 8 },
  badge: { backgroundColor: ACCENT.tintSoft, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { ...TYPE.caption, fontSize: 10, color: ACCENT.primary },
  heroTitle: { ...TYPE.display, fontSize: 26, color: theme.text, textAlign: 'center' },
  heroSub: { ...TYPE.caption, color: theme.textMuted, textAlign: 'center', lineHeight: 18 },

  card: {
    backgroundColor: theme.card, borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    padding: SPACING.md,
  },
  sectionTitle: { ...TYPE.heading, color: theme.text, marginBottom: SPACING.sm },
  body: { ...TYPE.body, color: theme.textSecondary, marginBottom: 10 },
  em: { fontFamily: FONT_FAMILY.semibold, color: theme.text },

  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineCol: { alignItems: 'center', width: 12 },
  node: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.textMuted, marginTop: 5 },
  nodeCurrent: { backgroundColor: ACCENT.primary, width: 11, height: 11, borderRadius: 6 },
  line: { flex: 1, width: 1, backgroundColor: theme.divider, marginVertical: 3 },
  timelineBody: { flex: 1, paddingBottom: 14 },
  timelineName: { ...TYPE.bodyStrong, color: theme.text },
  timelineRole: { ...TYPE.caption, color: theme.textMuted, marginTop: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: ACCENT.tintSoft, borderRadius: RADIUS.full,
    paddingHorizontal: 11, paddingVertical: 6,
  },
  chipText: { ...TYPE.caption, color: ACCENT.primary },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 6 },
  bulletText: { ...TYPE.body, fontSize: 14, color: theme.textSecondary, flex: 1 },

  socialRow: { flexDirection: 'row', gap: SPACING.sm },
  social: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14,
    backgroundColor: theme.surface, borderRadius: RADIUS.md,
  },
  socialText: { ...TYPE.caption, color: theme.textSecondary },

  sign: { alignItems: 'center', gap: 3, paddingVertical: SPACING.md },
  signName: { ...TYPE.bodyStrong, color: theme.text },
  signRole: { ...TYPE.caption, color: theme.textMuted },
  signOrg: { ...TYPE.caption, color: ACCENT.primary },
});
