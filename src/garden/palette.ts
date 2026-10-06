export const PALETTE = {
  green: '#4E9A5B',
  pink: '#F08C9A',
  yellow: '#F5B82E',
  blue: '#2F78C4',
  redOrange: '#E2522B',
  lilac: '#9B87C4',
  cream: '#EADCB4',
  navy: '#23449A',
  olive: '#93A62B',
} as const;

export const GOLD = '#C9971E';
export const GOLD_SHINE = '#F3D57A';
export const DOT = '#1F2A44';
// The orange from the reference flower; only used for blossom centres.
export const ORANGE = '#F28C28';

export const LEAF_COLORS = [PALETTE.green, PALETTE.blue, PALETTE.olive] as const;
export const CROWN_COLORS = [PALETTE.pink, PALETTE.redOrange, PALETTE.yellow, PALETTE.lilac] as const;
export const CENTER_COLORS = [PALETTE.cream, ORANGE] as const;

export const SCENE = {
  sky: '#E4EFEA',
  sun: PALETTE.yellow,
  cloud: PALETTE.cream,
  meadow: '#A9C29A',
  grass: PALETTE.green,
  soil: '#8A5A3C',
} as const;
