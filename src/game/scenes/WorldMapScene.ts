import Phaser from "phaser";
import { biomaStoreApi } from "../../state/biomaStore";

type WorldBiomeNode = {
  id: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  color: number;
  levelId?: string;
  aliveTextureKey?: string;
  deadTextureKey?: string;
};

const DESIGN_WIDTH = 1024;
const DESIGN_HEIGHT = 640;
const BACKGROUND_KEY = "world-map-background";
const BACKGROUND_PATH = "assets/images/Fundo/Camada1_Mundo.png";
const CASCATA_WORLD_KEY = "world-node-cascata";
const CASCATA_WORLD_PATH = "assets/images/Mundos/Cascata.png";
const CASCATA_WORLD_DEAD_KEY = "world-node-cascata-dead";
const CASCATA_WORLD_DEAD_PATH = "assets/images/Mundos/CascataMorta.png";
const BOSQUE_WORLD_KEY = "world-node-bosque";
const BOSQUE_WORLD_PATH = "assets/images/Mundos/Bosque.png";
const BOSQUE_WORLD_DEAD_KEY = "world-node-bosque-dead";
const BOSQUE_WORLD_DEAD_PATH = "assets/images/Mundos/BosqueMorto.png";
const DESERTO_WORLD_KEY = "world-node-deserto";
const DESERTO_WORLD_PATH = "assets/images/Mundos/Deserto.png";
const DESERTO_WORLD_DEAD_KEY = "world-node-deserto-dead";
const DESERTO_WORLD_DEAD_PATH = "assets/images/Mundos/DesertoMorto.png";
const CAVERNA_WORLD_KEY = "world-node-caverna";
const CAVERNA_WORLD_PATH = "assets/images/Mundos/Caverna.png";
const CAVERNA_WORLD_DEAD_KEY = "world-node-caverna-dead";
const CAVERNA_WORLD_DEAD_PATH = "assets/images/Mundos/CavernaMorta.png";
const VULCAO_WORLD_KEY = "world-node-vulcao";
const VULCAO_WORLD_PATH = "assets/images/Mundos/Vulcao.png";
const VULCAO_WORLD_DEAD_KEY = "world-node-vulcao-dead";
const VULCAO_WORLD_DEAD_PATH = "assets/images/Mundos/VulcaoMorto.png";
const UI_DEPTH = 1000;
const HEALTH_RING_RADIUS = 52;
const HEALTH_RING_THICKNESS = 14;
const MIN_ZOOM_MARGIN = 1.06;
const MAX_ZOOM = 1.8;

const WORLD_BIOMES: WorldBiomeNode[] = [
  {
    id: "level-01",
    title: "Cascata de Dados",
    subtitle: "Fluxos e nascentes",
    x: 176,
    y: 350,
    color: 0x4ec7ff,
    levelId: "level-01",
    aliveTextureKey: CASCATA_WORLD_KEY,
    deadTextureKey: CASCATA_WORLD_DEAD_KEY
  },
  {
    id: "level-02",
    title: "Cavernas de Cristal",
    subtitle: "Reflexos e proporcoes",
    x: 352,
    y: 252,
    color: 0xc084fc,
    aliveTextureKey: CAVERNA_WORLD_KEY,
    deadTextureKey: CAVERNA_WORLD_DEAD_KEY
  },
  {
    id: "level-03",
    title: "Planície dos Ventos",
    subtitle: "Padroes e direcoes",
    x: 546,
    y: 332,
    color: 0xffd166,
    aliveTextureKey: DESERTO_WORLD_KEY,
    deadTextureKey: DESERTO_WORLD_DEAD_KEY
  },
  {
    id: "level-04",
    title: "Bosque Binário",
    subtitle: "Sequencias de crescimento",
    x: 726,
    y: 224,
    color: 0x76ff03,
    aliveTextureKey: BOSQUE_WORLD_KEY,
    deadTextureKey: BOSQUE_WORLD_DEAD_KEY
  },
  {
    id: "level-05",
    title: "Núcleo do Mundo",
    subtitle: "Sintese final",
    x: 884,
    y: 338,
    color: 0xff7b72,
    aliveTextureKey: VULCAO_WORLD_KEY,
    deadTextureKey: VULCAO_WORLD_DEAD_KEY
  }
];

export class WorldMapScene extends Phaser.Scene {
  private worldCamera!: Phaser.Cameras.Scene2D.Camera;
  private uiCamera?: Phaser.Cameras.Scene2D.Camera;
  private worldWidth = DESIGN_WIDTH;
  private worldHeight = DESIGN_HEIGHT;
  private scaleX = 1;
  private scaleY = 1;
  private minZoom = 1;
  private initialZoom = 1;
  private worldObjects: Phaser.GameObjects.GameObject[] = [];
  private uiObjects: Phaser.GameObjects.GameObject[] = [];
  private healthFill?: Phaser.GameObjects.Graphics;
  private healthText?: Phaser.GameObjects.Text;
  private healthBackground?: Phaser.GameObjects.Graphics;
  private titleContainer?: Phaser.GameObjects.Container;
  private legendPanel?: Phaser.GameObjects.Rectangle;
  private legendTitle?: Phaser.GameObjects.Text;
  private legendItems: Array<{
    dot: Phaser.GameObjects.Arc;
    label: Phaser.GameObjects.Text;
    offsetX: number;
  }> = [];
  private isDraggingMap = false;
  private dragStartPointer = new Phaser.Math.Vector2();
  private dragStartScroll = new Phaser.Math.Vector2();
  private suppressNodeClick = false;
  private isFocusingNode = false;
  private isIntroOverlayActive = false;

  public constructor() {
    super("WorldMapScene");
  }

  public preload(): void {
    if (!this.textures.exists(BACKGROUND_KEY)) {
      this.load.image(BACKGROUND_KEY, BACKGROUND_PATH);
    }

    if (!this.textures.exists(CASCATA_WORLD_KEY)) {
      this.load.image(CASCATA_WORLD_KEY, CASCATA_WORLD_PATH);
    }

    if (!this.textures.exists(CASCATA_WORLD_DEAD_KEY)) {
      this.load.image(CASCATA_WORLD_DEAD_KEY, CASCATA_WORLD_DEAD_PATH);
    }

    if (!this.textures.exists(BOSQUE_WORLD_KEY)) {
      this.load.image(BOSQUE_WORLD_KEY, BOSQUE_WORLD_PATH);
    }

    if (!this.textures.exists(BOSQUE_WORLD_DEAD_KEY)) {
      this.load.image(BOSQUE_WORLD_DEAD_KEY, BOSQUE_WORLD_DEAD_PATH);
    }

    if (!this.textures.exists(DESERTO_WORLD_KEY)) {
      this.load.image(DESERTO_WORLD_KEY, DESERTO_WORLD_PATH);
    }

    if (!this.textures.exists(DESERTO_WORLD_DEAD_KEY)) {
      this.load.image(DESERTO_WORLD_DEAD_KEY, DESERTO_WORLD_DEAD_PATH);
    }

    if (!this.textures.exists(CAVERNA_WORLD_KEY)) {
      this.load.image(CAVERNA_WORLD_KEY, CAVERNA_WORLD_PATH);
    }

    if (!this.textures.exists(CAVERNA_WORLD_DEAD_KEY)) {
      this.load.image(CAVERNA_WORLD_DEAD_KEY, CAVERNA_WORLD_DEAD_PATH);
    }

    if (!this.textures.exists(VULCAO_WORLD_KEY)) {
      this.load.image(VULCAO_WORLD_KEY, VULCAO_WORLD_PATH);
    }

    if (!this.textures.exists(VULCAO_WORLD_DEAD_KEY)) {
      this.load.image(VULCAO_WORLD_DEAD_KEY, VULCAO_WORLD_DEAD_PATH);
    }
  }

  public create(): void {
    this.setupWorldMetrics();
    this.setupCameras();

    this.createBackgroundLayer();
    this.createWorldPath();
    this.createWorldNodes();

    this.createTopHud();
    this.createGlobalHealthBar();
    this.createWorldLegend();
    this.bindCameraLayers();

    this.layoutUi();
    this.centerMap();
    this.setupCameraControls();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
  }

  private setupWorldMetrics(): void {
    const texture = this.textures.get(BACKGROUND_KEY);
    const source = texture.getSourceImage() as { width: number; height: number };
    const coverScale = Math.max(this.scale.width / source.width, this.scale.height / source.height, 1);

    this.worldWidth = source.width * coverScale;
    this.worldHeight = source.height * coverScale;
    this.scaleX = this.worldWidth / DESIGN_WIDTH;
    this.scaleY = this.worldHeight / DESIGN_HEIGHT;
  }

  private setupCameras(): void {
    this.worldCamera = this.cameras.main;
    this.worldCamera.setBackgroundColor("#0f1f16");
    this.worldCamera.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCamera.setName("ui");
    this.uiCamera.setRoundPixels(false);
    this.uiCamera.setBackgroundColor("rgba(0,0,0,0)");
  }

  private createBackgroundLayer(): void {
    const background = this.add.image(0, 0, BACKGROUND_KEY).setOrigin(0, 0);
    background.setDisplaySize(this.worldWidth, this.worldHeight);
    this.worldObjects.push(background);
  }

  private createTopHud(): void {
    const tituloAlfa = this.add.text(0, 0, "Alfa", {
      font: "bold 52px Arial",
      color: "#4CAF50"
    });
    tituloAlfa.setStroke("#FFFFFF", 10);
    tituloAlfa.setShadow(3, 3, "#333333", 3, true, true);

    const tituloMath = this.add.text(tituloAlfa.width - 6, 0, "Math:", {
      font: "bold 52px Arial",
      color: "#f59e0b"
    });
    tituloMath.setStroke("#FFFFFF", 10);
    tituloMath.setShadow(3, 3, "#333333", 3, true, true);

    const subtitulo = this.add.text(8, 48, "O Despertar do Mundo", {
      font: "bold 24px Arial",
      color: "#F2F2F2"
    });
    subtitulo.setStroke("#000000", 4);
    subtitulo.setShadow(2, 2, "#000000", 1, false, false);

    this.titleContainer = this.add.container(40, 40, [tituloAlfa, tituloMath, subtitulo]);
    this.titleContainer.setDepth(UI_DEPTH);
    this.uiObjects.push(this.titleContainer);
  }

  private createGlobalHealthBar(): void {
    this.healthBackground = this.add.graphics().setDepth(UI_DEPTH);
    this.healthFill = this.add.graphics().setDepth(UI_DEPTH);
    this.healthText = this.add.text(0, 0, "0%", {
      fontFamily: "Arial",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#FFFFFF"
    });
    this.healthText.setOrigin(0.5);
    this.healthText.setStroke("#04130d", 6);
    this.healthText.setShadow(0, 2, "#7affcd", 10, true, true);
    this.healthText.setDepth(UI_DEPTH);

    this.uiObjects.push(this.healthBackground, this.healthFill, this.healthText);

    const state = biomaStoreApi.getState();
    const valorFinal = state.saudeGlobalDoEcossistema;
    const ganhoPendente = state.ganhoGlobalPendente;
    const valorInicial = Math.max(valorFinal - ganhoPendente, 0);
    const proxy = { value: ganhoPendente > 0 ? valorInicial : valorFinal };

    this.redrawGlobalHealth(proxy.value);

    if (ganhoPendente > 0) {
      this.tweens.add({
        targets: proxy,
        value: valorFinal,
        duration: 900,
        ease: "Sine.Out",
        onUpdate: () => {
          this.redrawGlobalHealth(Math.round(proxy.value));
        },
        onComplete: () => {
          biomaStoreApi.getState().consumirGanhoGlobalPendente();
        }
      });
    }
  }

  private createWorldPath(): void {
    const path = this.add.graphics();
    path.lineStyle(4 * this.getAverageScale(), 0x1a3427, 0.34);
    path.beginPath();
    
    const firstBiome = WORLD_BIOMES[0];
    if (!firstBiome) return;
    
    path.moveTo(this.scaleWorldX(firstBiome.x), this.scaleWorldY(firstBiome.y));

    WORLD_BIOMES.slice(1).forEach((node) => {
      path.lineTo(this.scaleWorldX(node.x), this.scaleWorldY(node.y));
    });

    path.strokePath();

    const highlight = this.add.graphics();
    highlight.lineStyle(1.5 * this.getAverageScale(), 0xe8f7d9, 0.12);
    highlight.beginPath();
    highlight.moveTo(this.scaleWorldX(firstBiome.x), this.scaleWorldY(firstBiome.y));

    WORLD_BIOMES.slice(1).forEach((node) => {
      highlight.lineTo(this.scaleWorldX(node.x), this.scaleWorldY(node.y));
    });

    highlight.strokePath();
    this.worldObjects.push(path, highlight);
  }

  private createWorldNodes(): void {
    const completed = new Set(biomaStoreApi.getState().biomasConcluidos);
    const nextAvailableIndex = Math.min(completed.size, WORLD_BIOMES.length - 1);
    const nodeRadius = 40 * this.getAverageScale();
    const innerRadius = 24 * this.getAverageScale();

    WORLD_BIOMES.forEach((node, index) => {
      const isCompleted = completed.has(node.id);
      const isAvailable = isCompleted || index === nextAvailableIndex;
      const isLocked = !isAvailable;
      const nodeX = this.scaleWorldX(node.x);
      const nodeY = this.scaleWorldY(node.y);
      const useWorldArt = Boolean(node.aliveTextureKey || node.deadTextureKey);
      const worldTextureKey = isCompleted
        ? node.aliveTextureKey ?? CASCATA_WORLD_KEY
        : node.deadTextureKey ?? node.aliveTextureKey ?? CASCATA_WORLD_KEY;

      const outer = useWorldArt
        ? this.add
            .image(nodeX, nodeY, worldTextureKey)
            .setDisplaySize(132 * this.getAverageScale(), 132 * this.getAverageScale())
            .setAlpha(isLocked ? 0.5 : 1)
        : this.add.circle(nodeX, nodeY, nodeRadius, isLocked ? 0x233127 : node.color, isLocked ? 0.5 : 0.9);

      if (outer instanceof Phaser.GameObjects.Arc) {
        outer.setStrokeStyle(4 * this.getAverageScale(), isCompleted ? 0xf6f7d7 : 0xffffff, isLocked ? 0.18 : 0.45);
      }

      const inner = useWorldArt
        ? this.add.circle(nodeX, nodeY + 6 * this.scaleY, innerRadius, 0x8cf8ff, isLocked ? 0.08 : 0.16)
        : this.add.circle(nodeX, nodeY, innerRadius, isLocked ? 0x101a13 : 0xf9f2d0, isLocked ? 0.72 : 0.95);

      const marker = this.add.text(nodeX, nodeY, isCompleted ? "\u2713" : isLocked ? "?" : `${index + 1}`, {
        fontFamily: "Arial",
        fontSize: `${Math.round(28 * this.getAverageScale())}px`,
        color: isCompleted ? "#1f7a1f" : isLocked ? "#73806f" : "#17341f"
      });
      marker.setOrigin(0.5);
      marker.setVisible(!useWorldArt);

      const title = this.add.text(nodeX, nodeY + 54 * this.scaleY, node.title, {
        fontFamily: "Arial",
        fontSize: `${Math.round(18 * this.getAverageScale())}px`,
        color: isLocked ? "#7f8c7e" : "#f3f4d8",
        align: "center",
        wordWrap: { width: 180 * this.scaleX }
      });
      title.setOrigin(0.5, 0);
      title.setStroke("#102016", Math.max(2, Math.round(4 * this.getAverageScale())));

      const subtitle = this.add.text(nodeX, nodeY + 82 * this.scaleY, node.subtitle, {
        fontFamily: "Arial",
        fontSize: `${Math.round(12 * this.getAverageScale())}px`,
        color: isLocked ? "#687367" : "#cde0cb",
        align: "center"
      });
      subtitle.setOrigin(0.5, 0);

      this.worldObjects.push(outer, inner, marker, title, subtitle);

      if (!isLocked && node.levelId) {
        const initialOuterScaleX = outer.scaleX;
        const initialOuterScaleY = outer.scaleY;
        const initialInnerScaleX = inner.scaleX;
        const initialInnerScaleY = inner.scaleY;

        outer.setInteractive({ useHandCursor: true });
        outer.on("pointerover", () => {
          this.tweens.killTweensOf([outer, inner]);
          if (outer instanceof Phaser.GameObjects.Image) {
            outer.setTint(0xf2fff8);
          } else {
            outer.setAlpha(1);
          }
          this.tweens.add({
            targets: outer,
            scaleX: initialOuterScaleX * (useWorldArt ? 1.48 : 1.04),
            scaleY: initialOuterScaleY * (useWorldArt ? 1.48 : 1.04),
            duration: 180,
            ease: "Sine.Out"
          });
          this.tweens.add({
            targets: inner,
            alpha: useWorldArt ? 0.28 : 1,
            scaleX: initialInnerScaleX * (useWorldArt ? 1.88 : 1.03),
            scaleY: initialInnerScaleY * (useWorldArt ? 1.88 : 1.03),
            duration: 180,
            ease: "Sine.Out"
          });
        });
        outer.on("pointerout", () => {
          this.tweens.killTweensOf([outer, inner]);
          if (outer instanceof Phaser.GameObjects.Image) {
            outer.clearTint();
          } else {
            outer.setAlpha(isLocked ? 0.5 : 0.9);
          }
          outer.setScale(initialOuterScaleX, initialOuterScaleY);
          inner.setScale(initialInnerScaleX, initialInnerScaleY);
          inner.setAlpha(useWorldArt ? (isLocked ? 0.08 : 0.16) : 1);
        });
        outer.on("pointerup", () => {
          if (this.isIntroOverlayActive || this.suppressNodeClick || this.isFocusingNode) {
            return;
          }

          this.focusNodeAndStartLevel(node.levelId!, nodeX, nodeY, outer, inner, title, subtitle);
        });
      }
    });
  }

  private createWorldLegend(): void {
    this.legendPanel = this.add.rectangle(0, 0, 286, 102, 0x17341f, 0.86).setOrigin(0, 0);
    this.legendPanel.setStrokeStyle(2, 0xe7f0d5, 0.16);
    this.legendPanel.setDepth(UI_DEPTH);

    this.legendTitle = this.add.text(0, 0, "Progresso dos Biomas", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#f4f7de"
    });
    this.legendTitle.setDepth(UI_DEPTH);

    this.uiObjects.push(this.legendPanel, this.legendTitle);

    [
      { offsetX: 0, color: 0x76ff03, label: "Disponivel" },
      { offsetX: 80, color: 0xf6f7d7, label: "Concluido" },
      { offsetX: 162, color: 0x233127, label: "Bloqueado" }
    ].forEach((item) => {
      const dot = this.add.circle(0, 0, 10, item.color, 0.95);
      dot.setStrokeStyle(2, 0xffffff, 0.3);
      dot.setDepth(UI_DEPTH);

      const label = this.add.text(0, 0, item.label, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#dce9d8"
      });
      label.setDepth(UI_DEPTH);

      this.legendItems.push({ dot, label, offsetX: item.offsetX });
      this.uiObjects.push(dot, label);
    });
  }

  private bindCameraLayers(): void {
    if (!this.uiCamera) {
      return;
    }

    this.worldCamera.ignore(this.uiObjects);
    this.uiCamera.ignore(this.worldObjects);
  }

  private layoutUi(): void {
    this.updateZoomLimits();
    this.worldCamera.setSize(this.scale.width, this.scale.height);
    this.worldCamera.setZoom(
      Phaser.Math.Clamp(this.worldCamera.zoom || this.initialZoom, this.minZoom, MAX_ZOOM)
    );

    if (this.uiCamera) {
      this.uiCamera.setViewport(0, 0, this.scale.width, this.scale.height);
      this.uiCamera.setSize(this.scale.width, this.scale.height);
    }

    this.titleContainer?.setPosition(40, 40);
    this.redrawGlobalHealth(biomaStoreApi.getState().saudeGlobalDoEcossistema);

    const panelX = 52;
    const panelY = this.scale.height - 148;
    this.legendPanel?.setPosition(panelX, panelY);
    this.legendTitle?.setPosition(panelX + 20, panelY + 22);

    this.legendItems.forEach((item) => {
      item.dot.setPosition(panelX + 28 + item.offsetX, panelY + 64);
      item.label.setPosition(panelX + 46 + item.offsetX, panelY + 56);
    });
  }

  private redrawGlobalHealth(ecosystemHealth: number): void {
    if (!this.healthBackground || !this.healthFill || !this.healthText) {
      return;
    }

    const progress = Phaser.Math.Clamp(ecosystemHealth / 100, 0, 1);
    const x = this.scale.width - HEALTH_RING_RADIUS - 62;
    const y = HEALTH_RING_RADIUS + 54;
    const startAngle = Phaser.Math.DegToRad(-90);
    const endAngle = startAngle + Phaser.Math.PI2 * progress;

    this.healthBackground.clear();
    this.healthBackground.fillStyle(0x050b10, 0.88);
    this.healthBackground.fillCircle(x, y, HEALTH_RING_RADIUS + 16);
    this.healthBackground.fillStyle(0x0a1d20, 0.96);
    this.healthBackground.fillCircle(x, y, HEALTH_RING_RADIUS + 4);
    this.healthBackground.lineStyle(HEALTH_RING_THICKNESS + 8, 0x7affc8, 0.1);
    this.healthBackground.strokeCircle(x, y, HEALTH_RING_RADIUS);
    this.healthBackground.lineStyle(HEALTH_RING_THICKNESS + 2, 0x142730, 0.92);
    this.healthBackground.strokeCircle(x, y, HEALTH_RING_RADIUS);
    this.healthBackground.lineStyle(3, 0xd8ffff, 0.18);
    this.healthBackground.strokeCircle(x, y, HEALTH_RING_RADIUS + 10);
    this.healthBackground.fillStyle(0x123b37, 0.24);
    this.healthBackground.fillCircle(x, y, HEALTH_RING_RADIUS - 16);

    this.healthFill.clear();

    if (progress > 0) {
      this.healthFill.lineStyle(HEALTH_RING_THICKNESS + 12, 0x54ffd1, 0.14);
      this.healthFill.beginPath();
      this.healthFill.arc(x, y, HEALTH_RING_RADIUS, startAngle, endAngle, false);
      this.healthFill.strokePath();

      this.healthFill.lineStyle(HEALTH_RING_THICKNESS + 6, 0x42ffd1, 0.22);
      this.healthFill.beginPath();
      this.healthFill.arc(x, y, HEALTH_RING_RADIUS, startAngle, endAngle, false);
      this.healthFill.strokePath();

      this.healthFill.lineStyle(HEALTH_RING_THICKNESS, 0x47ffd0, 0.98);
      this.healthFill.beginPath();
      this.healthFill.arc(x, y, HEALTH_RING_RADIUS, startAngle, endAngle, false);
      this.healthFill.strokePath();

      const startPoint = new Phaser.Math.Vector2(x, y);
      const endPoint = new Phaser.Math.Vector2(x, y);
      Phaser.Math.RotateAroundDistance(startPoint, x, y, startAngle, HEALTH_RING_RADIUS);
      Phaser.Math.RotateAroundDistance(endPoint, x, y, endAngle, HEALTH_RING_RADIUS);

      this.healthFill.fillStyle(0x9effe7, 0.9);
      this.healthFill.fillCircle(startPoint.x, startPoint.y, HEALTH_RING_THICKNESS * 0.35);
      this.healthFill.fillCircle(endPoint.x, endPoint.y, HEALTH_RING_THICKNESS * 0.5);
    }

    this.healthText.setPosition(x, y);
    this.healthText.setText(`${ecosystemHealth}%`);
  }

  private centerMap(): void {
    this.worldCamera.setZoom(this.initialZoom);
    this.worldCamera.centerOn(this.worldWidth / 2, this.worldHeight / 2);
    this.clampCameraToBounds();
  }

  private setupCameraControls(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isIntroOverlayActive) {
        return;
      }

      this.dragStartPointer.set(pointer.x, pointer.y);
      this.dragStartScroll.set(this.worldCamera.scrollX, this.worldCamera.scrollY);
      this.isDraggingMap = false;
      this.suppressNodeClick = false;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isIntroOverlayActive) {
        return;
      }

      if (!pointer.isDown) {
        return;
      }

      const dx = pointer.x - this.dragStartPointer.x;
      const dy = pointer.y - this.dragStartPointer.y;

      if (!this.isDraggingMap && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        this.isDraggingMap = true;
        this.suppressNodeClick = true;
      }

      if (!this.isDraggingMap) {
        return;
      }

      this.worldCamera.scrollX = this.dragStartScroll.x - dx / this.worldCamera.zoom;
      this.worldCamera.scrollY = this.dragStartScroll.y - dy / this.worldCamera.zoom;
      this.clampCameraToBounds();
    });

    this.input.on("pointerup", () => {
      if (this.isIntroOverlayActive) {
        return;
      }

      this.time.delayedCall(120, () => {
        this.suppressNodeClick = false;
      });
      this.isDraggingMap = false;
    });

    this.input.on(
      "wheel",
      (
        pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number
      ) => {
        if (this.isIntroOverlayActive) {
          return;
        }

        const previousZoom = this.worldCamera.zoom;
        const nextZoom = Phaser.Math.Clamp(previousZoom - deltaY * 0.001, this.minZoom, MAX_ZOOM);

        if (nextZoom === previousZoom) {
          return;
        }

        const worldPointBeforeZoom = this.worldCamera.getWorldPoint(pointer.x, pointer.y);
        this.worldCamera.setZoom(nextZoom);
        const worldPointAfterZoom = this.worldCamera.getWorldPoint(pointer.x, pointer.y);
        this.worldCamera.scrollX += worldPointBeforeZoom.x - worldPointAfterZoom.x;
        this.worldCamera.scrollY += worldPointBeforeZoom.y - worldPointAfterZoom.y;
        this.clampCameraToBounds();
      }
    );
  }

  private clampCameraToBounds(): void {
    const maxScrollX = this.worldWidth - this.scale.width / this.worldCamera.zoom;
    const maxScrollY = this.worldHeight - this.scale.height / this.worldCamera.zoom;

    this.worldCamera.scrollX = Phaser.Math.Clamp(this.worldCamera.scrollX, 0, Math.max(0, maxScrollX));
    this.worldCamera.scrollY = Phaser.Math.Clamp(this.worldCamera.scrollY, 0, Math.max(0, maxScrollY));
  }

  private focusNodeAndStartLevel(
    levelId: string,
    x: number,
    y: number,
    outer: Phaser.GameObjects.Arc | Phaser.GameObjects.Image,
    inner: Phaser.GameObjects.Arc | Phaser.GameObjects.Image,
    title: Phaser.GameObjects.Text,
    subtitle: Phaser.GameObjects.Text
  ): void {
    this.isFocusingNode = true;

    outer.disableInteractive();
    outer.setScale(1.12);
    inner.setScale(1.08);

    this.tweens.add({
      targets: [title, subtitle],
      alpha: 1,
      duration: 180
    });

    const targetZoom = Phaser.Math.Clamp(this.worldCamera.zoom + 0.18, this.minZoom, MAX_ZOOM);
    const targetScrollX = Phaser.Math.Clamp(
      x - this.scale.width / (2 * targetZoom),
      0,
      Math.max(0, this.worldWidth - this.scale.width / targetZoom)
    );
    const targetScrollY = Phaser.Math.Clamp(
      y - this.scale.height / (2 * targetZoom),
      0,
      Math.max(0, this.worldHeight - this.scale.height / targetZoom)
    );

    this.tweens.add({
      targets: this.worldCamera,
      scrollX: targetScrollX,
      scrollY: targetScrollY,
      zoom: targetZoom,
      duration: 650,
      ease: "Sine.InOut"
    });

    this.tweens.add({
      targets: [outer, inner],
      scale: { from: outer.scaleX, to: 1.18 },
      duration: 300,
      yoyo: true,
      ease: "Sine.Out"
    });

    this.time.delayedCall(720, () => {
      this.worldCamera.fadeOut(220, 8, 18, 12);
      this.uiCamera?.fadeOut(220, 8, 18, 12);
    });

    this.worldCamera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.isFocusingNode = false;
      if (levelId === "level-01") {
        this.scene.start("CascataScene", { subLevel: 1 });
        return;
      }

      this.scene.start("GameScene", { levelId });
    });
  }

  public showIntroOverlay(): void {
    this.isIntroOverlayActive = true;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.9);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    overlay.setDepth(1000);

    const introText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "Algo deu errado...\n\nUm erro digital chamado Buggie se espalhou e corrompeu o mundo.\nOs padrÃµes desapareceram, a lÃ³gica se perdeu... e tudo saiu do controle.\n\nAgora, sÃ³ vocÃª pode restaurar o equilÃ­brio.\nCom a ajuda dos robÃ´s-guia, resolva desafios, corrija erros e reconstrua o que foi destruÃ­do.\n\nCada decisÃ£o importa. Cada tentativa te aproxima da soluÃ§Ã£o.\n\nVocÃª estÃ¡ pronto para comeÃ§ar?",
      {
        fontSize: "24px",
        color: "#ffffff",
        align: "center"
      }
    );
    introText.setOrigin(0.5);
    introText.setDepth(1001);

    this.time.delayedCall(50, () => {
      this.input.once("pointerdown", () => {
        overlay.destroy();
        introText.destroy();
        this.isIntroOverlayActive = false;
      });
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const centerX = this.worldCamera.midPoint.x;
    const centerY = this.worldCamera.midPoint.y;

    if (this.uiCamera) {
      this.uiCamera.setViewport(0, 0, gameSize.width, gameSize.height);
      this.uiCamera.setSize(gameSize.width, gameSize.height);
    }

    this.worldCamera.setSize(gameSize.width, gameSize.height);
    this.layoutUi();
    this.worldCamera.centerOn(centerX, centerY);
    this.clampCameraToBounds();
  }

  private scaleWorldX(value: number): number {
    return value * this.scaleX;
  }

  private scaleWorldY(value: number): number {
    return value * this.scaleY;
  }

  private getAverageScale(): number {
    return (this.scaleX + this.scaleY) / 2;
  }

  private updateZoomLimits(): void {
    const coverZoom = Math.max(this.scale.width / this.worldWidth, this.scale.height / this.worldHeight);
    this.minZoom = Phaser.Math.Clamp(coverZoom * MIN_ZOOM_MARGIN, 0.2, 1);
    this.initialZoom = Phaser.Math.Clamp(this.minZoom + (1 - this.minZoom) * 0.2, this.minZoom, 1);
  }
}
