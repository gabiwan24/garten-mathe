import { createRng, type Rng } from '../lib/rng';
import type { PlantFamily, PlantStage } from '../lib/types';
import { CENTER_COLORS, CROWN_COLORS, DOT, GOLD, GOLD_SHINE, LEAF_COLORS, PALETTE } from './palette';
import { circlePath, leafPath, lobedFlower, polarBlob, ribbonPath, starPath, tulipPath } from './shapes';

export type NodeKind =
  | 'stem' | 'leaf' | 'crown' | 'bloom' | 'rim' | 'center' | 'seeds' | 'calyx' | 'bee' | 'wing' | 'stripe' | 'shine';

export interface PlantNode {
  id: string;
  kind: NodeKind;
  depth: number;
  d: string;
  fill: string;
  x: number;
  y: number;
  rot: number;
  /** null = no own spring; the node only moves with its parent. */
  stiffness: number | null;
  gold: boolean;
  children: PlantNode[];
}

export interface PlantSpec { seed: number; family: PlantFamily; stage: PlantStage; pracht: boolean }

export const VIEW = { w: 100, h: 140, baseX: 50, baseY: 134 } as const;

type CrownStyle = 'petal' | 'round' | 'tulip' | 'cherries' | 'lemon' | 'tomato' | 'coralFan' | 'star';
type GoldPart = 'center' | 'leaf' | 'bee' | 'rim';
interface CrownParams { petals: number; depth: number; phase: number; roundPetals: number; coralLobes: number; starPoints: number }
interface LeafStyle { lobes: number; depth: number; widthRatio: number }

const STEM_HEIGHT: Record<PlantStage, number> = { 2: 30, 3: 55, 4: 78, 5: 88 };
const SEGMENTS: Record<PlantStage, number> = { 2: 1, 3: 2, 4: 3, 5: 3 };
const LEAVES: Record<PlantStage, number> = { 2: 2, 3: 4, 4: 5, 5: 6 };
const LEAF_LEN: Record<PlantStage, number> = { 2: 16, 3: 20, 4: 24, 5: 26 };

const CROWNS: Record<PlantFamily, CrownStyle[]> = {
  flower: ['petal', 'round', 'tulip'],
  fruit: ['cherries', 'lemon', 'tomato'],
  coral: ['coralFan', 'star'],
};
const LEAF_STYLES: Record<PlantFamily, LeafStyle[]> = {
  flower: [{ lobes: 5, depth: 0.16, widthRatio: 0.55 }, { lobes: 2, depth: 0.04, widthRatio: 0.45 }],
  fruit: [{ lobes: 2, depth: 0.03, widthRatio: 0.5 }, { lobes: 3, depth: 0.08, widthRatio: 0.6 }],
  coral: [{ lobes: 7, depth: 0.3, widthRatio: 0.5 }, { lobes: 9, depth: 0.22, widthRatio: 0.4 }],
};

const round2 = (v: number) => Math.round(v * 100) / 100 || 0;
const clamp01 = (v: number) => Math.min(1, Math.max(0.05, v));

export function walk(node: PlantNode): PlantNode[] {
  return [node, ...node.children.flatMap(walk)];
}

function crownColorFor(style: CrownStyle, rng: Rng): string {
  if (style === 'lemon') return PALETTE.yellow;
  if (style === 'tomato') return PALETTE.redOrange;
  if (style === 'cherries') return rng.pick([PALETTE.pink, PALETTE.redOrange]);
  return rng.pick(CROWN_COLORS);
}

// `R` positions the shape, `grow` only scales its size: the gold rim reuses the same params slightly larger.
function crownPath(style: CrownStyle, p: CrownParams, R: number, grow: number): string {
  const s = R * grow;
  switch (style) {
    case 'petal': return lobedFlower(0, -R, s, p.petals, p.depth, p.phase);
    case 'round': return lobedFlower(0, -R, s, p.roundPetals, 0.12, p.phase);
    case 'tulip': return tulipPath(s * 1.5, s * 1.7);
    case 'cherries': return circlePath(-R * 0.5, R * 0.25, s * 0.5) + circlePath(R * 0.5, R * 0.45, s * 0.5);
    case 'lemon': return polarBlob(0, -R * 0.9, s * 0.95, [{ k: 2, amp: 0.12, phase: Math.PI / 2 }], 48, 0.72);
    case 'tomato': return polarBlob(0, -R, s, [{ k: 6, amp: 0.04, phase: p.phase }], 48, 0.88);
    case 'coralFan':
      return polarBlob(0, -R * 1.1, s, [{ k: p.coralLobes, amp: 0.3, phase: p.phase }, { k: 2, amp: 0.08, phase: 0 }], 72, 1.15);
    case 'star': return starPath(0, -R, s * 1.05, s * 0.45, p.starPoints);
  }
}

export function generatePlant(spec: PlantSpec): PlantNode {
  const rng = createRng(spec.seed);
  let counter = 0;
  const node = (kind: NodeKind, depth: number, d: string, fill: string, x: number, y: number, rot: number, stiffness: number | null): PlantNode => ({
    id: `${kind}-${counter++}`, kind, depth, d, fill, x: round2(x), y: round2(y), rot: round2(rot), stiffness, gold: false, children: [],
  });
  const shine = (x: number, y: number, r: number, depth: number) =>
    node('shine', depth, polarBlob(x, y, r, [], 16, 2.2), GOLD_SHINE, 0, 0, 0, null);

  const style = rng.pick(CROWNS[spec.family]);
  const leafStyle = rng.pick(LEAF_STYLES[spec.family]);
  const leafColor = rng.pick(LEAF_COLORS);
  const stemColor = leafColor === PALETTE.green ? PALETTE.olive : PALETTE.green;
  const crownColor = crownColorFor(style, rng);
  // Warm crowns get a cream centre so centre and petals never blur together.
  const centerColor = crownColor === PALETTE.yellow || crownColor === PALETTE.redOrange ? PALETTE.cream : rng.pick(CENTER_COLORS);
  const params: CrownParams = {
    petals: rng.int(5, 8),
    depth: 0.3 + rng.next() * 0.12,
    phase: rng.next() * Math.PI * 2,
    roundPetals: rng.int(8, 10),
    coralLobes: rng.int(5, 7),
    starPoints: rng.int(8, 10),
  };
  const hasCenter = style === 'petal' || style === 'round';
  const goldPart: GoldPart | null = spec.pracht
    ? rng.pick<GoldPart>(hasCenter ? ['center', 'leaf', 'bee', 'rim'] : ['leaf', 'bee', 'rim'])
    : null;

  const stage = spec.stage;
  const segCount = SEGMENTS[stage];
  const segLen = STEM_HEIGHT[stage] / segCount;
  const curve = rng.int(-8, 8);
  const segments: { node: PlantNode; bend: number }[] = [];
  for (let i = 0; i < segCount; i++) {
    const width = 5.5 - i * 1.3;
    const bend = (curve / segCount) * (0.6 + rng.next() * 0.8);
    const prev = segments[i - 1];
    const n = node(
      'stem', i, ribbonPath(segLen + 1, width, width - 1.3, bend), stemColor,
      prev ? prev.bend : VIEW.baseX, prev ? -segLen : VIEW.baseY, prev ? rng.int(-5, 5) : 0,
      clamp01(0.9 - i * 0.2 + (rng.next() - 0.5) * 0.1),
    );
    segments.push({ node: n, bend });
  }

  const leafCount = LEAVES[stage];
  const leaves: { node: PlantNode; length: number; width: number }[] = [];
  for (let i = 0; i < leafCount; i++) {
    const seg = segments[Math.min(segCount - 1, Math.floor((i * segCount) / leafCount))];
    const side = i % 2 === 0 ? -1 : 1;
    const t = 0.35 + rng.next() * 0.5;
    const length = LEAF_LEN[stage] + rng.int(-3, 3);
    const width = length * leafStyle.widthRatio;
    const leaf = node(
      'leaf', seg.node.depth + 1, leafPath(length, width, leafStyle.lobes, leafStyle.depth), leafColor,
      seg.bend * t * t, -segLen * t, side * rng.int(40, 65), 0.35 + rng.next() * 0.2,
    );
    seg.node.children.push(leaf);
    leaves.push({ node: leaf, length, width });
  }
  for (let i = 1; i < segCount; i++) segments[i - 1].node.children.push(segments[i].node);

  const buildCrown = (x: number, y: number, depth: number, R: number, gold: GoldPart | null): PlantNode => {
    const holder = node('crown', depth, '', 'none', x, y, rng.int(-8, 8), 0.5);
    if (gold === 'rim') {
      const rim = node('rim', depth + 1, crownPath(style, params, R, 1.14), GOLD, 0, 0, 0, null);
      rim.gold = true;
      rim.children.push(shine(-R * 1.05, -R, R * 0.1, depth + 2));
      holder.children.push(rim);
    }
    holder.children.push(node('bloom', depth + 1, crownPath(style, params, R, 1), crownColor, 0, 0, 0, null));
    if (hasCenter) {
      const r = R * (style === 'round' ? 0.42 : 0.32);
      const center = node('center', depth + 1, circlePath(0, -R, r), gold === 'center' ? GOLD : centerColor, 0, 0, 0, null);
      if (gold === 'center') {
        center.gold = true;
        center.children.push(shine(-r * 0.35, -R - r * 0.35, r * 0.3, depth + 2));
      }
      holder.children.push(center);
    }
    if (style === 'lemon') {
      let dots = '';
      for (let i = 0; i < 9; i++) {
        const a = rng.next() * Math.PI * 2, dist = rng.next() * R * 0.55;
        dots += circlePath(Math.cos(a) * dist * 1.2, -R * 0.9 + Math.sin(a) * dist * 0.6, 0.9);
      }
      holder.children.push(node('seeds', depth + 1, dots, DOT, 0, 0, 0, null));
    }
    if (style === 'tomato') holder.children.push(node('calyx', depth + 1, starPath(0, -R * 1.8, R * 0.45, R * 0.15, 6), PALETTE.green, 0, 0, 0, null));
    if (style === 'cherries') holder.children.push(node('calyx', depth + 1, leafPath(R * 0.9, R * 0.45, 2, 0.03), PALETTE.green, 0, 0, 50, null));
    return holder;
  };

  const top = segments[segCount - 1];
  if (stage >= 4) {
    const R = 14 * (spec.pracht ? 1.15 : stage === 4 ? 0.55 : 1);
    top.node.children.push(buildCrown(top.bend, -segLen, top.node.depth + 1, R, goldPart));
  }

  if (spec.pracht) {
    const mid = segments[Math.max(0, segCount - 2)];
    const side = rng.chance(0.5) ? -1 : 1;
    const branchLen = 24;
    const branch = node('stem', mid.node.depth + 1, ribbonPath(branchLen, 3, 2, side * 4), stemColor, mid.bend, -segLen, side * 38, 0.4);
    branch.children.push(buildCrown(side * 4, -branchLen, branch.depth + 1, 14 * 0.8, null));
    mid.node.children.push(branch);

    const goldBee = goldPart === 'bee';
    const bee = node('bee', top.node.depth + 1, polarBlob(0, 0, 5, [], 24, 0.7), goldBee ? GOLD : PALETTE.yellow, top.bend - side * 20, -segLen - 19, rng.int(-15, 15), 0.15);
    bee.children.push(node('wing', bee.depth + 1, polarBlob(-1, -4.5, 3.2, [], 20, 0.75), PALETTE.cream, 0, 0, 0, null));
    bee.children.push(node('stripe', bee.depth + 1, 'M-1.6,-3.4L-0.4,-3.5L-0.4,3.5L-1.6,3.4ZM1.4,-3.1L2.6,-2.8L2.6,2.8L1.4,3.1Z', DOT, 0, 0, 0, null));
    if (goldBee) {
      bee.gold = true;
      bee.children.push(shine(-2.5, -1, 0.9, bee.depth + 1));
    }
    top.node.children.push(bee);
  }

  if (goldPart === 'leaf') {
    const leaf = rng.pick(leaves);
    leaf.node.fill = GOLD;
    leaf.node.gold = true;
    leaf.node.children.push(shine(-leaf.width * 0.15, -leaf.length * 0.55, leaf.width * 0.12, leaf.node.depth + 1));
  }

  return segments[0].node;
}
