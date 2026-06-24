import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { NewsEvent } from '../api/types';

function impactColor(impact: string) {
  switch (impact) {
    case 'High': return colors.high;
    case 'Medium': return colors.medium;
    default: return colors.low;
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]} ${d.getDate()}`;
}

export function EventCard({ event }: { event: NewsEvent }) {
  const now = new Date();
  const eventTime = new Date(event.event_time);
  const windowStart = new Date(event.window_start);
  const windowEnd = new Date(event.window_end);
  const isActive = now >= windowStart && now <= windowEnd;
  const isPast = now > windowEnd;

  return (
    <View style={[styles.card, isActive && styles.cardActive, isPast && styles.cardPast]}>
      <View style={styles.header}>
        <View style={[styles.impactBadge, { backgroundColor: impactColor(event.impact) }]}>
          <Text style={styles.impactText}>{event.impact}</Text>
        </View>
        <Text style={styles.currency}>{event.currency}</Text>
        <Text style={styles.date}>{formatDate(event.event_time)}</Text>
      </View>
      <Text style={styles.title}>{event.title}</Text>
      <View style={styles.meta}>
        <Text style={styles.time}>{formatTime(event.event_time)}</Text>
        <Text style={styles.window}>
          Window: {formatTime(event.window_start)} – {formatTime(event.window_end)} ({event.window_minutes}m)
        </Text>
      </View>
      {(event.forecast || event.previous) && (
        <View style={styles.dataRow}>
          {event.forecast && (
            <Text style={styles.dataItem}>Forecast: {event.forecast}</Text>
          )}
          {event.previous && (
            <Text style={styles.dataItem}>Previous: {event.previous}</Text>
          )}
          {event.actual && (
            <Text style={[styles.dataItem, styles.actual]}>Actual: {event.actual}</Text>
          )}
        </View>
      )}
      {isActive && <Text style={styles.activeLabel}>BLACKOUT ACTIVE</Text>}
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
    marginBottom: 8,
    gap: 8,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  impactText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  meta: {
    gap: 2,
  },
  time: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  window: {
    color: colors.textMuted,
    fontSize: 12,
  },
  dataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dataItem: {
    color: colors.textMuted,
    fontSize: 12,
  },
  actual: {
    color: colors.green,
    fontWeight: '600',
  },
  activeLabel: {
    color: colors.red,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 8,
    textAlign: 'center',
  },
});
