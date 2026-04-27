import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ThemeTokens } from '../theme';

type Props = {
  title: string;
  defaultOpen?: boolean;
  tokens: ThemeTokens;
  children: React.ReactNode;
};

export const Collapsible: React.FC<Props> = ({ title, defaultOpen = true, tokens, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
      <Pressable onPress={() => setOpen(!open)} style={styles.header}>
        <Text style={[styles.title, { color: tokens.textMuted }]}>{title.toUpperCase()}</Text>
        <Text style={[styles.chevron, { color: tokens.textMuted }]}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 10, marginVertical: 6, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  title: { fontSize: 11, letterSpacing: 0.6, fontFamily: 'Menlo' },
  chevron: { fontSize: 14, fontFamily: 'Menlo' },
  body: { paddingHorizontal: 14, paddingBottom: 14 },
});
