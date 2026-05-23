import Phaser from "phaser";
import { EstadoDoBioma } from "../../state/EstadoDoBioma";
import { biomaStoreApi, type BiomaState } from "../../state/biomaStore";
import type { LevelConfig } from "../../levels/types";
import { BiomaLayer } from "./BiomaLayer";
import { CorrupcaoLayer } from "./CorrupcaoLayer";

export class BiomaManager {
  private readonly scene: Phaser.Scene;
  private readonly level: LevelConfig;
  private readonly store = biomaStoreApi;
  private biomaLayer!: BiomaLayer;
  private corrupcaoLayer!: CorrupcaoLayer;
  private unsubscribe?: () => void;

  public constructor(scene: Phaser.Scene, level: LevelConfig) {
    this.scene = scene;
    this.level = level;
  }

  public boot(): void {
    const { restaurado, corrompido } = this.level.biome;

    this.biomaLayer = new BiomaLayer(this.scene, restaurado);
    this.corrupcaoLayer = new CorrupcaoLayer(this.scene, corrompido);
    this.layout(new Phaser.Geom.Rectangle(0, 0, this.scene.scale.width, this.scene.scale.height));

    this.applyState(this.store.getState().estadoDoBioma);

    this.unsubscribe = this.store.subscribe((state: BiomaState) => {
      this.applyState(state.estadoDoBioma);
    });

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
    });
  }

  public iniciarRestauracao(): void {
    this.store.getState().iniciarRestauracao();
  }

  public layout(bounds: Phaser.Geom.Rectangle): void {
    this.biomaLayer.layout(bounds);
    this.corrupcaoLayer.layout(bounds);
  }

  private applyState(estado: EstadoDoBioma): void {
    this.biomaLayer.setVisible(true);

    if (estado === EstadoDoBioma.CORROMPIDO) {
      this.biomaLayer.setAlpha(0.72);
      this.corrupcaoLayer.reset();
      return;
    }

    if (estado === EstadoDoBioma.RESTAURADO) {
      this.biomaLayer.setAlpha(1);
      this.corrupcaoLayer.hideImmediately();
      return;
    }

    this.scene.cameras.main.flash(450, 236, 216, 140, false);
    this.biomaLayer.fadeTo(1, 900);
    this.corrupcaoLayer.fadeOut(900, () => {
      this.store.getState().concluirRestauracao(this.level.id);
    });
  }
}
