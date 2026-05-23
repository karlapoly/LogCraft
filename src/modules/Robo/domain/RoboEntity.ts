export type RoboPosition = {
  x: number;
  y: number;
};

export class RoboEntity {
  public constructor(
    public readonly id: string,
    public position: RoboPosition
  ) {}

  public moverPara(position: RoboPosition): void {
    this.position = position;
  }
}
