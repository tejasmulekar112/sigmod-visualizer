import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, LayoutChangeEvent, Pressable, StatusBar } from 'react-native';
import { signals, DEFAULT_STATE, State, ModType } from './src/signals';
import { useTheme } from './src/theme';
import { TabBar } from './src/components/TabBar';
import { MetricCard } from './src/components/MetricCard';
import { ControlSlider } from './src/components/ControlSlider';
import { Collapsible } from './src/components/Collapsible';
import { WaveformCanvas } from './src/components/WaveformCanvas';

export default function App() {
  const { tokens, mode, cycle } = useTheme();
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [canvasWidth, setCanvasWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setCanvasWidth(e.nativeEvent.layout.width);
  }, []);

  const update = <K extends keyof State>(key: K, value: State[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const sig = signals[state.mod];
  const messageFn = useCallback((t: number) => sig.message(t, state), [sig, state]);
  const carrierFn = useCallback((t: number) => sig.carrier(t, state), [sig, state]);
  const outputFn = useCallback((t: number) => sig.output(t, state), [sig, state]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bg }}>
      <StatusBar barStyle={tokens.bg === '#0d1015' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={[styles.header, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
          <View>
            <Text style={[styles.brand, { color: tokens.text }]}>SigMod Visualizer</Text>
            <Text style={[styles.subtitle, { color: tokens.textMuted }]}>ECE MINI-PROJECT</Text>
          </View>
          <Pressable
            onPress={cycle}
            style={[styles.themeBtn, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
          >
            <Text style={{ color: tokens.text, fontFamily: 'Menlo', fontSize: 12 }}>
              ◐ {mode}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.tabsWrap, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
          <TabBar selected={state.mod} onSelect={(m: ModType) => update('mod', m)} tokens={tokens} />
        </View>

        <View style={styles.metricGrid}>
          <MetricCard label="Carrier freq" value={String(state.fc)} unit="Hz" symbol="fc" tokens={tokens} />
          <MetricCard label="Message freq" value={String(state.fm)} unit="Hz" symbol="fm" tokens={tokens} />
        </View>
        <View style={styles.metricGrid}>
          <MetricCard label={sig.strength.cardLabel} value={sig.strength.value(state)} unit={sig.strength.unit} symbol={sig.strength.symbol} tokens={tokens} />
          <MetricCard label="Bandwidth" value={sig.bandwidth(state).toFixed(1)} unit="Hz" symbol="BW" tokens={tokens} />
        </View>

        <View style={[styles.canvasCard, { borderColor: tokens.border, backgroundColor: tokens.surface }]} onLayout={onLayout}>
          <Text style={[styles.canvasCaption, { color: tokens.textMuted }]}>MODULATED OUTPUT · s(t)</Text>
          {canvasWidth > 0 && (
            <WaveformCanvas
              valueAt={outputFn}
              fs={state.fs}
              tw={state.tw}
              snrDb={state.snr}
              color={tokens.purple}
              axisColor={tokens.axis}
              width={canvasWidth - 32}
            />
          )}
        </View>

        <Collapsible title="Show message + carrier" defaultOpen={false} tokens={tokens}>
          <Text style={[styles.canvasCaption, { color: tokens.textMuted }]}>MESSAGE · m(t)</Text>
          {canvasWidth > 0 && (
            <WaveformCanvas valueAt={messageFn} fs={state.fs} tw={state.tw} color={tokens.teal} axisColor={tokens.axis} width={canvasWidth - 60} />
          )}
          <Text style={[styles.canvasCaption, { color: tokens.textMuted, marginTop: 12 }]}>CARRIER · c(t)</Text>
          {canvasWidth > 0 && (
            <WaveformCanvas valueAt={carrierFn} fs={state.fs} tw={state.tw} color={tokens.blue} axisColor={tokens.axis} width={canvasWidth - 60} />
          )}
        </Collapsible>

        <Collapsible title="Signal" tokens={tokens}>
          <ControlSlider label="Carrier amplitude" value={state.ac} min={0.1} max={2.0} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => update('ac', v)} tokens={tokens} />
          <ControlSlider label="Carrier frequency" value={state.fc} min={5} max={20} step={1} unit="Hz" onChange={(v) => update('fc', Math.round(v))} tokens={tokens} />
          <ControlSlider label="Message amplitude" value={state.am} min={0.1} max={2.0} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => update('am', v)} tokens={tokens} />
          <ControlSlider label="Message frequency" value={state.fm} min={1} max={10} step={1} unit="Hz" onChange={(v) => update('fm', Math.round(v))} tokens={tokens} />
          <ControlSlider label="Message DC offset" value={state.dc} min={-1.0} max={1.0} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => update('dc', v)} tokens={tokens} />
          <ControlSlider label={sig.strength.sliderLabel} value={state.m} min={0} max={1.0} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => update('m', v)} tokens={tokens} />
        </Collapsible>

        <Collapsible title="DSP & channel" tokens={tokens}>
          <ControlSlider label="Time window" value={state.tw} min={0.5} max={3.0} step={0.1} unit="s" format={(v) => v.toFixed(2)} onChange={(v) => update('tw', v)} tokens={tokens} />
          <ControlSlider label="Sampling rate" value={state.fs} min={20} max={1000} step={10} unit="sps" onChange={(v) => update('fs', Math.round(v))} tokens={tokens} />
          <ControlSlider label="SNR" value={state.snr} min={5} max={40} step={1} unit="dB" onChange={(v) => update('snr', Math.round(v))} tokens={tokens} />
        </Collapsible>

        <View style={[styles.eqCard, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
          <Text style={[styles.eqLabel, { color: tokens.textMuted }]}>EQUATION</Text>
          <Text style={[styles.eqText, { color: tokens.text }]}>{sig.equation}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 12, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 14 },
  brand: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 11, letterSpacing: 0.6, fontFamily: 'Menlo', marginTop: 2 },
  themeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  tabsWrap: { borderWidth: 1, borderRadius: 10, paddingVertical: 12 },
  metricGrid: { flexDirection: 'row', gap: 10 },
  canvasCard: { borderWidth: 1, borderRadius: 10, padding: 16 },
  canvasCaption: { fontSize: 10, letterSpacing: 0.6, fontFamily: 'Menlo', marginBottom: 8 },
  eqCard: { borderWidth: 1, borderRadius: 10, padding: 16 },
  eqLabel: { fontSize: 10, letterSpacing: 0.6, fontFamily: 'Menlo', marginBottom: 4 },
  eqText: { fontSize: 14, fontFamily: 'Menlo' },
});
