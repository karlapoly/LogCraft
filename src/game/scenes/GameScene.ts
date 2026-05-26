import Phaser from "phaser";
import { levelLoader } from "../../levels/LevelLoader";
import type { LevelConfig, WaterSlotConfig } from "../../levels/types";
import { FlowEngine, type TipoDeOperacao } from "../../logic/FlowEngine";
import { biomaStoreApi, type MetaDeBioma, type BiomaState } from "../../state/biomaStore";
import { EstadoDoBioma } from "../../state/EstadoDoBioma";

type GameSceneData = {
  levelId?: string;
};

type SlotView = {
  slot: WaterSlotConfig;
  output: string;
  anchorX: number;
  anchorY: number;
  zone: Phaser.GameObjects.Zone;
  plaque: Phaser.GameObjects.Image;
  ring: Phaser.GameObjects.Ellipse;
  valueText: Phaser.GameObjects.Text;
  progressText: Phaser.GameObjects.Text;
  meterBackground: Phaser.GameObjects.Rectangle;
  meterFill: Phaser.GameObjects.Rectangle;
};

type RobotButtonView = {
  operation: TipoDeOperacao;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  homeX: number;
  homeY: number;
};

export class GameScene extends Phaser.Scene {
  private static readonly BASE_WIDTH = 1024;
  private static readonly BASE_HEIGHT = 640;
  private static readonly LEVEL_PLAQUE_KEY = "level-plaque";
  private static readonly LEVEL_PLAQUE_PATH = "assets/images/Botoes/PlacaNivel.png";
  private static readonly ROBOT_PANEL_KEY = "robot-panel-plaque";
  private static readonly ROBOT_PANEL_PATH = "assets/images/Botoes/PlacaRobos.png";
  private static readonly BACK_BUTTON_KEY = "robot-back-button";
  private static readonly BACK_BUTTON_PATH = "assets/images/Botoes/Back.png";
  private static readonly TOP_PADDING = 26;
  private static readonly SIDE_PADDING = 40;
  private static readonly BOTTOM_PADDING = 28;
  private static readonly PANEL_WIDTH = 132;
  private static readonly PANEL_HEIGHT = 182;
  private static readonly HEALTH_RING_RADIUS = 52;
  private static readonly HEALTH_RING_THICKNESS = 14;
  private static readonly PLAYFIELD_TOP_OFFSET = 108;
  private static readonly PLAYFIELD_SIDE_MARGIN = 32;
  private static readonly SLOT_ZONE_WIDTH = 230;
  private static readonly SLOT_ZONE_HEIGHT = 150;
  private static readonly SLOT_PLAQUE_WIDTH = 174;
  private static readonly SLOT_PLAQUE_HEIGHT = 98;
  private static readonly SLOT_RING_WIDTH = 158;
  private static readonly SLOT_RING_HEIGHT = 62;
  private static readonly SLOT_METER_WIDTH = 108;
  private static readonly SLOT_METER_HEIGHT = 10;
  private static readonly SLOT_METER_FILL_WIDTH = 112;
  private static readonly SLOT_METER_FILL_HEIGHT = 6;

  private fullscreenBiomeLayer?: Phaser.GameObjects.Image;
  private fullscreenCorruptionLayer?: Phaser.GameObjects.Image;
  private readonly flowEngine = new FlowEngine();
  private currentLevel!: LevelConfig;
  private currentLevelId = "level-01";
  private panelContainer!: Phaser.GameObjects.Container;
  private topHudContainer!: Phaser.GameObjects.Container;
  private resultText?: Phaser.GameObjects.Text;
  private ecosystemHealthFill?: Phaser.GameObjects.Graphics;
  private ecosystemHealthBackground?: Phaser.GameObjects.Graphics;
  private ecosystemHealthText?: Phaser.GameObjects.Text;
  private scoreTexts = new Map<string, Phaser.GameObjects.Text>();
  private slotViews = new Map<string, SlotView>();
  private robotButtons = new Map<TipoDeOperacao, RobotButtonView>();
  private unsubscribeStore?: () => void;
  private playfieldBounds = new Phaser.Geom.Rectangle(0, 0, GameScene.BASE_WIDTH, GameScene.BASE_HEIGHT);
  private slotLayoutBaseWidth = GameScene.BASE_WIDTH;
  private slotLayoutBaseHeight = GameScene.BASE_HEIGHT;

  public constructor() {
    super("GameScene");
  }

  public init(data: GameSceneData): void {
    this.currentLevelId = data.levelId ?? "level-01";
  }

  public preload(): void {
    const levelUrl = levelLoader.getLevelUrl(this.currentLevelId);
    const levelCacheKey = levelLoader.getCacheKey(this.currentLevelId);

    console.log(`[GameScene] JSON do nivel: ${this.resolveAssetUrl(levelUrl)}`);
    this.load.json(levelCacheKey, levelUrl);

    if (!this.textures.exists(GameScene.LEVEL_PLAQUE_KEY)) {
      this.load.image(GameScene.LEVEL_PLAQUE_KEY, GameScene.LEVEL_PLAQUE_PATH);
    }

    if (!this.textures.exists(GameScene.ROBOT_PANEL_KEY)) {
      this.load.image(GameScene.ROBOT_PANEL_KEY, GameScene.ROBOT_PANEL_PATH);
    }

    if (!this.textures.exists(GameScene.BACK_BUTTON_KEY)) {
      this.load.image(GameScene.BACK_BUTTON_KEY, GameScene.BACK_BUTTON_PATH);
    }

    this.load.on('complete', () => {
      const level = levelLoader.getById(this, this.currentLevelId);

      console.log(`[GameScene] Imagem restaurada: ${this.resolveAssetUrl(level.biome.restaurado)}`);
      console.log(`[GameScene] Imagem corrompida: ${this.resolveAssetUrl(level.biome.corrompido)}`);

      if (!this.textures.exists(level.biome.restaurado)) {
        this.load.image(level.biome.restaurado, level.biome.restaurado);
      }

      if (!this.textures.exists(level.biome.corrompido)) {
        this.load.image(level.biome.corrompido, level.biome.corrompido);
      }

      if (level.assets?.robo_adicao && !this.textures.exists(level.assets.robo_adicao)) {
        console.log(`[GameScene] Robô adição: ${this.resolveAssetUrl(level.assets.robo_adicao)}`);
        this.load.image(level.assets.robo_adicao, level.assets.robo_adicao);
      }

      if (level.assets?.robo_divisao && !this.textures.exists(level.assets.robo_divisao)) {
        console.log(`[GameScene] Robô divisão: ${this.resolveAssetUrl(level.assets.robo_divisao)}`);
        this.load.image(level.assets.robo_divisao, level.assets.robo_divisao);
      }
    }, this);
  }

  public create(): void {
    this.currentLevel = levelLoader.getById(this, this.currentLevelId);
    const metas: MetaDeBioma[] = this.currentLevel.targets.map(t => ({
      output: t.output,
      initial: t.initial,
      goal: t.goal,
      current: t.initial
    }));
    biomaStoreApi.getState().inicializarNivel(this.currentLevel.id, metas);

    this.createFullscreenBackground();

    this.createTopHud();
    this.createEcosystemHealthBar();
    this.createSlotZones();
    this.createRightPanel();
    this.createFooterMessage();
    this.installInputEvents();
    this.installStoreSync();
    this.installResetShortcut();
    this.renderMetaValues(biomaStoreApi.getState().metas);
    this.layoutScene(this.scale.width, this.scale.height);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeStore?.();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
  }

  private createTopHud(): void {
    const tituloLog = this.add.text(0, 0, "Log", {
      font: "bold 52px Arial",
      color: "#4CAF50"
    });
    tituloLog.setStroke("#FFFFFF", 10);
    tituloLog.setShadow(3, 3, "#333333", 3, true, true);

    const tituloCraft = this.add.text(tituloLog.width - 6, 0, "Craft:", {
      font: "bold 52px Arial",
      color: "#f59e0b"
    });
    tituloCraft.setStroke("#FFFFFF", 10);
    tituloCraft.setShadow(3, 3, "#333333", 3, true, true);

    const subtitulo = this.add.text(8, 48, "Cascata de Dados", {
      font: "bold 24px Arial",
      color: "#F2F2F2"
    });
    subtitulo.setStroke("#000000", 4);
    subtitulo.setShadow(2, 2, "#000000", 1, false, false);

    this.topHudContainer = this.add.container(GameScene.SIDE_PADDING, GameScene.TOP_PADDING, [tituloLog, tituloCraft, subtitulo]);
    this.topHudContainer.setDepth(20);
  }

  private createFullscreenBackground(): void {
    this.fullscreenBiomeLayer = this.add.image(0, 0, this.currentLevel.biome.restaurado).setOrigin(0.5).setDepth(-20);
    this.fullscreenCorruptionLayer = this.add
      .image(0, 0, this.currentLevel.biome.corrompido)
      .setOrigin(0.5)
      .setDepth(-19);

    this.syncFullscreenBackgroundState(biomaStoreApi.getState().estadoDoBioma, true);
  }

  private createEcosystemHealthBar(): void {
    this.ecosystemHealthBackground = this.add.graphics();
    this.ecosystemHealthFill = this.add.graphics();

    this.ecosystemHealthText = this.add.text(0, 0, "0%", {
      fontFamily: "Arial",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#FFFFFF"
    });
    this.ecosystemHealthText.setOrigin(0.5);
    this.ecosystemHealthText.setStroke("#04130d", 6);
    this.ecosystemHealthText.setShadow(0, 2, "#7affcd", 10, true, true);

    this.redrawEcosystemHealthBar(0);
  }

  private createSlotZones(): void {
    const metasByOutput = new Map(biomaStoreApi.getState().metas.map((meta: MetaDeBioma) => [meta.output, meta]));
    const plaquePositions = [
      { x: 384, y: 705 },
      { x: 976, y: 765 },
      { x: 1549, y: 694 }
    ];
    this.slotLayoutBaseWidth = this.scale.width;
    this.slotLayoutBaseHeight = this.scale.height;

    this.currentLevel.waterSlots.forEach((slot: WaterSlotConfig, index: number) => {
      const output = this.currentLevel.targets[index]?.output ?? slot.id;
      const meta = metasByOutput.get(output);
      const plaquePosition = plaquePositions[index] ?? { x: slot.x, y: slot.y };
      const slotX = plaquePosition.x;
      const slotY = plaquePosition.y;

      const zone = this.add
        .zone(slotX, slotY, GameScene.SLOT_ZONE_WIDTH, GameScene.SLOT_ZONE_HEIGHT)
        .setRectangleDropZone(GameScene.SLOT_ZONE_WIDTH, GameScene.SLOT_ZONE_HEIGHT);
      zone.setData("slotId", slot.id);
      zone.setDepth(3);

      const plaque = this.add
        .image(slotX, slotY, GameScene.LEVEL_PLAQUE_KEY)
        .setDisplaySize(GameScene.SLOT_PLAQUE_WIDTH, GameScene.SLOT_PLAQUE_HEIGHT)
        .setDepth(1);

      const ring = this.add
        .ellipse(slotX, slotY, GameScene.SLOT_RING_WIDTH, GameScene.SLOT_RING_HEIGHT, 0xf6e5ad, 0.08)
        .setStrokeStyle(2, 0xf9efc8, 0.34)
        .setDepth(2)
        .setVisible(false);

      const progressText = this.add.text(slotX, slotY + 14, `${meta?.initial ?? 0}/${meta?.goal ?? 0}`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#fff7dc",
        stroke: "#3f2c16",
        strokeThickness: 3,
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: "#1f1308",
          blur: 4,
          stroke: true,
          fill: true
        }
      });
      progressText.setOrigin(0.5);

      const meterBackground = this.add
        .rectangle(slotX, slotY + 2, GameScene.SLOT_METER_WIDTH, GameScene.SLOT_METER_HEIGHT, 0x2a1d10, 0.64)
        .setOrigin(0.5)
        .setDepth(3);
      const meterFill = this.add
        .rectangle(slotX - 54, slotY + 2, 0, GameScene.SLOT_METER_FILL_HEIGHT, 0x4ec7ff, 1)
        .setOrigin(0, 0.5)
        .setDepth(4);

      const valueText = this.add.text(slotX, slotY - 16, `${meta?.initial ?? 0}`, {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#fff5d8",
        stroke: "#402811",
        strokeThickness: 3,
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: "rgba(26,16,8,0.42)",
          blur: 4,
          stroke: true,
          fill: true
        }
      });
      valueText.setOrigin(0.5);
      valueText.setDepth(4);
      progressText.setDepth(4);

      this.slotViews.set(slot.id, {
        slot: { ...slot, x: slotX, y: slotY },
        output,
        anchorX: this.slotLayoutBaseWidth > 0 ? slotX / this.slotLayoutBaseWidth : 0,
        anchorY: this.slotLayoutBaseHeight > 0 ? slotY / this.slotLayoutBaseHeight : 0,
        zone,
        plaque,
        ring,
        progressText,
        meterBackground,
        meterFill,
        valueText
      });
    });
  }

  private createRightPanel(): void {
    const background = this.add
      .image(66, 91, GameScene.ROBOT_PANEL_KEY)
      .setDisplaySize(396, 495);

    const title = this.add.text(16, -116, "Robôs", {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#fff3d4",
      stroke: "#332110",
      strokeThickness: 3
    });

    this.panelContainer = this.add.container(0, 0, [background, title]);
    this.panelContainer.setScrollFactor(0).setDepth(10);

    this.createRobotButton("adicao", 10, -46, "Adição", this.currentLevel.assets?.robo_adicao);
    this.createRobotButton("divisao", 72, -46, "Divisão", this.currentLevel.assets?.robo_divisao);
    this.createResetButton(125, 102);
  }

  private createRobotButton(
    operation: TipoDeOperacao,
    localX: number,
    localY: number,
    label: string,
    textureKey?: string
  ): void {
    const fallback = operation === "adicao" ? this.currentLevel.biome.restaurado : this.currentLevel.biome.corrompido;
    const sprite = this.add.image(localX, localY, textureKey ?? fallback).setScale(0.0528);
    sprite.setData("panelButton", true);
    sprite.setData("operation", operation);
    sprite.setData("homeX", localX);
    sprite.setData("homeY", localY);
    sprite.setInteractive({ useHandCursor: true, draggable: true });

    const caption = this.add.text(localX, localY + 44, label, {
      fontFamily: "Georgia",
      fontSize: "10px",
      color: "#f4dea0",
      stroke: "#332110",
      strokeThickness: 2,
      align: "center"
    });
    caption.setOrigin(0.5);

    this.panelContainer.add([sprite, caption]);
    this.input.setDraggable(sprite);

    this.robotButtons.set(operation, {
      operation,
      sprite,
      label: caption,
      homeX: localX,
      homeY: localY
    });
  }

  private createResetButton(localX: number, localY: number): void {
    const resetButton = this.add.image(localX, localY, GameScene.BACK_BUTTON_KEY).setScale(0.08);
    resetButton.setInteractive({ useHandCursor: true });
    resetButton.on("pointerdown", () => {
      this.handleReset();
    });
    this.panelContainer.add(resetButton);
  }

  private createFooterMessage(): void {
    this.resultText = this.add.text(0, 0, "", {
      fontFamily: "Georgia",
      fontSize: "13px",
      color: "#fff2d6",
      stroke: "#352212",
      strokeThickness: 2
    });
    this.resultText.setDepth(20);
  }

  private installInputEvents(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      console.log(`x = ${Math.round(pointer.x)}, y = ${Math.round(pointer.y)}`);
    });

    this.input.on(Phaser.Input.Events.GAMEOBJECT_OVER, (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
        return;
      }

      gameObject.setScale(0.0594);
      gameObject.setTint(0xffffff);
    });

    this.input.on(Phaser.Input.Events.GAMEOBJECT_OUT, (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
        return;
      }

      gameObject.setScale(0.0528);
      gameObject.clearTint();
    });

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
        return;
      }

      gameObject.setTint(0xffffff);
      gameObject.setScale(0.0638);
      this.resultText?.setText("Arrastando robô. Solte sobre uma nascente.");
    });

    this.input.on(
      Phaser.Input.Events.DRAG_START,
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
          return;
        }

        gameObject.setDepth(50);
      }
    );

    this.input.on(
      Phaser.Input.Events.DRAG,
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
        if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
          return;
        }

        gameObject.x = dragX;
        gameObject.y = dragY;
      }
    );

    this.input.on(
      Phaser.Input.Events.DROP,
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dropZone: Phaser.GameObjects.Zone) => {
        if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
          return;
        }

        const operation = gameObject.getData("operation") as TipoDeOperacao;
        const slotId = dropZone.getData("slotId") as string;

        void this.handleRobotDrop(operation, slotId);
      }
    );

    this.input.on(
      Phaser.Input.Events.DRAG_END,
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dropped: boolean) => {
        if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
          return;
        }

        const operation = gameObject.getData("operation") as TipoDeOperacao;
        const button = this.robotButtons.get(operation);

        if (!button) {
          return;
        }

        this.tweens.add({
          targets: gameObject,
          x: button.homeX,
          y: button.homeY,
          duration: dropped ? 120 : 180,
          ease: "Sine.Out",
          onComplete: () => {
            gameObject.setScale(0.0528);
            gameObject.clearTint();
            gameObject.setDepth(11);
          }
        });
      }
    );
  }

  private installStoreSync(): void {
    this.unsubscribeStore = biomaStoreApi.subscribe((state: BiomaState, previousState: BiomaState) => {
      if (state.estadoDoBioma !== previousState.estadoDoBioma) {
        this.syncFullscreenBackgroundState(state.estadoDoBioma);
      }

      if (state.metas !== previousState.metas) {
        this.renderMetaValues(state.metas);
      }

      if (
        state.estadoDoBioma !== previousState.estadoDoBioma &&
        state.estadoDoBioma === EstadoDoBioma.RESTAURADO
      ) {
        this.time.delayedCall(900, () => {
          this.scene.start("WorldMapScene");
        });
      }

      if (
        state.estadoDoBioma !== previousState.estadoDoBioma &&
        state.estadoDoBioma === EstadoDoBioma.CORROMPIDO
      ) {
        this.resetPlacedRobots();
        this.resultText?.setText("Fase reiniciada. Arraste um robô para uma nascente.");
        this.resultText?.setColor("#fff5cf");
      }
    });
  }

  private installResetShortcut(): void {
    this.input.keyboard?.on("keydown-R", () => {
      this.handleReset();
    });
  }

  private async handleRobotDrop(operation: TipoDeOperacao, slotId: string): Promise<void> {
    if (biomaStoreApi.getState().estadoDoBioma !== EstadoDoBioma.CORROMPIDO) {
      return;
    }

    const slotView = this.slotViews.get(slotId);

    if (!slotView) {
      return;
    }

    slotView.ring.setFillStyle(operation === "adicao" ? 0x34d399 : 0xfbbf24, 0.28);
    const textureKey =
      operation === "adicao" ? this.currentLevel.assets?.robo_adicao : this.currentLevel.assets?.robo_divisao;
    const impactX = slotView.slot.x;
    const impactY = slotView.slot.y;
    const playfieldScale = 1;
    const impact = this.add
      .image(impactX, impactY + 10 * playfieldScale, textureKey ?? this.currentLevel.biome.restaurado)
      .setScale(0.04)
      .setDepth(6)
      .setAlpha(0.92);

    this.tweens.add({
      targets: impact,
      y: impactY - 16 * playfieldScale,
      alpha: 0,
      scale: 0.03 * playfieldScale,
      duration: 220,
      ease: "Sine.Out",
      onComplete: () => {
        impact.destroy();
      }
    });

    this.tweens.add({
      targets: slotView.ring,
      scaleX: 1.08,
      scaleY: 1.08,
      yoyo: true,
      duration: 120,
      onComplete: () => {
        slotView.ring.setScale(1);
      }
    });

    const outputs = this.mapOutputs(biomaStoreApi.getState().metas);
    const currentValue = outputs[slotView.output] ?? 0;
    outputs[slotView.output] = this.applyOperation(currentValue, operation);
    biomaStoreApi.getState().atualizarProgresso(outputs);

    const validation = this.flowEngine.validarOutputs(this.currentLevel, outputs);

    if (validation.success) {
      this.resultText?.setText("Fluxo validado. Restaurando o bioma.");
      this.resultText?.setColor("#bbf7d0");
      biomaStoreApi.getState().iniciarRestauracao();

      this.time.delayedCall(1000, () => {
        biomaStoreApi.getState().concluirRestauracao(this.currentLevelId);
      });
      return;
    }

    this.resultText?.setText(`${slotView.output} recebeu ${operation === "adicao" ? "+10" : "/2"}.`);
    this.resultText?.setColor("#fff5cf");
  }

  private renderMetaValues(metas: MetaDeBioma[]): void {
    let desafiosConcluidos = 0;

    metas.forEach((meta) => {
      const progressoDoAlvo = this.calcularProgressoDoAlvo(meta);
      const alvoConcluido = meta.current === meta.goal;

      const score = this.scoreTexts.get(meta.output);
      if (score) {
        score.setText(`${meta.current}/${meta.goal}`);
        score.setColor(alvoConcluido ? "#bbf7d0" : "#f3df9a");
      }

      const slotView = [...this.slotViews.values()].find((slot) => slot.output === meta.output);

      if (!slotView) {
        return;
      }

      slotView.valueText.setText(String(meta.current));
      slotView.progressText.setText(`${meta.current}/${meta.goal}`);
      slotView.valueText.setColor(alvoConcluido ? "#bbf7d0" : "#fff5cf");
      slotView.meterFill.width = GameScene.SLOT_METER_FILL_WIDTH * progressoDoAlvo;
      slotView.meterFill.setFillStyle(alvoConcluido ? 0x86efac : 0x76ff03, 1);

      if (alvoConcluido) {
        desafiosConcluidos += 1;
      }
    });

    const healthPercent = metas.length > 0 ? Math.round((desafiosConcluidos / metas.length) * 100) : 0;
    this.redrawEcosystemHealthBar(healthPercent);
  }

  private mapOutputs(metas: MetaDeBioma[]): Record<string, number> {
    return metas.reduce<Record<string, number>>((acc, meta) => {
      acc[meta.output] = meta.current;
      return acc;
    }, {});
  }

  private applyOperation(value: number, operation: TipoDeOperacao): number {
    return operation === "adicao" ? value + 10 : Math.floor(value / 2);
  }

  private calcularProgressoDoAlvo(meta: MetaDeBioma): number {
    const distanciaInicial = Math.abs(meta.initial - meta.goal);

    if (distanciaInicial === 0) {
      return 1;
    }

    const distanciaAtual = Math.abs(meta.current - meta.goal);
    return Phaser.Math.Clamp(1 - distanciaAtual / distanciaInicial, 0, 1);
  }

  private handleReset(): void {
    biomaStoreApi.getState().resetarFluxo();
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.layoutScene(gameSize.width, gameSize.height);
  }

  private layoutScene(width: number, height: number): void {
    this.playfieldBounds = this.computePlayfieldBounds(width, height);
    this.layoutFullscreenBackground(width, height);

    this.topHudContainer.setPosition(GameScene.SIDE_PADDING, GameScene.TOP_PADDING);

    const panelX = width - GameScene.SIDE_PADDING - GameScene.PANEL_WIDTH;
    const panelY = Math.max(
      GameScene.PLAYFIELD_TOP_OFFSET + 4,
      this.playfieldBounds.centerY - GameScene.PANEL_HEIGHT / 2
    );
    this.panelContainer.setPosition(panelX, panelY);

    if (this.resultText) {
      this.resultText.setPosition(GameScene.SIDE_PADDING, GameScene.TOP_PADDING + 70);
    }

    this.layoutSlotZones();
    this.redrawEcosystemHealthBar(this.getCurrentEcosystemHealth());
  }

  private computePlayfieldBounds(width: number, height: number): Phaser.Geom.Rectangle {
    const availableWidth = Math.max(280, width - GameScene.PLAYFIELD_SIDE_MARGIN * 2);
    const availableHeight = Math.max(
      240,
      height - GameScene.PLAYFIELD_TOP_OFFSET - GameScene.BOTTOM_PADDING
    );
    const scale = Math.min(
      availableWidth / GameScene.BASE_WIDTH,
      availableHeight / GameScene.BASE_HEIGHT
    );
    const playfieldWidth = GameScene.BASE_WIDTH * scale;
    const playfieldHeight = GameScene.BASE_HEIGHT * scale;
    const x = (width - playfieldWidth) / 2;
    const y = GameScene.PLAYFIELD_TOP_OFFSET + (availableHeight - playfieldHeight) / 2;

    return new Phaser.Geom.Rectangle(
      x,
      y,
      playfieldWidth,
      playfieldHeight
    );
  }

  private layoutSlotZones(): void {
    this.slotViews.forEach((slotView) => {
      const slotX = this.scale.width * slotView.anchorX;
      const slotY = this.scale.height * slotView.anchorY;
      slotView.slot.x = slotX;
      slotView.slot.y = slotY;

      slotView.zone.setSize(GameScene.SLOT_ZONE_WIDTH, GameScene.SLOT_ZONE_HEIGHT);
      slotView.zone.setRectangleDropZone(
        GameScene.SLOT_ZONE_WIDTH,
        GameScene.SLOT_ZONE_HEIGHT
      );
      slotView.zone.setPosition(slotX, slotY);
      slotView.plaque.setPosition(slotX, slotY);
      slotView.plaque.setDisplaySize(GameScene.SLOT_PLAQUE_WIDTH, GameScene.SLOT_PLAQUE_HEIGHT);
      slotView.ring.setPosition(slotX, slotY);
      slotView.ring.setDisplaySize(GameScene.SLOT_RING_WIDTH, GameScene.SLOT_RING_HEIGHT);
      slotView.progressText.setPosition(slotX, slotY + 14);
      slotView.progressText.setFontSize(16);
      slotView.meterBackground.setPosition(slotX, slotY + 2);
      slotView.meterBackground.setDisplaySize(
        GameScene.SLOT_METER_WIDTH,
        GameScene.SLOT_METER_HEIGHT
      );
      slotView.meterFill.setPosition(slotX - 54, slotY + 2);
      slotView.meterFill.height = GameScene.SLOT_METER_FILL_HEIGHT;
      slotView.valueText.setPosition(slotX, slotY - 16);
      slotView.valueText.setFontSize(24);
    });
  }



  private getCurrentEcosystemHealth(): number {
    const metas = biomaStoreApi.getState().metas;
    if (metas.length === 0) {
      return 0;
    }

    const desafiosConcluidos = metas.filter((meta: MetaDeBioma) => meta.current === meta.goal).length;
    return Math.round((desafiosConcluidos / metas.length) * 100);
  }

  private resetPlacedRobots(): void {
    this.slotViews.forEach((slotView) => {
      slotView.ring.setFillStyle(0x7dd3fc, 0.17);
      slotView.ring.setScale(1);
    });
  }

  private resolveAssetUrl(path: string): string {
    return new URL(path, window.location.href).toString();
  }

  private redrawEcosystemHealthBar(ecosystemHealth: number): void {
    if (!this.ecosystemHealthBackground || !this.ecosystemHealthFill || !this.ecosystemHealthText) {
      return;
    }

    const progress = Phaser.Math.Clamp(ecosystemHealth / 100, 0, 1);
    const radius = GameScene.HEALTH_RING_RADIUS;
    const thickness = GameScene.HEALTH_RING_THICKNESS;
    const x = this.scale.width - GameScene.SIDE_PADDING - radius - 22;
    const y = GameScene.TOP_PADDING + radius + 14;
    const startAngle = Phaser.Math.DegToRad(-90);
    const endAngle = startAngle + Phaser.Math.PI2 * progress;

    this.ecosystemHealthBackground.clear();
    this.ecosystemHealthBackground.fillStyle(0x050b10, 0.88);
    this.ecosystemHealthBackground.fillCircle(x, y, radius + 16);
    this.ecosystemHealthBackground.fillStyle(0x0a1d20, 0.96);
    this.ecosystemHealthBackground.fillCircle(x, y, radius + 4);
    this.ecosystemHealthBackground.lineStyle(thickness + 8, 0x7affc8, 0.1);
    this.ecosystemHealthBackground.strokeCircle(x, y, radius);
    this.ecosystemHealthBackground.lineStyle(thickness + 2, 0x142730, 0.92);
    this.ecosystemHealthBackground.strokeCircle(x, y, radius);
    this.ecosystemHealthBackground.lineStyle(3, 0xd8ffff, 0.18);
    this.ecosystemHealthBackground.strokeCircle(x, y, radius + 10);
    this.ecosystemHealthBackground.fillStyle(0x123b37, 0.24);
    this.ecosystemHealthBackground.fillCircle(x, y, radius - 16);

    this.ecosystemHealthFill.clear();

    if (progress > 0) {
      this.ecosystemHealthFill.lineStyle(thickness + 12, 0x54ffd1, 0.14);
      this.ecosystemHealthFill.beginPath();
      this.ecosystemHealthFill.arc(x, y, radius, startAngle, endAngle, false);
      this.ecosystemHealthFill.strokePath();

      this.ecosystemHealthFill.lineStyle(thickness + 6, 0x42ffd1, 0.22);
      this.ecosystemHealthFill.beginPath();
      this.ecosystemHealthFill.arc(x, y, radius, startAngle, endAngle, false);
      this.ecosystemHealthFill.strokePath();

      this.ecosystemHealthFill.lineStyle(thickness, 0x47ffd0, 0.98);
      this.ecosystemHealthFill.beginPath();
      this.ecosystemHealthFill.arc(x, y, radius, startAngle, endAngle, false);
      this.ecosystemHealthFill.strokePath();

      const startPoint = new Phaser.Math.Vector2(x, y);
      const endPoint = new Phaser.Math.Vector2(x, y);
      Phaser.Math.RotateAroundDistance(startPoint, x, y, startAngle, radius);
      Phaser.Math.RotateAroundDistance(endPoint, x, y, endAngle, radius);

      this.ecosystemHealthFill.fillStyle(0x9effe7, 0.9);
      this.ecosystemHealthFill.fillCircle(startPoint.x, startPoint.y, thickness * 0.35);
      this.ecosystemHealthFill.fillCircle(endPoint.x, endPoint.y, thickness * 0.5);
    }

    this.ecosystemHealthText.setPosition(x, y);
    this.ecosystemHealthText.setText(`${ecosystemHealth}%`);
    this.ecosystemHealthBackground.setDepth(20);
    this.ecosystemHealthFill.setDepth(20);
    this.ecosystemHealthText.setDepth(20);
  }

  private layoutFullscreenBackground(width: number, height: number): void {
    this.layoutFullscreenImage(this.fullscreenBiomeLayer, width, height);
    this.layoutFullscreenImage(this.fullscreenCorruptionLayer, width, height);
  }

  private layoutFullscreenImage(
    image: Phaser.GameObjects.Image | undefined,
    width: number,
    height: number
  ): void {
    if (!image) {
      return;
    }

    const source = image.texture.getSourceImage() as { width?: number; height?: number };
    const sourceWidth = source.width ?? GameScene.BASE_WIDTH;
    const sourceHeight = source.height ?? GameScene.BASE_HEIGHT;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);

    image.setPosition(width / 2, height / 2);
    image.setDisplaySize(sourceWidth * scale, sourceHeight * scale);
  }

  private syncFullscreenBackgroundState(estado: EstadoDoBioma, immediate = false): void {
    if (!this.fullscreenBiomeLayer || !this.fullscreenCorruptionLayer) {
      return;
    }

    if (immediate) {
      this.fullscreenBiomeLayer.setAlpha(estado === EstadoDoBioma.CORROMPIDO ? 0 : 1);
      this.fullscreenCorruptionLayer.setAlpha(estado === EstadoDoBioma.RESTAURADO ? 0 : 1);
      return;
    }

    if (estado === EstadoDoBioma.CORROMPIDO) {
      this.tweens.killTweensOf([this.fullscreenBiomeLayer, this.fullscreenCorruptionLayer]);
      this.fullscreenBiomeLayer.setAlpha(0);
      this.fullscreenCorruptionLayer.setAlpha(1);
      return;
    }

    if (estado === EstadoDoBioma.RESTAURANDO) {
      this.tweens.killTweensOf([this.fullscreenBiomeLayer, this.fullscreenCorruptionLayer]);
      this.tweens.add({
        targets: this.fullscreenBiomeLayer,
        alpha: 1,
        duration: 900,
        ease: "Sine.Out"
      });
      this.tweens.add({
        targets: this.fullscreenCorruptionLayer,
        alpha: 0,
        duration: 900,
        ease: "Sine.Out"
      });
      return;
    }

    this.tweens.killTweensOf([this.fullscreenBiomeLayer, this.fullscreenCorruptionLayer]);
    this.fullscreenBiomeLayer.setAlpha(1);
    this.fullscreenCorruptionLayer.setAlpha(0);
  }
}
