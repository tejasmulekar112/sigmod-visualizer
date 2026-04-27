const TWO_PI = Math.PI * 2;
const BIT_PATTERN = [1, 0, 1, 1, 0, 1, 0, 0];

export type ModType = 'AM' | 'FM' | 'PM' | 'ASK' | 'FSK' | 'PSK';

export type State = {
  mod: ModType;
  fc: number; fm: number; m: number;
  ac: number; am: number; dc: number;
  tw: number; fs: number; snr: number;
};

export type Strength = {
  sliderLabel: string;
  cardLabel: string;
  symbol: string;
  unit: string;
  value: (p: State) => string;
};

export type Scheme = {
  message: (t: number, p: State) => number;
  carrier: (t: number, p: State) => number;
  output: (t: number, p: State) => number;
  equation: string;
  bandwidth: (p: State) => number;
  strength: Strength;
};

function bitAt(t: number, fm: number): number {
  const idx = Math.floor(t * fm) % BIT_PATTERN.length;
  return BIT_PATTERN[idx];
}

export const signals: Record<ModType, Scheme> = {
  AM: {
    message: (t, p) => p.am * Math.cos(TWO_PI * p.fm * t) + p.dc,
    carrier: (t, p) => p.ac * Math.cos(TWO_PI * p.fc * t),
    output: (t, p) => {
      const env = 1 + p.m * (p.am * Math.cos(TWO_PI * p.fm * t) + p.dc);
      const norm = 1 + p.m * (p.am + Math.abs(p.dc));
      return p.ac * (env / norm) * Math.cos(TWO_PI * p.fc * t);
    },
    equation: 's(t) = Ac · [1 + m·(Am·cos(2π·fₘ·t) + DC)] · cos(2π·fc·t)',
    bandwidth: (p) => 2 * p.fm,
    strength: { sliderLabel: 'Modulation index', cardLabel: 'Modulation index', symbol: 'm', unit: '', value: (p) => p.m.toFixed(2) },
  },
  FM: {
    message: (t, p) => p.am * Math.cos(TWO_PI * p.fm * t),
    carrier: (t, p) => p.ac * Math.cos(TWO_PI * p.fc * t),
    output: (t, p) => {
      const beta = 5 * p.m;
      return p.ac * Math.cos(TWO_PI * p.fc * t + beta * Math.sin(TWO_PI * p.fm * t));
    },
    equation: 's(t) = Ac · cos(2π·fc·t + β·sin(2π·fₘ·t)),  β = 5m',
    bandwidth: (p) => 2 * (5 * p.m + 1) * p.fm,
    strength: { sliderLabel: 'Modulation index', cardLabel: 'Modulation index', symbol: 'β', unit: '', value: (p) => (5 * p.m).toFixed(2) },
  },
  PM: {
    message: (t, p) => p.am * Math.cos(TWO_PI * p.fm * t),
    carrier: (t, p) => p.ac * Math.cos(TWO_PI * p.fc * t),
    output: (t, p) => {
      const kp = Math.PI * p.m;
      return p.ac * Math.cos(TWO_PI * p.fc * t + kp * Math.cos(TWO_PI * p.fm * t));
    },
    equation: 's(t) = Ac · cos(2π·fc·t + kp·cos(2π·fₘ·t)),  kp = π·m',
    bandwidth: (p) => 2 * (Math.PI * p.m + 1) * p.fm,
    strength: { sliderLabel: 'Phase deviation', cardLabel: 'Phase deviation', symbol: 'kp', unit: 'rad', value: (p) => (Math.PI * p.m).toFixed(2) },
  },
  ASK: {
    message: (t, p) => p.am * (bitAt(t, p.fm) ? 1 : -1),
    carrier: (t, p) => p.ac * Math.cos(TWO_PI * p.fc * t),
    output: (t, p) => {
      const b = bitAt(t, p.fm);
      const envelope = b ? p.am : p.am * (1 - p.m);
      return p.ac * envelope * Math.cos(TWO_PI * p.fc * t);
    },
    equation: 's(t) = Ac · A(t) · cos(2π·fc·t),  A∈{Am, Am·(1−m)}',
    bandwidth: (p) => 2 * p.fm,
    strength: { sliderLabel: 'Amplitude ratio', cardLabel: 'Amplitude ratio', symbol: 'A1/A0', unit: '', value: (p) => p.m >= 0.999 ? '∞' : (1 / (1 - p.m)).toFixed(2) },
  },
  FSK: {
    message: (t, p) => p.am * (bitAt(t, p.fm) ? 1 : -1),
    carrier: (t, p) => p.ac * Math.cos(TWO_PI * p.fc * t),
    output: (t, p) => {
      const deltaF = p.m * p.fm;
      const f = bitAt(t, p.fm) ? (p.fc + deltaF) : (p.fc - deltaF);
      return p.ac * Math.cos(TWO_PI * f * t);
    },
    equation: 's(t) = Ac · cos(2π·[fc ± Δf]·t),  Δf = m·fₘ',
    bandwidth: (p) => 2 * p.fm * (1 + p.m),
    strength: { sliderLabel: 'Freq separation', cardLabel: 'Freq separation', symbol: 'Δf', unit: 'Hz', value: (p) => (p.m * p.fm).toFixed(2) },
  },
  PSK: {
    message: (t, p) => p.am * (bitAt(t, p.fm) ? 1 : -1),
    carrier: (t, p) => p.ac * Math.cos(TWO_PI * p.fc * t),
    output: (t, p) => {
      const phi = bitAt(t, p.fm) ? p.m * Math.PI : 0;
      return p.ac * Math.cos(TWO_PI * p.fc * t + phi);
    },
    equation: 's(t) = Ac · cos(2π·fc·t + φ),  φ ∈ {0, m·π}',
    bandwidth: (p) => 2 * p.fm,
    strength: { sliderLabel: 'Phase shift', cardLabel: 'Phase shift', symbol: 'Δφ', unit: 'rad', value: (p) => (Math.PI * p.m).toFixed(2) },
  },
};

export function gaussian(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TWO_PI * v);
}

export const DEFAULT_STATE: State = {
  mod: 'AM',
  fc: 10, fm: 2, m: 0.5,
  ac: 1.0, am: 1.0, dc: 0.0,
  tw: 1.0, fs: 200, snr: 30,
};
