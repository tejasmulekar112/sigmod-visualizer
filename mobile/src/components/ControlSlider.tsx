import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { ThemeTokens } from '../theme';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  tokens: ThemeTokens;
};

export const ControlSlider: React.FC<Props> = ({
  label, value, min, max, step, unit = '', format, onChange, tokens,
}) => {
  const display = format ? format(value) : value.toString();
  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <Text style={[styles.label, { color: tokens.textMuted }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.value, { color: tokens.text }]}>
          {display}{unit ? ` ${unit}` : ''}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={tokens.primary}
        maximumTrackTintColor={tokens.border}
        thumbTintColor={tokens.primary}
      />
      <View style={styles.range}>
        <Text style={[styles.rangeText, { color: tokens.textSubtle }]}>{min}</Text>
        <Text style={[styles.rangeText, { color: tokens.textSubtle }]}>{max}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { paddingVertical: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  label: { fontSize: 11, letterSpacing: 0.5, fontFamily: 'Menlo' },
  value: { fontSize: 13, fontFamily: 'Menlo' },
  slider: { width: '100%', height: 32 },
  range: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  rangeText: { fontSize: 10, fontFamily: 'Menlo' },
});
