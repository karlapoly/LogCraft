import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createGameConfig } from "../game/createGameConfig";

export function PhaserGameHost() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) {
      return;
    }

    const syncViewportSize = () => {
      if (!mountRef.current) {
        return;
      }

      mountRef.current.style.width = `${window.innerWidth}px`;
      mountRef.current.style.height = `${window.innerHeight}px`;
    };

    syncViewportSize();
    const game = new Phaser.Game(createGameConfig(mountRef.current));
    window.addEventListener("resize", syncViewportSize);

    return () => {
      window.removeEventListener("resize", syncViewportSize);
      game.destroy(true);
    };
  }, []);

  return <div className="phaser-host" ref={mountRef} />;
}
