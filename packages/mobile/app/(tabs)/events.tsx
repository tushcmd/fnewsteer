import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { EventCard } from '../../src/components';
import { configure, fetchUpcoming, NewsEvent } from '../../src/api';
import { loadSettings } from '../../src/storage';

const CURRENCIES = ['All', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'];

export default function EventsScreen() {
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [includeMedium, setIncludeMedium] = useState(false);

  const loadEvents = useCallback(async () => {
    setError(null);
    try {
      const settings = await loadSettings();
      configure(settings.baseUrl, settings.apiKey);
      const currency = filter === 'All' ? undefined : filter;
      const res = await fetchUpcoming({ currency, includeMedium });
      setEvents(res.events);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, includeMedium]);

  useEffect(() => {
    setLoading(true);
    loadEvents();
  }, [loadEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.heading}>Week Calendar</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {CURRENCIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.filterChip, filter === c && styles.filterChipActive]}
            onPress={() => setFilter(c)}
          >
            <Text style={[styles.filterText, filter === c && styles.filterTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterChip, includeMedium && styles.filterChipMedium]}
          onPress={() => setIncludeMedium(!includeMedium)}
        >
          <Text style={[styles.filterText, includeMedium && styles.filterTextActive]}>+Medium</Text>
        </TouchableOpacity>
      </ScrollView>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.blue} style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        >
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <Text style={styles.count}>{events.length} event{events.length !== 1 ? 's' : ''}</Text>
          {events.map((evt, i) => (
            <EventCard key={`${evt.title}-${evt.event_time}-${i}`} event={evt} />
          ))}
          {events.length === 0 && !error && (
            <Text style={styles.empty}>No events found.</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  heading: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  filterChipMedium: {
    backgroundColor: colors.yellowDim,
    borderColor: colors.yellow,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: colors.redDim,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: colors.red,
    fontSize: 13,
  },
  count: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});
