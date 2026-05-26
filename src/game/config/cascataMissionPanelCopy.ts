export type MissionPanelCopy = {
  title: string;
  line1: string;
  line2: string;
};

export const MISSION_PANEL_COPY: Record<number, MissionPanelCopy> = {
  1: {
    title: "Fase 01 - Soma",
    line1: "A vida precisa ser restaurada!",
    line2: "Use a ação (+10) para levar água e fazer a natureza florescer."
  },
  2: {
    title: "Fase 02 - Fluxo e Refluxo",
    line1: "A água precisa de equilíbrio!",
    line2: "Use as ações +10 e -10 para ajustar o fluxo de cada nascente."
  },
  3: {
    title: "Fase 03 - Raízes Digitais",
    line1: "Os sensores estão desalinhados!",
    line2: "Sincronize as raízes usando as ações certas dentro do limite de movimentos."
  },
  4: {
    title: "Fase 04 - Sequência Instável",
    line1: "A energia está sobrecarregada!",
    line2: "Estabilize com +10 ou -10 antes de multiplicar a energia da cascata."
  },
  5: {
    title: "Fase 05 - Fluxo Computacional",
    line1: "Os circuitos vivos entraram em colapso!",
    line2: "Use a divisão para redistribuir energia com eficiência algorítmica."
  },
  6: {
    title: "Fase 06 - Sistema Central",
    line1: "Sistema central instável.",
    line2: "Planeje a ordem e confira a previsão."
  },
  7: {
    title: "Fase 07 - Núcleo do Buggie",
    line1: "A corrupção lógica chegou ao núcleo!",
    line2: "Depure a sequência final usando todos os módulos desbloqueados."
  },
  8: {
    title: "Fase 08 - Colapso da Cascata",
    line1: "A Cascata entrou em falha crítica!",
    line2: "Programe sequências otimizadas para restaurar o sistema final."
  }
};
