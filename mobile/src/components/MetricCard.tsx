import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeTokens } from '../theme';

type Props = {
  label: string;
  value: string;
  unit?: string;
  symbol: string;
  tokens: ThemeTokens;
};

export const MetricCard: React.FC<Props> = ({ label, value, unit, symbol, tokens }) => (
  <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
    <Text style={[styles.label, { color: tokens.textMuted }]}>{label.toUpperCase()}</Text>
    <View style={styles.valueRow}>
      <Text style={[styles.value, { color: tokens.text }]}>{value}</Text>
      {unit ? <Text style={[styles.unit, { color: tokens.textMuted }]}>{unit}</Text> : null}
    </View>
    <Text style={[styles.symbol, { color: tokens.textSubtle }]}>{symbol}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 64, borderWidth: 1, borderRadius: 10, padding: 12, justifyContent: 'space-between' },
  label: { fontSize: 10, letterSpacing: 0.6, fontFamily: 'Menlo' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginVertical: 4 },
  value: { fontSize: 18, fontFamily: 'Menlo' },
  unit: { fontSize: 11, fontFamily: 'Menlo' },
  symbol: { position: 'absolute', top: 8, right: 10, fontSize: 10, fontFamily: 'Menlo' },
});
