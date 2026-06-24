import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { BlackoutZone } from '../api/types';

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]} ${d.getDate()}`;
}

function impactColor(impact: string) {
  switch (impact) {
    case 'High': return colors.high;
    case 'Medium': return colors.medium;
    default: return colors.low;
  }
}

export function ZoneCard({ zone }: { zone: BlackoutZone }) {
  const now = new Date();
  const start = new Date(zone.start);
  const end = new Date(zone.end);
  const isActive = now >= start && now <= end;
  const isPast = now > end;

  return (
    <View style={[styles.card, isActive && styles.cardActive, isPast && styles.cardPast]}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: impactColor(zone.impact) }]} />
        <Text style={styles.currency}>{zone.currency}</Text>
        <Text style={styles.date}>{formatDate(zone.start)}</Text>
      </View>
      <Text style={styles.title}>{zone.event}</Text>
      <View style={styles.timeRow}>
        <Text style={styles.time}>
          {formatTime(zone.start)} – {formatTime(zone.end)}
        </Text>
        {isActive && <Text style={styles.active}>ACTIVE</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.red,
    backgroundColor: '#1a0a0a',
  },
  cardPast: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  currency: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '700',
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: 'auto',
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    color: colors.textMuted,
    fontSize: 13,
  },
  active: {
    color: colors.red,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
