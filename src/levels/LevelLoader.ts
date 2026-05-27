import type Phaser from "phaser";
import type { LevelConfig } from "./types";

const DEFAULT_LEVEL_ID = "level-01";

function isLevelConfig(value: unknown): value is LevelConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const level = value as Partial<LevelConfig>;

  return (
    typeof level.id === "string" &&
    typeof level.nome === "string" &&
    typeof level.biome?.restaurado === "string" &&
    typeof level.biome?.corrompido === "string" &&
    typeof level.robotSpawn?.x === "number" &&
    typeof level.robotSpawn?.y === "number" &&
    Array.isArray(level.waterSlots) &&
    Array.isArray(level.targets)
  );
}

export class LevelLoader {
  public getLevelUrl(levelId: string): string {
    return `${import.meta.env.BASE_URL}levels/${levelId}.json`;
  }

  public getCacheKey(levelId: string): string {
    return `level:${levelId}`;
  }

  public getById(scene: Phaser.Scene, levelId: string): LevelConfig {
    const cacheKey = this.getCacheKey(levelId);
    const rawLevel = scene.cache.json.get(cacheKey) as unknown;

    if (!isLevelConfig(rawLevel)) {
      throw new Error(
        `LevelLoader: configuracao invalida ou ausente para "${levelId}" em ${this.getLevelUrl(levelId)}`
      );
    }

    return rawLevel;
  }

  public getFirstLevelId(): string {
    return DEFAULT_LEVEL_ID;
  }
}

export const levelLoader = new LevelLoader();
