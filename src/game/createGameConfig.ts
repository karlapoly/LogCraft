import Phaser from "phaser";
import { PreloadScene } from "./scenes/PreloadScene";
import { CascataScene } from "./scenes/CascataScene";
import { GameScene } from "./scenes/GameScene";
import { IntroScene } from "./scenes/IntroScene";
import { WorldMapScene } from "./scenes/WorldMapScene";

export const GAME_WIDTH = 2340;
export const GAME_HEIGHT = 1280;

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#101215",
    pixelArt: false,
    antialias: true,
    scale: {
      parent,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [PreloadScene, IntroScene, WorldMapScene, GameScene, CascataScene]
  };
}
