import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Barra de progresso visual para o aluno
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Preparando Ecossistema...',
      style: { font: '20px monospace', color: '#ffffff' }
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x4CAF50, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Assets de UI Globais (carregados uma única vez)
    this.load.image("ui-placa-nivel", "assets/images/PlacaNivel.png");
    this.load.image("ui-painel-robos", "assets/images/PlacaRobos.png");
    this.load.image("ui-btn-back", "assets/images/Back.png");
    this.load.image("ui-btn-next", "assets/images/Next.png");
    this.load.image("ui-btn-home", "assets/images/Home.png");

    // Asset do Mapa Mundial
    this.load.image("world-map-background", "assets/images/Fundo/Camada1_Mundo.png");
  }

  create() {
    this.scene.start("WorldMapScene");
  }
}