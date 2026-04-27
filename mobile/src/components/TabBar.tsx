import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { ModType } from '../signals';
import { ThemeTokens } from '../theme';

const ANALOG: ModType[] = ['AM', 'FM', 'PM'];
const DIGITAL: ModType[] = ['ASK', 'FSK', 'PSK'];

type Props = {
  selected: ModType;
  onSelect: (m: ModType) => void;
  tokens: ThemeTokens;
};

const Group: React.FC<{
  label: string;
  mods: ModType[];
  selected: ModType;
  onSelect: (m: ModType) => void;
  tokens: ThemeTokens;
}> = ({ label, mods, selected, onSelect, tokens }) => (
  <View style={styles.group}>
    <Text style={[styles.groupLabel, { color: tokens.textSubtle }]}>{label}</Text>
    {mods.map((m) => {
      const active = m === selected;
      return (
        <Pressable
          key={m}
          onPress={() => onSelect(m)}
          style={[
            styles.pill,
            {
              borderColor: active ? tokens.primary : tokens.border,
              backgroundColor: active ? tokens.primary : tokens.surface,
            },
          ]}
        >
          <Text style={{ color: active ? tokens.primaryText : tokens.text, fontFamily: 'Menlo', fontSize: 13 }}>
            {m}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export const TabBar: React.FC<Props> = ({ selected, onSelect, tokens }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
    <Group label="ANALOG" mods={ANALOG} selected={selected} onSelect={onSelect} tokens={tokens} />
    <View style={[styles.divider, { backgroundColor: tokens.border }]} />
    <Group label="DIGITAL" mods={DIGITAL} selected={selected} onSelect={onSelect} tokens={tokens} />
  </ScrollView>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 8 },
  group: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupLabel: { fontSize: 10, letterSpacing: 1, fontFamily: 'Menlo', marginRight: 4 },
  divider: { width: 1, height: 24, marginHorizontal: 4 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
});
