import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createGameConfig } from "../game/createGameConfig";

export function PhaserCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) {
      return;
    }

    const game = new Phaser.Game(createGameConfig(mountRef.current));
    return () => {
      game.destroy(true);
    };
  }, []);

  return <div className="phaser-host" ref={mountRef} />;
}
