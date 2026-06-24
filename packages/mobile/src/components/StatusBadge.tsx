import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function StatusBadge({ safe, symbol }: { safe: boolean; symbol: string }) {
  return (
    <View style={[styles.container, safe ? styles.safe : styles.danger]}>
      <View style={[styles.dot, safe ? styles.dotSafe : styles.dotDanger]} />
      <Text style={[styles.label, safe ? styles.labelSafe : styles.labelDanger]}>
        {safe ? 'SAFE TO TRADE' : 'DO NOT TRADE'}
      </Text>
      <Text style={styles.symbol}>{symbol}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
  },
  safe: {
    backgroundColor: colors.greenDim,
    borderWidth: 1,
    borderColor: colors.green,
  },
  danger: {
    backgroundColor: colors.redDim,
    borderWidth: 1,
    borderColor: colors.red,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotSafe: { backgroundColor: colors.green },
  dotDanger: { backgroundColor: colors.red },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  labelSafe: { color: colors.green },
  labelDanger: { color: colors.red },
  symbol: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 'auto',
  },
});
