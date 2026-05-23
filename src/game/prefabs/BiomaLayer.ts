import Phaser from "phaser";

export class BiomaLayer {
  private readonly image: Phaser.GameObjects.Image;
  private readonly baseWidth = 1024;
  private readonly baseHeight = 640;

  public constructor(scene: Phaser.Scene, textureKey: string) {
    this.image = scene.add.image(512, 320, textureKey).setDisplaySize(this.baseWidth, this.baseHeight);
  }

  public layout(bounds: Phaser.Geom.Rectangle): void {
    const scale = Math.max(bounds.width / this.baseWidth, bounds.height / this.baseHeight);
    this.image.setPosition(bounds.centerX, bounds.centerY);
    this.image.setDisplaySize(this.baseWidth * scale, this.baseHeight * scale);
  }

  public setVisible(visible: boolean): void {
    this.image.setVisible(visible);
  }

  public setAlpha(alpha: number): void {
    this.image.setAlpha(alpha);
  }

  public fadeTo(alpha: number, duration: number): void {
    this.image.scene.tweens.add({
      targets: this.image,
      alpha,
      duration,
      ease: "Sine.Out"
    });
  }
}
