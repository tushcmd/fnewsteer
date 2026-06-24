import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { ZoneCard } from '../../src/components';
import { configure, fetchBlackoutZones, BlackoutZone } from '../../src/api';
import { loadSettings } from '../../src/storage';

export default function ZonesScreen() {
  const [zones, setZones] = useState<BlackoutZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeMedium, setIncludeMedium] = useState(false);

  const loadZones = useCallback(async () => {
    setError(null);
    try {
      const settings = await loadSettings();
      configure(settings.baseUrl, settings.apiKey);
      const res = await fetchBlackoutZones({ includeMedium });
      setZones(res.zones);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [includeMedium]);

  useEffect(() => {
    setLoading(true);
    loadZones();
  }, [loadZones]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadZones();
    setRefreshing(false);
  };

  const now = new Date();
  const activeZones = zones.filter(z => now >= new Date(z.start) && now <= new Date(z.end));
  const upcomingZones = zones.filter(z => new Date(z.start) > now);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.heading}>Blackout Zones</Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggle, includeMedium && styles.toggleActive]}
          onPress={() => setIncludeMedium(!includeMedium)}
        >
          <Text style={[styles.toggleText, includeMedium && styles.toggleTextActive]}>
            Include Medium Impact
          </Text>
        </TouchableOpacity>
      </View>

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

          {activeZones.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.red }]}>
                ACTIVE NOW ({activeZones.length})
              </Text>
              {activeZones.map((z, i) => (
                <ZoneCard key={i} zone={z} />
              ))}
            </View>
          )}

          {upcomingZones.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Upcoming ({upcomingZones.length})
              </Text>
              {upcomingZones.map((z, i) => (
                <ZoneCard key={i} zone={z} />
              ))}
            </View>
          )}

          {zones.length === 0 && !error && (
            <Text style={styles.empty}>No blackout zones this week.</Text>
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
  toggleRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  toggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  toggleActive: {
    backgroundColor: colors.yellowDim,
    borderColor: colors.yellow,
  },
  toggleText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.yellow,
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});
