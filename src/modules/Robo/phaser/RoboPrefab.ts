import Phaser from "phaser";
import { RoboEntity } from "../domain/RoboEntity";

export class RoboPrefab {
  private readonly scene: Phaser.Scene;
  private readonly entity: RoboEntity;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;

  public constructor(scene: Phaser.Scene, entity: RoboEntity, textureKey: string) {
    this.scene = scene;
    this.entity = entity;
    this.shadow = scene.add.ellipse(entity.position.x, entity.position.y + 18, 38, 12, 0x04130c, 0.26);
    this.sprite = scene.add.image(entity.position.x, entity.position.y, textureKey).setScale(0.42);
  }

  public sync(): void {
    this.shadow.setPosition(this.entity.position.x, this.entity.position.y + 28);
    this.sprite.setPosition(this.entity.position.x, this.entity.position.y);
  }

  public setTexture(textureKey: string): void {
    this.sprite.setTexture(textureKey);
  }

  public setVisible(visible: boolean): void {
    this.sprite.setVisible(visible);
    this.shadow.setVisible(visible);
  }

  public async moverPara(position: RoboEntity["position"]): Promise<void> {
    this.entity.moverPara(position);

    await new Promise<void>((resolve) => {
      this.scene.tweens.add({
        targets: [this.sprite, this.shadow],
        x: position.x,
        duration: 460,
        ease: "Sine.Out"
      });

      this.scene.tweens.add({
        targets: this.sprite,
        y: position.y - 18,
        yoyo: true,
        duration: 230,
        ease: "Quad.Out",
        onComplete: () => {
          this.sync();
          resolve();
        }
      });
    });
  }

  public pulse(): void {
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 0.48,
      yoyo: true,
      duration: 180,
      repeat: 1
    });
  }
}
