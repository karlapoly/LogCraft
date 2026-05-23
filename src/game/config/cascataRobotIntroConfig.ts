export type RobotIntroConfig = {
  id: string;
  level: number;
  textureKey: string;
  name: string;
  moduleText: string;
  color: number;
  accentColor: number;
  lines: string[];
  specialOpening?: string[];
};

export const ROBOT_INTRO_CONFIGS: Record<number, RobotIntroConfig> = {
  1: {
    id: "addition-builder",
    level: 1,
    textureKey: "cascata-robo-adicao",
    name: "CONSTRUTOR",
    moduleText: "MÓDULO DE ADIÇÃO LIBERADO",
    color: 0x76ff80,
    accentColor: 0xf2c45d,
    specialOpening: [
      "Você conseguiu chegar...",
      "O Buggie corrompeu os fluxos dos ecossistemas digitais.",
      "Mas ainda existe esperança.",
      "Com a lógica certa, podemos restaurar este mundo."
    ],
    lines: [
      "Somar é construir.",
      "Toda restauração começa por pequenas conexões."
    ]
  },
  2: {
    id: "subtraction-analyst",
    level: 2,
    textureKey: "cascata-robo-subtracao",
    name: "ANALISTA",
    moduleText: "MÓDULO DE SUBTRAÇÃO LIBERADO",
    color: 0x3b82f6,
    accentColor: 0x7dd3fc,
    lines: [
      "Nem todo excesso fortalece um sistema.",
      "Às vezes, restaurar é remover."
    ]
  },
  4: {
    id: "multiplication-optimizer",
    level: 4,
    textureKey: "cascata-robo-multiplicacao",
    name: "OTIMIZADOR",
    moduleText: "MÓDULO DE MULTIPLICAÇÃO LIBERADO",
    color: 0xfacc15,
    accentColor: 0x7df7ff,
    lines: [
      "Padrões aceleram soluções.",
      "Eficiência é a chave da evolução."
    ]
  },
  5: {
    id: "division-distributor",
    level: 5,
    textureKey: "cascata-robo-divisao",
    name: "DISTRIBUIDOR",
    moduleText: "MÓDULO DE DIVISÃO LIBERADO",
    color: 0x8cf8ff,
    accentColor: 0xd9ffff,
    lines: [
      "Todo sistema precisa de equilíbrio.",
      "Distribuir é manter o fluxo vivo."
    ]
  }
};
