import type { AppState, PlantFamily, TaskTypeId } from '../lib/types';
import { addBridgeTen } from './addBridgeTen';
import { decompose } from './decompose';
import { fillTen } from './fillTen';
import type { AnyTask, TaskGenerator } from './model';

export interface TaskTypeDef {
  id: TaskTypeId;
  label: string;
  family: PlantFamily;
  generator: TaskGenerator<AnyTask>;
  praise: readonly string[];
  unlocked(levels: AppState['levels']): boolean;
}

export const TASK_TYPES: Record<TaskTypeId, TaskTypeDef> = {
  decompose: {
    id: 'decompose',
    label: 'Zahlen zerlegen',
    family: 'flower',
    generator: decompose,
    praise: ['Du hast genau hingeschaut!', 'Prima zerlegt!', 'Du kennst die Zahl in- und auswendig!'],
    unlocked: () => true,
  },
  fillTen: {
    id: 'fillTen',
    label: 'Bis 10 auffüllen',
    family: 'fruit',
    generator: fillTen,
    praise: ['Verliebte Zahlen gefunden!', 'Du kennst die Zehnerpartner!', 'Genau – zusammen sind es 10!'],
    unlocked: () => true,
  },
  addBridgeTen: {
    id: 'addBridgeTen',
    label: 'Über die 10 rechnen',
    family: 'coral',
    generator: addBridgeTen,
    praise: ['Du hast zuerst die 10 voll gemacht!', 'Erst bis 10, dann weiter – super Weg!', 'Schlau über die 10 gesprungen!'],
    // Builds on both basics, so it waits until they are no longer at the entry level.
    unlocked: (levels) => levels.decompose >= 2 && levels.fillTen >= 2,
  },
};
