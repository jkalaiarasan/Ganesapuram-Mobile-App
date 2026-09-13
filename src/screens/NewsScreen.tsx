import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, LayoutAnimation,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import { ACCENT, SPACING, RADIUS, TYPE } from '../theme';
import { fetchNews, logError } from '../api';

interface NewsItem {
  id: string; title: string | null; description: string | null;
  createdDate: string | null; author: string | null;
}

function formatDate(raw: string | null) {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString();
}

export default function NewsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await fetchNews();
      if (data.success) setItems(data.news);
      else setError('அறிவிப்புகள் கிடைக்கவில்லை');
    } catch (e: any) {
      logError('News Load Failed', e?.message || 'Failed to load news');
      setError('சேவையகத்துடன் இணைப்பு தோல்வி');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const s = styles(theme);

  return (
    <View style={s.root}>
      <StatusBar style={theme.statusBar} />
      <ScreenHeader title="செய்திகள்" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={s.center}><ActivityIndicator color={ACCENT.primary} /></View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={34} color={theme.textMuted} />
          <Text style={s.infoText}>{error}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); load(); }} activeOpacity={0.6}>
            <Text style={s.retry}>மீண்டும் முயற்சி</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT.primary} />}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="newspaper-outline" size={34} color={theme.textMuted} />
              <Text style={s.infoText}>அறிவிப்புகள் இல்லை</Text>
            </View>
          }
          renderItem={({ item }) => {
            const open = openId === item.id;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                style={s.card}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setOpenId(open ? null : item.id);
                }}
              >
                <View style={s.cardHead}>
                  <View style={s.icon}>
                    <Ionicons name="megaphone-outline" size={16} color={ACCENT.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.title} numberOfLines={open ? undefined : 2}>
                      {item.title || 'தலைப்பு இல்லை'}
                    </Text>
                    <Text style={s.meta}>
                      {[item.author, formatDate(item.createdDate)].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={17} color={theme.textMuted} />
                </View>

                {open && item.description ? (
                  <Text style={s.body}>{item.description}</Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  list: { padding: SPACING.md, paddingBottom: SPACING.xl, gap: SPACING.sm },
  card: {
    backgroundColor: theme.card, borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    padding: SPACING.md,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: ACCENT.tintSoft, alignItems: 'center', justifyContent: 'center',
  },
  title: { ...TYPE.bodyStrong, color: theme.text },
  meta: { ...TYPE.caption, color: theme.textMuted, marginTop: 2 },
  body: {
    ...TYPE.body, color: theme.textSecondary, marginTop: SPACING.sm,
    paddingTop: SPACING.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: 10 },
  infoText: { ...TYPE.label, color: theme.textSecondary, textAlign: 'center' },
  retry: { ...TYPE.bodyStrong, color: ACCENT.primary, marginTop: 4 },
});
