import { useEffect, useRef } from "react";
import type Phaser from "phaser";

export function PhaserGameHost() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement) {
      return;
    }

    let game: Phaser.Game | undefined;
    let isDisposed = false;

    const syncViewportSize = () => {
      mountElement.style.width = `${window.innerWidth}px`;
      mountElement.style.height = `${window.innerHeight}px`;
    };

    syncViewportSize();
    window.addEventListener("resize", syncViewportSize);

    void Promise.all([import("phaser"), import("../game/createGameConfig")]).then(
      ([{ default: Phaser }, { createGameConfig }]) => {
        if (isDisposed) {
          return;
        }

        game = new Phaser.Game(createGameConfig(mountElement));
      }
    );

    return () => {
      isDisposed = true;
      window.removeEventListener("resize", syncViewportSize);
      game?.destroy(true);
    };
  }, []);

  return <div className="phaser-host" ref={mountRef} />;
}
