import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { StatusBadge, EventCard } from '../../src/components';
import { configure, fetchCheck, fetchUpcoming, CheckResponse, NewsEvent } from '../../src/api';
import { loadSettings } from '../../src/storage';

export default function CheckScreen() {
  const [pair, setPair] = useState('EURUSD');
  const [checkResult, setCheckResult] = useState<CheckResponse | null>(null);
  const [upcoming, setUpcoming] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await loadSettings();
      configure(settings.baseUrl, settings.apiKey);
      setPair(settings.pair);

      const [checkRes, upcomingRes] = await Promise.all([
        fetchCheck({ symbol: settings.pair }),
        fetchUpcoming({ currency: settings.pair }),
      ]);
      setCheckResult(checkRes);
      setUpcoming(upcomingRes.events);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCheck = async () => {
    if (!pair.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const settings = await loadSettings();
      configure(settings.baseUrl, settings.apiKey);
      const res = await fetchCheck({ symbol: pair.trim() });
      setCheckResult(res);
      const upcomingRes = await fetchUpcoming({ currency: pair.trim() });
      setUpcoming(upcomingRes.events);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
      >
        <Text style={styles.heading}>FNEWSTEER</Text>
        <Text style={styles.subheading}>Don't paddle out into a hurricane unaware.</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={pair}
            onChangeText={setPair}
            placeholder="EURUSD"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.button} onPress={handleCheck} disabled={loading}>
            <Text style={styles.buttonText}>CHECK</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing && (
          <ActivityIndicator size="large" color={colors.blue} style={styles.loader} />
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {checkResult && !loading && (
          <>
            <StatusBadge safe={checkResult.safe_to_trade} symbol={checkResult.symbol} />
            {!checkResult.safe_to_trade && checkResult.blocking_events.length > 0 && (
              <View style={styles.blockingSection}>
                <Text style={styles.sectionTitle}>Blocking Events</Text>
                {checkResult.blocking_events.map((evt, i) => (
                  <View key={i} style={styles.blockingItem}>
                    <Text style={styles.blockingTitle}>{evt.title}</Text>
                    <Text style={styles.blockingMeta}>
                      {evt.currency} · {evt.impact} ·{' '}
                      {evt.minutes_to_event !== null
                        ? evt.minutes_to_event > 0
                          ? `${Math.round(evt.minutes_to_event)}m away`
                          : `${Math.abs(Math.round(evt.minutes_to_event))}m ago`
                        : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {upcoming.length > 0 && !loading && (
          <View style={styles.eventsSection}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {upcoming.map((evt, i) => (
              <EventCard key={i} event={evt} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  heading: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subheading: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  button: {
    backgroundColor: colors.blue,
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
  loader: {
    marginVertical: 20,
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
  blockingSection: {
    marginTop: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  blockingItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockingTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  blockingMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  eventsSection: {
    marginTop: 24,
  },
});
