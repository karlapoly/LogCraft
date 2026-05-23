import Phaser from "phaser";

export const FANTASY_PANEL_COLORS = {
  shadow: 0x000000,
  surface: 0x141313,
  darkBorder: 0x2f2b25,
  titleSurface: 0x24201b,
  titleBorder: 0xd2a24a,
  scanLine: 0x292723,
  goldDetail: 0x8d6a2d
} as const;

type FantasyPanelFrameOptions = {
  x?: number;
  y?: number;
  width: number;
  height: number;
  radius?: number;
  glowColor?: number;
  glowAlpha?: number;
  glowExpansion?: number;
  glowRadius?: number;
  shadowAlpha?: number;
  shadowExpansion?: number;
  shadowRadius?: number;
  surfaceAlpha?: number;
  darkBorderWidth?: number;
  darkBorderColor?: number;
  darkBorderInset?: number;
  darkBorderRadius?: number;
  accentBorderWidth?: number;
  accentBorderColor: number;
  accentBorderInset?: number;
  accentBorderRadius?: number;
};

export function drawFantasyPanelFrame(
  graphics: Phaser.GameObjects.Graphics,
  options: FantasyPanelFrameOptions
): void {
  const x = options.x ?? 0;
  const y = options.y ?? 0;
  const radius = options.radius ?? 8;
  const glowAlpha = options.glowAlpha ?? 0;
  const glowExpansion = options.glowExpansion ?? 7;
  const shadowExpansion = options.shadowExpansion ?? 5;
  const shadowRadius = options.shadowRadius ?? 11;
  const darkBorderInset = options.darkBorderInset ?? 4;
  const accentBorderInset = options.accentBorderInset ?? 10;

  if (options.glowColor !== undefined && glowAlpha > 0) {
    graphics.fillStyle(options.glowColor, glowAlpha);
    graphics.fillRoundedRect(
      x - glowExpansion,
      y - glowExpansion,
      options.width + glowExpansion * 2,
      options.height + glowExpansion * 2,
      options.glowRadius ?? 12
    );
  }

  graphics.fillStyle(FANTASY_PANEL_COLORS.shadow, options.shadowAlpha ?? 0.34);
  graphics.fillRoundedRect(
    x - shadowExpansion,
    y - shadowExpansion,
    options.width + shadowExpansion * 2,
    options.height + shadowExpansion * 2,
    shadowRadius
  );

  graphics.fillStyle(FANTASY_PANEL_COLORS.surface, options.surfaceAlpha ?? 0.98);
  graphics.fillRoundedRect(x, y, options.width, options.height, radius);

  graphics.lineStyle(
    options.darkBorderWidth ?? 7,
    options.darkBorderColor ?? FANTASY_PANEL_COLORS.darkBorder,
    1
  );
  graphics.strokeRoundedRect(
    x + darkBorderInset,
    y + darkBorderInset,
    options.width - darkBorderInset * 2,
    options.height - darkBorderInset * 2,
    options.darkBorderRadius ?? 7
  );

  graphics.lineStyle(options.accentBorderWidth ?? 3, options.accentBorderColor, 1);
  graphics.strokeRoundedRect(
    x + accentBorderInset,
    y + accentBorderInset,
    options.width - accentBorderInset * 2,
    options.height - accentBorderInset * 2,
    options.accentBorderRadius ?? 5
  );
}
