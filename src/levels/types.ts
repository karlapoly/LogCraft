export type LevelBiomeAssetConfig = {
  restaurado: string;
  corrompido: string;
};

export type LevelTargetConfig = {
  output: string;
  initial: number;
  goal: number;
};

export type WaterSlotConfig = {
  id: string;
  x: number;
  y: number;
};

export type LevelConfig = {
  id: string;
  nome: string;
  biome: LevelBiomeAssetConfig;
  assets?: {
    robo_adicao?: string;
    robo_divisao?: string;
  };
  robotSpawn: {
    x: number;
    y: number;
  };
  waterSlots: WaterSlotConfig[];
  targets: LevelTargetConfig[];
};
