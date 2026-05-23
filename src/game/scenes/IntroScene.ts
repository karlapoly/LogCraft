import Phaser from "phaser";

type IntroMoment = {
  text: string;
  duration: number;
  tint: number;
  overlayAlpha: number;
  glowAlpha: number;
  corruptionAlpha: number;
  targetX: number;
  targetY: number;
  zoom: number;
  shake?: boolean;
  highlightCascata?: boolean;
};

const DESIGN_WIDTH = 1024;
const DESIGN_HEIGHT = 640;
const INTRO_DEPTH = 2000;
const BACKGROUND_OVERSCAN = 1.18;
const BACKGROUND_KEY = "world-map-background";
const BACKGROUND_PATH = "assets/images/Fundo/Camada1_Mundo.png";
const CASCATA_WORLD_KEY = "world-node-cascata";
const CASCATA_WORLD_PATH = "assets/images/Mundos/Cascata.png";
const CASCATA_WORLD_DEAD_KEY = "world-node-cascata-dead";
const CASCATA_WORLD_DEAD_PATH = "assets/images/Mundos/CascataMorta.png";
const BOSQUE_WORLD_DEAD_KEY = "world-node-bosque-dead";
const BOSQUE_WORLD_DEAD_PATH = "assets/images/Mundos/BosqueMorto.png";
const DESERTO_WORLD_DEAD_KEY = "world-node-deserto-dead";
const DESERTO_WORLD_DEAD_PATH = "assets/images/Mundos/DesertoMorto.png";
const CAVERNA_WORLD_DEAD_KEY = "world-node-caverna-dead";
const CAVERNA_WORLD_DEAD_PATH = "assets/images/Mundos/CavernaMorta.png";
const VULCAO_WORLD_DEAD_KEY = "world-node-vulcao-dead";
const VULCAO_WORLD_DEAD_PATH = "assets/images/Mundos/VulcaoMorto.png";
const PARTICLE_KEY = "intro-particle";
const GLINT_KEY = "intro-glint";

const INTRO_WORLDS = [
  { key: CASCATA_WORLD_DEAD_KEY, x: 176, y: 350, size: 132, color: 0x67e8f9 },
  { key: CAVERNA_WORLD_DEAD_KEY, x: 352, y: 252, size: 132, color: 0xc084fc },
  { key: DESERTO_WORLD_DEAD_KEY, x: 546, y: 332, size: 132, color: 0xffd166 },
  { key: BOSQUE_WORLD_DEAD_KEY, x: 726, y: 224, size: 132, color: 0x76ff03 },
  { key: VULCAO_WORLD_DEAD_KEY, x: 884, y: 338, size: 132, color: 0xff7b72 }
];

const INTRO_MOMENTS: IntroMoment[] = [
  {
    text: "Os ecossistemas digitais\nviviam em equilíbrio.",
    duration: 5200,
    tint: 0xbef7ff,
    overlayAlpha: 0.52,
    glowAlpha: 0.26,
    corruptionAlpha: 0,
    targetX: 512,
    targetY: 320,
    zoom: 1.04
  },
  {
    text: "Cada região possuía seu próprio fluxo,\nsua própria lógica e seu próprio sistema.",
    duration: 6000,
    tint: 0xe7fff6,
    overlayAlpha: 0.5,
    glowAlpha: 0.32,
    corruptionAlpha: 0,
    targetX: 540,
    targetY: 284,
    zoom: 1.1
  },
  {
    text: "Mas uma falha começou\na se espalhar entre os mundos.",
    duration: 5400,
    tint: 0xffb4b4,
    overlayAlpha: 0.56,
    glowAlpha: 0.1,
    corruptionAlpha: 0.18,
    targetX: 610,
    targetY: 306,
    zoom: 1.16,
    shake: true
  },
  {
    text: "O Buggie corrompeu fluxos,\ndesorganizou sistemas\ne interrompeu a lógica do mundo.",
    duration: 6200,
    tint: 0xff8a8a,
    overlayAlpha: 0.64,
    glowAlpha: 0.06,
    corruptionAlpha: 0.3,
    targetX: 660,
    targetY: 300,
    zoom: 1.22,
    shake: true
  },
  {
    text: "Agora, apenas os Robôs Assistentes\npodem ajudar na restauração\ndos ecossistemas.",
    duration: 5600,
    tint: 0xd9ffff,
    overlayAlpha: 0.54,
    glowAlpha: 0.34,
    corruptionAlpha: 0,
    targetX: 240,
    targetY: 350,
    zoom: 1.34
  },
  {
    text: "Essa restauração começa AGORA na\nCASCATA DE DADOS",
    duration: 8200,
    tint: 0xd9ffff,
    overlayAlpha: 0.56,
    glowAlpha: 0.44,
    corruptionAlpha: 0,
    targetX: 176,
    targetY: 350,
    zoom: 1.72,
    highlightCascata: true
  }
];

export class IntroScene extends Phaser.Scene {
  private worldContainer?: Phaser.GameObjects.Container;
  private backgroundImage?: Phaser.GameObjects.Image;
  private overlay?: Phaser.GameObjects.Rectangle;
  private corruptionOverlay?: Phaser.GameObjects.Rectangle;
  private textObject?: Phaser.GameObjects.Text;
  private finalTextContainer?: Phaser.GameObjects.Container;
  private finalLeadText?: Phaser.GameObjects.Text;
  private finalTitleText?: Phaser.GameObjects.Text;
  private finalGlint?: Phaser.GameObjects.Rectangle;
  private finalLightBeams: Phaser.GameObjects.Graphics[] = [];
  private cinematicShade?: Phaser.GameObjects.Rectangle;
  private topShade?: Phaser.GameObjects.Rectangle;
  private bottomShade?: Phaser.GameObjects.Rectangle;
  private glowObjects: Phaser.GameObjects.Arc[] = [];
  private cascataGlow?: Phaser.GameObjects.Arc;
  private baseScale = 1;
  private worldOffsetX = 0;
  private worldOffsetY = 0;

  public constructor() {
    super("IntroScene");
  }

  public preload(): void {
    ([
      [BACKGROUND_KEY, BACKGROUND_PATH],
      [CASCATA_WORLD_KEY, CASCATA_WORLD_PATH],
      [CASCATA_WORLD_DEAD_KEY, CASCATA_WORLD_DEAD_PATH],
      [BOSQUE_WORLD_DEAD_KEY, BOSQUE_WORLD_DEAD_PATH],
      [DESERTO_WORLD_DEAD_KEY, DESERTO_WORLD_DEAD_PATH],
      [CAVERNA_WORLD_DEAD_KEY, CAVERNA_WORLD_DEAD_PATH],
      [VULCAO_WORLD_DEAD_KEY, VULCAO_WORLD_DEAD_PATH]
    ] as [string, string][]).forEach(([key, path]) => {
      if (!this.textures.exists(key)) {
        this.load.image(key, path);
      }
    });
  }

  public create(): void {
    this.createParticleTexture();
    this.createGlintTexture();
    this.createWorldBackdrop();
    this.createIntroSequence();

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
  }

  private createWorldBackdrop(): void {
    this.computeWorldLayout();

    this.backgroundImage = this.add.image(this.scale.width / 2, this.scale.height / 2, BACKGROUND_KEY);
    this.backgroundImage.setOrigin(0.5).setDepth(0);
    this.scaleBackgroundCover(this.backgroundImage);

    const world = this.add.container(this.worldOffsetX, this.worldOffsetY).setDepth(0);
    world.setScale(this.baseScale);
    this.worldContainer = world;

    const path = this.add.graphics();
    path.lineStyle(3, 0x7df7ff, 0.08);
    path.beginPath();
    const firstWorld = INTRO_WORLDS[0]!;
    path.moveTo(firstWorld.x, firstWorld.y);
    INTRO_WORLDS.slice(1).forEach((node) => path.lineTo(node.x, node.y));
    path.strokePath();
    world.add(path);

    INTRO_WORLDS.forEach((node) => {
      const glow = this.add.circle(node.x, node.y, 82, node.color, 0.16);
      const image = this.add.image(node.x, node.y, node.key).setDisplaySize(node.size, node.size);
      const inner = this.add.circle(node.x, node.y + 6, 24, node.color, 0.08);
      world.add([glow, image, inner]);
      this.glowObjects.push(glow);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.1, to: 0.26 },
        scaleX: { from: 0.94, to: 1.1 },
        scaleY: { from: 0.94, to: 1.1 },
        duration: Phaser.Math.Between(2600, 3800),
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut"
      });
    });

    this.cascataGlow = this.add.circle(firstWorld.x, firstWorld.y, 92, 0x8cf8ff, 0);
    world.add(this.cascataGlow);

    this.overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x07091f, 0.52);
    this.overlay.setOrigin(0, 0).setDepth(INTRO_DEPTH);

    this.corruptionOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x8f1111, 0);
    this.corruptionOverlay.setOrigin(0, 0).setDepth(INTRO_DEPTH + 1);

    this.textObject = this.add.text(this.scale.width / 2, this.scale.height / 2, "", {
      fontFamily: "Georgia",
      fontSize: `${this.getIntroFontSize()}px`,
      color: "#f3d9a6",
      align: "center",
      lineSpacing: 12,
      wordWrap: { width: Math.min(920, this.scale.width - 120) }
    });
    this.textObject.setOrigin(0.5);
    this.textObject.setDepth(INTRO_DEPTH + 4);
    this.textObject.setAlpha(0);
    this.textObject.setStroke("#01050d", 4);
    this.textObject.setShadow(0, 4, "#000000", 14, true, true);

    this.createFinalTextObjects();
    this.createDepthAtmosphere();
    this.createAmbientParticles();
  }

  private createIntroSequence(): void {
    this.cameras.main.fadeIn(1000, 2, 4, 9);
    this.runIntroMoment(0);
  }

  private runIntroMoment(index: number): void {
    const moment = INTRO_MOMENTS[index];
    if (!moment) {
      this.startWorldMap();
      return;
    }

    this.playIntroEffects(moment);
    if (moment.highlightCascata) {
      this.showFinalCascataTitle(moment.duration, () => {
        this.runIntroMoment(index + 1);
      });
      return;
    }

    this.showIntroText(moment.text, moment.duration, () => {
      this.runIntroMoment(index + 1);
    });
  }

  private showIntroText(text: string, duration: number, onComplete: () => void): void {
    if (!this.textObject) {
      onComplete();
      return;
    }

    this.textObject.setText(text);
    this.textObject.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.textObject.setFontSize(this.getIntroFontSize());
    this.textObject.setWordWrapWidth(Math.min(920, this.scale.width - 120));

    this.tweens.add({
      targets: this.textObject,
      alpha: 1,
      y: this.scale.height / 2 - 10,
      duration: 1150,
      ease: "Sine.Out",
      onComplete: () => {
        this.time.delayedCall(Math.max(1200, duration - 2300), () => {
          this.tweens.add({
            targets: this.textObject,
            alpha: 0,
            y: this.scale.height / 2 - 24,
            duration: 1150,
            ease: "Sine.InOut",
            onComplete
          });
        });
      }
    });
  }

  private createFinalTextObjects(): void {
    this.finalLeadText = this.add.text(0, -58, "Essa restauração começa AGORA na", {
      fontFamily: "Georgia",
      fontSize: `${this.getFinalLeadFontSize()}px`,
      color: "#f3d9a6",
      align: "center"
    });
    this.finalLeadText.setOrigin(0.5);
    this.finalLeadText.setStroke("#01050d", 4);
    this.finalLeadText.setShadow(0, 4, "#000000", 14, true, true);

    this.finalTitleText = this.add.text(0, 22, "CASCATA DE DADOS", {
      fontFamily: "Georgia",
      fontSize: `${this.getFinalTitleFontSize()}px`,
      fontStyle: "bold",
      color: "#a7f3ff",
      align: "center"
    });
    this.finalTitleText.setOrigin(0.5);
    this.finalTitleText.setStroke("#01050d", 7);
    this.finalTitleText.setShadow(0, 5, "#000000", 18, true, true);

    this.finalGlint = this.add.rectangle(-280, 22, 56, 96, 0xffffff, 0);
    this.finalGlint.setBlendMode(Phaser.BlendModes.ADD);
    this.finalGlint.setAngle(-18);

    this.finalTextContainer = this.add.container(this.scale.width / 2, this.scale.height * 0.55, [
      this.finalLeadText,
      this.finalTitleText,
      this.finalGlint
    ]);
    this.finalTextContainer.setDepth(INTRO_DEPTH + 5);
    this.finalTextContainer.setAlpha(0);
    this.finalTextContainer.setScale(0.95);
  }

  private showFinalCascataTitle(duration: number, onComplete: () => void): void {
    if (!this.finalTextContainer || !this.finalLeadText || !this.finalTitleText || !this.finalGlint) {
      onComplete();
      return;
    }

    this.textObject?.setAlpha(0);
    this.finalTextContainer.setPosition(this.scale.width / 2, this.scale.height * 0.55);
    this.finalTextContainer.setScale(0.95);
    this.finalTextContainer.setAlpha(0);
    this.finalLeadText.setFontSize(this.getFinalLeadFontSize());
    this.finalTitleText.setFontSize(this.getFinalTitleFontSize());
    this.finalGlint.setAlpha(0);
    this.finalGlint.setPosition(-Math.min(430, this.scale.width * 0.22), 22);

    this.playFinalCascataEnergy(duration);

    this.tweens.add({
      targets: this.finalTextContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 1350,
      ease: "Sine.Out"
    });

    this.tweens.add({
      targets: this.finalTitleText,
      scaleX: { from: 0.98, to: 1.025 },
      scaleY: { from: 0.98, to: 1.025 },
      duration: 2100,
      yoyo: true,
      repeat: 3,
      ease: "Sine.InOut"
    });

    this.time.delayedCall(900, () => {
      if (!this.finalGlint) {
        return;
      }

      this.finalGlint.setAlpha(0.48);
      this.tweens.add({
        targets: this.finalGlint,
        x: Math.min(430, this.scale.width * 0.22),
        alpha: { from: 0.48, to: 0 },
        duration: 1500,
        ease: "Sine.InOut"
      });
    });

    this.time.delayedCall(3600, () => {
      if (!this.finalGlint) {
        return;
      }

      this.finalGlint.setPosition(-Math.min(430, this.scale.width * 0.22), 22);
      this.finalGlint.setAlpha(0.36);
      this.tweens.add({
        targets: this.finalGlint,
        x: Math.min(430, this.scale.width * 0.22),
        alpha: { from: 0.36, to: 0 },
        duration: 1750,
        ease: "Sine.InOut"
      });
    });

    this.time.delayedCall(Math.max(2200, duration - 1350), () => {
      this.tweens.add({
        targets: this.finalTextContainer,
        alpha: 0,
        duration: 1100,
        ease: "Sine.InOut",
        onComplete
      });
    });
  }

  private playIntroEffects(moment: IntroMoment): void {
    this.tweens.add({
      targets: this.overlay,
      alpha: moment.overlayAlpha,
      duration: moment.highlightCascata ? 1900 : 1200,
      ease: "Sine.InOut"
    });

    this.tweens.add({
      targets: this.corruptionOverlay,
      alpha: moment.corruptionAlpha,
      duration: moment.highlightCascata ? 1800 : 1100,
      ease: "Sine.InOut"
    });

    this.glowObjects.forEach((glow) => {
      const alpha = moment.highlightCascata && glow !== this.glowObjects[0] ? 0.08 : moment.glowAlpha;
      glow.setFillStyle(moment.tint, Phaser.Math.Clamp(alpha, 0.04, 0.5));
    });

    if (this.cascataGlow) {
      this.tweens.add({
        targets: this.cascataGlow,
        alpha: moment.highlightCascata ? 0.78 : 0,
        scaleX: moment.highlightCascata ? 2.05 : 1,
        scaleY: moment.highlightCascata ? 2.05 : 1,
        duration: moment.highlightCascata ? 3600 : 1400,
        ease: "Sine.InOut"
      });
    }

    this.focusWorld(moment.targetX, moment.targetY, moment.zoom, moment.duration + (moment.highlightCascata ? 900 : 700));

    if (moment.shake) {
      this.playGlitchPulse();
    }
  }

  private focusWorld(targetX: number, targetY: number, zoom: number, duration: number): void {
    if (!this.worldContainer) {
      return;
    }

    const scale = this.baseScale * zoom;
    const x = this.scale.width / 2 - targetX * scale;
    const y = this.scale.height / 2 - targetY * scale;

    this.tweens.add({
      targets: this.worldContainer,
      x,
      y,
      scaleX: scale,
      scaleY: scale,
      duration,
      ease: "Sine.InOut"
    });
  }

  private playGlitchPulse(): void {
    if (!this.corruptionOverlay || !this.worldContainer) {
      return;
    }

    this.cameras.main.shake(260, 0.0025);
    this.tweens.add({
      targets: this.corruptionOverlay,
      alpha: { from: this.corruptionOverlay.alpha, to: Math.min(this.corruptionOverlay.alpha + 0.18, 0.42) },
      duration: 120,
      yoyo: true,
      repeat: 2,
      ease: "Stepped"
    });
  }

  private playFinalCascataEnergy(duration: number): void {
    this.tweens.add({
      targets: this.corruptionOverlay,
      alpha: 0,
      duration: 2600,
      ease: "Sine.Out"
    });

    this.createFinalLightBeams(duration);

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height * 0.52;

    this.add.particles(centerX, centerY, PARTICLE_KEY, {
      x: { min: -210, max: 210 },
      y: { min: -70, max: 120 },
      speedX: { min: -14, max: 14 },
      speedY: { min: -74, max: -24 },
      lifespan: { min: 1800, max: 3800 },
      quantity: 3,
      frequency: 58,
      alpha: { start: 0.74, end: 0 },
      scale: { start: 0.64, end: 0.08 },
      tint: [0x7df7ff, 0x9effe7, 0xf9d77e],
      blendMode: Phaser.BlendModes.ADD,
      stopAfter: Math.floor(duration / 70)
    }).setDepth(INTRO_DEPTH + 3);

    this.add.particles(centerX, centerY + 40, PARTICLE_KEY, {
      x: { min: -170, max: 170 },
      y: { min: -40, max: 80 },
      speedX: { min: -5, max: 5 },
      speedY: { min: -46, max: -16 },
      lifespan: { min: 2200, max: 4200 },
      quantity: 2,
      frequency: 82,
      alpha: { start: 0.58, end: 0 },
      scale: { start: 0.42, end: 0.06 },
      tint: [0xf9d77e, 0xfff4b8, 0x8cf8ff],
      blendMode: Phaser.BlendModes.ADD,
      stopAfter: Math.floor(duration / 95)
    }).setDepth(INTRO_DEPTH + 3);
  }

  private createFinalLightBeams(duration: number): void {
    this.finalLightBeams.forEach((beam) => beam.destroy());
    this.finalLightBeams = [];

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height * 0.5;

    [-126, -88, -32, 42, 104, 146].forEach((offset, index) => {
      const beam = this.add.graphics().setDepth(INTRO_DEPTH + 2);
      beam.lineStyle(index % 3 === 0 ? 3 : 2, index % 2 === 0 ? 0x8cf8ff : 0xf9d77e, 0.26);
      beam.beginPath();
      beam.moveTo(centerX + offset, centerY + 135);
      beam.lineTo(centerX + offset * 0.35, centerY - 120);
      beam.strokePath();
      beam.setAlpha(0);
      this.finalLightBeams.push(beam);

      this.tweens.add({
        targets: beam,
        alpha: { from: 0, to: 0.46 },
        duration: 2100,
        yoyo: true,
        repeat: Math.max(2, Math.floor(duration / 3000)),
        ease: "Sine.InOut",
        delay: index * 180
      });
    });
  }

  private startWorldMap(): void {
    this.cameras.main.fadeOut(1100, 2, 4, 9);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("WorldMapScene");
    });
  }

  private createAmbientParticles(): void {
    this.add.particles(0, 0, PARTICLE_KEY, {
      x: { min: 0, max: this.scale.width },
      y: { min: 0, max: this.scale.height },
      speedX: { min: -8, max: 12 },
      speedY: { min: -18, max: -4 },
      lifespan: { min: 2800, max: 5200 },
      quantity: 1,
      frequency: 115,
      alpha: { start: 0.28, end: 0 },
      scale: { start: 0.58, end: 0.1 },
      tint: [0x7df7ff, 0x9effe7, 0x6da8ff],
      blendMode: Phaser.BlendModes.ADD
    }).setDepth(INTRO_DEPTH + 2);
  }

  private createDepthAtmosphere(): void {
    const fog = this.add.particles(0, 0, PARTICLE_KEY, {
      x: { min: -80, max: this.scale.width + 80 },
      y: { min: 0, max: this.scale.height },
      speedX: { min: -7, max: 7 },
      speedY: { min: -3, max: 3 },
      lifespan: { min: 5600, max: 9000 },
      quantity: 1,
      frequency: 280,
      alpha: { start: 0.08, end: 0 },
      scale: { start: 2.8, end: 5.6 },
      tint: [0x1d2b5f, 0x153c55, 0x2a174f],
      blendMode: Phaser.BlendModes.ADD
    });
    fog.setDepth(INTRO_DEPTH + 1);

    const foregroundSparks = this.add.particles(0, 0, PARTICLE_KEY, {
      x: { min: 0, max: this.scale.width },
      y: { min: 0, max: this.scale.height },
      speedX: { min: -18, max: 18 },
      speedY: { min: -26, max: -8 },
      lifespan: { min: 2200, max: 4200 },
      quantity: 1,
      frequency: 220,
      alpha: { start: 0.18, end: 0 },
      scale: { start: 0.24, end: 0.04 },
      tint: [0x8cf8ff, 0xb6e6ff, 0xf9d77e],
      blendMode: Phaser.BlendModes.ADD
    });
    foregroundSparks.setDepth(INTRO_DEPTH + 3);

    this.cinematicShade = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x050716, 0.22);
    this.cinematicShade.setOrigin(0, 0).setDepth(INTRO_DEPTH + 1);

    this.topShade = this.add.rectangle(0, 0, this.scale.width, this.scale.height * 0.18, 0x02030a, 0.14);
    this.topShade.setOrigin(0, 0).setDepth(INTRO_DEPTH + 1);

    this.bottomShade = this.add.rectangle(
      0,
      this.scale.height * 0.82,
      this.scale.width,
      this.scale.height * 0.18,
      0x02030a,
      0.12
    );
    this.bottomShade.setOrigin(0, 0).setDepth(INTRO_DEPTH + 1);
  }

  private createParticleTexture(): void {
    if (this.textures.exists(PARTICLE_KEY)) {
      return;
    }

    const particle = this.add.graphics();
    particle.fillStyle(0xffffff, 1);
    particle.fillCircle(8, 8, 8);
    particle.generateTexture(PARTICLE_KEY, 16, 16);
    particle.destroy();
  }

  private createGlintTexture(): void {
    if (this.textures.exists(GLINT_KEY)) {
      return;
    }

    const glint = this.add.graphics();
    glint.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 0, 0.85, 0.85, 0);
    glint.fillRect(0, 0, 64, 128);
    glint.generateTexture(GLINT_KEY, 64, 128);
    glint.destroy();
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    this.cameras.main.setSize(gameSize.width, gameSize.height);
    this.computeWorldLayout();
    if (this.worldContainer) {
      this.worldContainer.setPosition(this.worldOffsetX, this.worldOffsetY);
      this.worldContainer.setScale(this.baseScale);
    }
    if (this.backgroundImage) {
      this.scaleBackgroundCover(this.backgroundImage);
    }
    this.overlay?.setPosition(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    this.corruptionOverlay?.setPosition(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    this.textObject?.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.textObject?.setFontSize(this.getIntroFontSize());
    this.textObject?.setWordWrapWidth(Math.min(920, this.scale.width - 120));
    this.finalTextContainer?.setPosition(this.scale.width / 2, this.scale.height * 0.55);
    this.finalLeadText?.setFontSize(this.getFinalLeadFontSize());
    this.finalTitleText?.setFontSize(this.getFinalTitleFontSize());
    this.cinematicShade?.setPosition(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    this.topShade?.setPosition(0, 0).setDisplaySize(this.scale.width, this.scale.height * 0.18);
    this.bottomShade?.setPosition(0, this.scale.height * 0.82);
    this.bottomShade?.setDisplaySize(this.scale.width, this.scale.height * 0.18);
  }

  private computeWorldLayout(): void {
    this.baseScale = Math.max(this.scale.width / DESIGN_WIDTH, this.scale.height / DESIGN_HEIGHT);
    this.worldOffsetX = (this.scale.width - DESIGN_WIDTH * this.baseScale) / 2;
    this.worldOffsetY = (this.scale.height - DESIGN_HEIGHT * this.baseScale) / 2;
  }

  private scaleBackgroundCover(image: Phaser.GameObjects.Image): void {
    const textureSource = image.texture.getSourceImage() as { width?: number; height?: number };
    const textureWidth = textureSource.width ?? DESIGN_WIDTH;
    const textureHeight = textureSource.height ?? DESIGN_HEIGHT;
    const width = this.scale.width;
    const height = this.scale.height;
    const scaleX = width / textureWidth;
    const scaleY = height / textureHeight;
    const scale = Math.max(scaleX, scaleY) * BACKGROUND_OVERSCAN;

    image.setPosition(width / 2, height / 2);
    image.setScale(scale);
  }

  private getIntroFontSize(): number {
    return Phaser.Math.Clamp(Math.round(this.scale.width * 0.027), 28, 48);
  }

  private getFinalLeadFontSize(): number {
    return Phaser.Math.Clamp(Math.round(this.scale.width * 0.023), 24, 40);
  }

  private getFinalTitleFontSize(): number {
    return Phaser.Math.Clamp(Math.round(this.scale.width * 0.047), 52, 86);
  }
}
