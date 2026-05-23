import Phaser from "phaser";
import { CORRUPCAO_FRAGMENT_SHADER } from "./corrupcaoShader";

export class CorrupcaoLayer {
  private readonly scene: Phaser.Scene;
  private readonly image: Phaser.GameObjects.Image;
  private readonly revealMaskShape: Phaser.GameObjects.Graphics;
  private readonly revealMask: Phaser.Display.Masks.GeometryMask;
  private readonly baseWidth = 1024;
  private readonly baseHeight = 640;
  private maskCenterX = 512;
  private maskCenterY = 320;
  private revealRadius = 820;

  public constructor(scene: Phaser.Scene, textureKey: string) {
    this.scene = scene;
    this.image = scene.add.image(512, 320, textureKey).setDisplaySize(this.baseWidth, this.baseHeight);

    this.revealMaskShape = scene.add.graphics().setVisible(false);
    this.revealMask = this.revealMaskShape.createGeometryMask();
    this.revealMask.invertAlpha = true;
    this.image.setMask(this.revealMask);
    this.installPipeline();
  }

  public layout(bounds: Phaser.Geom.Rectangle): void {
    const scale = Math.max(bounds.width / this.baseWidth, bounds.height / this.baseHeight);
    this.maskCenterX = bounds.centerX;
    this.maskCenterY = bounds.centerY;
    this.revealRadius = Math.sqrt(bounds.width ** 2 + bounds.height ** 2) / 2;

    this.image.setPosition(bounds.centerX, bounds.centerY);
    this.image.setDisplaySize(this.baseWidth * scale, this.baseHeight * scale);
  }

  public reset(): void {
    this.image.setAlpha(0.5);
    this.image.setVisible(true);
    this.revealMaskShape.clear();
  }

  public hideImmediately(): void {
    this.image.setAlpha(0);
  }

  public fadeOut(duration: number, onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this.image,
      alpha: 0,
      duration,
      ease: "Sine.Out",
      onComplete: () => {
        onComplete?.();
      }
    });
  }

  public playOrganicReveal(onComplete: () => void): void {
    const revealState = { radius: 0 };

    this.scene.tweens.add({
      targets: revealState,
      radius: this.revealRadius,
      duration: 1400,
      ease: "Sine.Out",
      onUpdate: () => {
        this.revealMaskShape.clear();
        this.revealMaskShape.fillStyle(0xffffff, 1);
        this.revealMaskShape.fillCircle(this.maskCenterX, this.maskCenterY, revealState.radius);
      },
      onComplete: () => {
        this.hideImmediately();
        onComplete();
      }
    });
  }

  private installPipeline(): void {
    const key = "CorrupcaoPipeline";
    const renderer = this.scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    const pipelines = renderer.pipelines;

    if (!pipelines.has(key)) {
      pipelines.add(
        key,
        new Phaser.Renderer.WebGL.Pipelines.SinglePipeline({
          game: this.scene.game,
          fragShader: CORRUPCAO_FRAGMENT_SHADER
        })
      );
    }

    this.image.setPipeline(key);
  }
}
