import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { gaussian } from '../signals';

type Props = {
  valueAt: (t: number) => number;
  fs: number;
  tw: number;
  snrDb?: number;
  color: string;
  axisColor: string;
  width: number;
  height?: number;
};

const WaveformCanvasInner: React.FC<Props> = ({
  valueAt, fs, tw, snrDb, color, axisColor, width, height = 140,
}) => {
  const { axis, wave } = useMemo(() => {
    const N = Math.max(2, Math.round(fs * tw));
    const samples = new Array<number>(N + 1);
    let power = 0;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * tw;
      const s = valueAt(t);
      samples[i] = s;
      power += s * s;
    }
    power /= (N + 1);
    const sigma = snrDb !== undefined
      ? Math.sqrt(power / Math.pow(10, snrDb / 10))
      : 0;

    const amp = (height / 2) * 0.8;
    const wavePath = Skia.Path.Make();
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * width;
      const y = height / 2 - (samples[i] + sigma * gaussian()) * amp;
      if (i === 0) wavePath.moveTo(x, y);
      else wavePath.lineTo(x, y);
    }

    const axisPath = Skia.Path.Make();
    axisPath.moveTo(0, height / 2);
    axisPath.lineTo(width, height / 2);

    return { axis: axisPath, wave: wavePath };
  }, [valueAt, fs, tw, snrDb, width, height]);

  return (
    <View style={{ width, height }}>
      <Canvas style={{ flex: 1 }}>
        <Path path={axis} color={axisColor} style="stroke" strokeWidth={1} />
        <Path path={wave} color={color} style="stroke" strokeWidth={2} strokeJoin="round" />
      </Canvas>
    </View>
  );
};

export const WaveformCanvas = React.memo(WaveformCanvasInner);
