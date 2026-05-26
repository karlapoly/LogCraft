import Phaser from "phaser";
import type { WaterSlotConfig } from "../../levels/types";
import { biomaStoreApi, type MetaDeBioma, type BiomaState } from "../../state/biomaStore";
import { MISSION_PANEL_COPY } from "../config/cascataMissionPanelCopy";
import { ROBOT_INTRO_CONFIGS, type RobotIntroConfig } from "../config/cascataRobotIntroConfig";
import {
  applyCascataOperation,
  getDefaultCascataOperationValue,
  isCascataDivisionOperation,
  isCascataMultiplicationOperation,
  type TipoDeOperacaoDaCascata
} from "../logic/cascataOperations";
import { FANTASY_PANEL_COLORS, drawFantasyPanelFrame } from "../ui/fantasyPanel";

type CascataSceneData = {
  subLevel?: number;
};

type SlotView = {
  slot: WaterSlotConfig;
  output: string;
  anchorX: number;
  anchorY: number;
  zone: Phaser.GameObjects.Zone;
  plaque: Phaser.GameObjects.Graphics;
  valueText: Phaser.GameObjects.Text;
  progressText: Phaser.GameObjects.Text;
  meterBackground: Phaser.GameObjects.Rectangle;
  meterFill: Phaser.GameObjects.Rectangle;
  labelText: Phaser.GameObjects.Text;
};

type PhaseElementConfig = {
  id: string;
  textureKey: string;
  path: string;
  x: number;
  y: number;
  depth?: number;
  angle?: number;
  output?: string;
  restoreTextureKey?: string;
};

type PhaseElementView = {
  id: string;
  anchorX: number;
  anchorY: number;
  image: Phaser.GameObjects.Image;
};

type ComputationalFlowSystem = "condutores" | "portais" | "distribuidores";

type ComputationalFlowStep = {
  system: ComputationalFlowSystem;
  goals: Record<string, number>;
  message: string;
};

type ComputationalFlowRoute =
  | "cascade-to-condutores"
  | "condutores-to-portais"
  | "portais-to-distribuidores"
  | "distribuidores-to-ecosystem-left"
  | "distribuidores-to-ecosystem-right";

type Phase6EnergyRoute =
  | "crystal-to-cascade"
  | "crystal-to-portals"
  | "crystal-to-distributors"
  | "crystal-to-reservoirs"
  | "crystal-to-conductors";

type ComputationalEnergyPath = {
  route: ComputationalFlowRoute;
  graphics: Phaser.GameObjects.Graphics;
  color: number;
  lineWidth: number;
  alpha: number;
};

type ComputationalPortalNode = {
  system: ComputationalFlowSystem;
  container: Phaser.GameObjects.Container;
};

type Phase6EnergyPath = {
  route: Phase6EnergyRoute;
  graphics: Phaser.GameObjects.Graphics;
  color: number;
  lineWidth: number;
  alpha: number;
};

type RobotButtonView = {
  id: string;
  operation: TipoDeOperacaoDaCascata;
  value: number;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  homeX: number;
  homeY: number;
};

type CascataSubLevelConfig = {
  subtitle: string;
  background: string;
  robotButtons: Array<{
    operation: TipoDeOperacaoDaCascata;
    texture: string;
    label: string;
    x: number;
    y: number;
    value?: number;
  }>;
  targets: Array<{
    output: string;
    initial: number;
    goal: number;
  }>;
  maxMoves?: number;
  puzzleType?: string;
  sequenceMode?: boolean;
  automationMode?: boolean;
  corruptionMode?: boolean;
  debugMode?: boolean;
  corruptionLevel?: number;
  optimizationRules?: {
    idealMoves?: number;
  };
  narrative?: string;
  sequenceRules?: {
    lockedOperations?: TipoDeOperacaoDaCascata[];
    unlockAfterStabilizingMove?: TipoDeOperacaoDaCascata[];
    criticalInvalidOperations?: TipoDeOperacaoDaCascata[];
  };
  operationRules?: {
    simultaneousDivision?: boolean;
    previewBeforeDrop?: boolean;
    criticalMin?: number;
    criticalMax?: number;
  };
};

type SetupLevelOptions = {
  preservePhaseVisuals?: boolean;
};

const BASE_WIDTH = 2340;
const BASE_HEIGHT = 1280;
const TOTAL_WORLD_TARGETS = 24;
const TOP_PADDING = 26;
const SIDE_PADDING = 40;
const BOTTOM_PADDING = 28;
const ROBOT_PANEL_HEIGHT = 186;
const ROBOT_PANEL_PADDING_X = 22;
const ROBOT_PANEL_SLOT_WIDTH = 88;
const ROBOT_PANEL_SLOT_HEIGHT = 78;
const ROBOT_PANEL_SLOT_GAP = 18;
const ROBOT_PANEL_TITLE_HEIGHT = 34;
const ROBOT_PANEL_ICON_SIZE = 102;
const ROBOT_PANEL_ICON_HOVER_SIZE = 110;
const ROBOT_PANEL_ICON_ACTIVE_SIZE = 116;
const MISSION_PANEL_WIDTH = 392;
const MISSION_PANEL_HEIGHT = 186;
const MISSION_PANEL_TITLE_HEIGHT = 48;
const ENERGY_PANEL_WIDTH = 142;
const ENERGY_PANEL_HEIGHT = 208;
const ENERGY_BAR_WIDTH = 10;
const ENERGY_BAR_HEIGHT = 12;
const ENERGY_BAR_GAP = 3;
const ROBOT_INTRO_STORAGE_KEY = "logcraft-cascata-robot-intros-v3";
const ROBOT_INTRO_PARTICLE_KEY = "cascata-robot-intro-particle";
const HEALTH_RING_RADIUS = 52;
const HEALTH_RING_THICKNESS = 14;
const CASCATA_OVERLAY_DEPTH = -16;
const CASCATA_FASE_04_OVERLAY_DEPTH = -16;
const PLAYFIELD_TOP_OFFSET = 108;
const PLAYFIELD_SIDE_MARGIN = 32;
const SLOT_ZONE_WIDTH = 230;
const SLOT_ZONE_HEIGHT = 150;
const SLOT_PLAQUE_WIDTH = 244;
const SLOT_PLAQUE_HEIGHT = 136;
const SLOT_METER_WIDTH = 150;
const SLOT_METER_HEIGHT = 12;
const SLOT_METER_FILL_WIDTH = 150;
const SLOT_METER_FILL_HEIGHT = 6;
const SLOT_LABEL_OFFSET_Y = -43;
const SLOT_VALUE_OFFSET_Y = -11;
const SLOT_PROGRESS_OFFSET_Y = 14;
const SLOT_METER_OFFSET_Y = 38;
const BACK_BUTTON_KEY = "ui-btn-back";
const BACKGROUND_CORRUPTED_KEY = "fase-fundo-morto";
const BACKGROUND_CORRUPTED_PATH = "assets/images/Fase01/FundoMorto.png";
const BACKGROUND_RESTORED_KEY = "fase-fundo-vivo";
const BACKGROUND_RESTORED_PATH = "assets/images/Fase01/FundoVivo.png";
const BACKGROUND_RESTORED_FASE_02_KEY = "fase-02-fundo-vivo";
const BACKGROUND_RESTORED_FASE_02_PATH = "assets/images/Fase02/FundoFase2.png";
const BACKGROUND_CORRUPTED_FASE_04_KEY = "fase-04-fundo-morto";
const BACKGROUND_CORRUPTED_FASE_04_PATH = "assets/images/Fase04/FundoMorto.png";
const BACKGROUND_RESTORED_FASE_04_KEY = "fase-04-fundo-vivo";
const BACKGROUND_RESTORED_FASE_04_PATH = "assets/images/Fase04/FundoFase4.png";
const BACKGROUND_RESTORED_FASE_06_KEY = "fase-06-fundo-vivo";
const BACKGROUND_RESTORED_FASE_06_PATH = "assets/images/Fase06/FundoFase6.png";
const NEXT_BUTTON_KEY = "ui-btn-next";
const HOME_BUTTON_KEY = "ui-btn-home";
const ROBO_ADICAO_KEY = "cascata-robo-adicao";
const ROBO_ADICAO_PATH = "assets/images/Robos/Adicao.png";
const ROBO_SUBTRACAO_KEY = "cascata-robo-subtracao";
const ROBO_SUBTRACAO_PATH = "assets/images/Robos/Subtracao.png";
const ROBO_DIVISAO_KEY = "cascata-robo-divisao";
const ROBO_DIVISAO_PATH = "assets/images/Robos/Divisao.png";
const ROBO_MULTIPLICACAO_KEY = "cascata-robo-multiplicacao";
const ROBO_MULTIPLICACAO_PATH = "assets/images/Robos/Multiplicacao.png";
const CASCATA_KEY = "fase-cascata";
const CASCATA_PATH = "assets/images/Fase01/Cascata.png";
const CASCATA_FASE_02_KEY = "fase-02-cascata";
const CASCATA_FASE_02_PATH = "assets/images/Fase02/Cascata.png";
const CASCATA_FASE_04_KEY = "fase-04-cascata";
const CASCATA_FASE_04_PATH = "assets/images/Fase04/Cascata.png";
const CASCATA_FASE_06_KEY = "fase-06-cascata";
const CASCATA_FASE_06_PATH = "assets/images/Fase06/Cascata.png";
const ARVORES_MORTAS_KEY = "fase-arvores-mortas";
const ARVORES_MORTAS_PATH = "assets/images/Fase01/ArvoresMortas.png";
const FLOR_MORTA_KEY = "fase-flor-morta";
const FLOR_MORTA_PATH = "assets/images/Fase01/FlorMorta.png";
const ARVORES_VIVAS_KEY = "fase-arvores-vivas";
const ARVORES_VIVAS_PATH = "assets/images/Fase01/ArvoresVivas.png";
const FLOR_VIVA_KEY = "fase-flor-viva";
const FLOR_VIVA_PATH = "assets/images/Fase01/FlorViva.png";
const VASO_SOLO_KEY = "fase-vaso-solo-vivo";
const VASO_SOLO_PATH = "assets/images/Fase01/VasoSoloVivo.png";
const AGUA_SOLO_KEY = "fase-fluxo-agua-solo";
const AGUA_SOLO_PATH = "assets/images/Fase01/FluxoAguaSolo.png";
const AGUA_FLOR_KEY = "fase-fluxo-agua-flor";
const AGUA_FLOR_PATH = "assets/images/Fase01/FluxoAguaFlor.png";
const FLOR_SENSOR_FASE_02_KEY = "fase-02-flor-sensor";
const FLOR_SENSOR_FASE_02_PATH = "assets/images/Fase02/FlorSensor.png";
const FLUXO_AGUA_SENSOR_FASE_02_KEY = "fase-02-fluxo-agua-sensor";
const FLUXO_AGUA_SENSOR_FASE_02_PATH = "assets/images/Fase02/FluxoAguaSensor.png";
const ARVORES_TURBINA_FASE_02_KEY = "fase-02-arvores-turbina";
const ARVORES_TURBINA_FASE_02_PATH = "assets/images/Fase02/ArvoresTurbina.png";
const SOLO_RESERVATORIO_FASE_02_KEY = "fase-02-solo-reservatorio";
const SOLO_RESERVATORIO_FASE_02_PATH = "assets/images/Fase02/SoloReservatorio.png";
const FLUXO_AGUA_SOLO_FASE_02_KEY = "fase-02-fluxo-agua-solo";
const FLUXO_AGUA_SOLO_FASE_02_PATH = "assets/images/Fase02/FluxoAguaSolo.png";
const FLUXO_AGUA_SOLO_FASE_03_KEY = "fase-03-fluxo-agua-solo";
const FLUXO_AGUA_SOLO_FASE_03_PATH = "assets/images/Fase03/FluxoAguaSolo.png";
const FLUXO_AGUA_SENSOR_FASE_03_KEY = "fase-03-fluxo-agua-sensor";
const FLUXO_AGUA_SENSOR_FASE_03_PATH = "assets/images/Fase03/FluxoAguaSensor.png";
const ARVORES_RAIZES_FASE_03_KEY = "fase-03-arvores-raizes";
const ARVORES_RAIZES_FASE_03_PATH = "assets/images/Fase03/ArvoresRaizes.png";
const GERADOR_FASE_04_KEY = "fase-04-gerador";
const GERADOR_FASE_04_PATH = "assets/images/Fase04/Gerador.png";
const GERADOR_CERTO_FASE_04_KEY = "fase-04-gerador-certo";
const GERADOR_CERTO_FASE_04_PATH = "assets/images/Fase04/GeradorCerto.png";
const ARVORES_ROCHAS_FASE_04_KEY = "fase-04-arvores-rochas";
const ARVORES_ROCHAS_FASE_04_PATH = "assets/images/Fase04/ArvoresRochas.png";
const SOLO_BOMBA_FASE_04_KEY = "fase-04-solo-bomba";
const SOLO_BOMBA_FASE_04_PATH = "assets/images/Fase04/SoloBomba.png";
const FLUXO_AGUA_SENSOR_FASE_04_KEY = "fase-04-fluxo-agua-sensor";
const FLUXO_AGUA_SENSOR_FASE_04_PATH = "assets/images/Fase04/FluxoAguaSensor.png";
const FLUXO_AGUA_SOLO_FASE_04_KEY = "fase-04-fluxo-agua-solo";
const FLUXO_AGUA_SOLO_FASE_04_PATH = "assets/images/Fase04/FluxoAguaSolo.png";
const FLUXO_AGUA_SENSOR_FASE_06_KEY = "fase-06-fluxo-agua-sensor";
const FLUXO_AGUA_SENSOR_FASE_06_PATH = "assets/images/Fase06/FluxoAguaSensor.png";
const AUDIO_CLICK_MODULE_KEY = "audio-click-module";
const AUDIO_CLICK_MODULE_PATH = "assets/audio/click_module.wav";
const AUDIO_SUCCESS_SYNC_KEY = "audio-success-sync";
const AUDIO_SUCCESS_SYNC_PATH = "assets/audio/success_sync.wav";
const AUDIO_ERROR_LIMIT_KEY = "audio-error-limit";
const AUDIO_ERROR_LIMIT_PATH = "assets/audio/error_limit.wav";
const AUDIO_PHASE_COMPLETE_KEY = "audio-phase-complete";
const AUDIO_PHASE_COMPLETE_PATH = "assets/audio/phase_complete.wav";
const AUDIO_ENERGY_CLICK_KEY = "audio-energy-click";
const AUDIO_OVERLOAD_WARNING_KEY = "audio-overload-warning";
const AUDIO_SEQUENCE_SUCCESS_KEY = "audio-sequence-success";
const AUDIO_DIVISION_CLICK_KEY = "audio-division-click";
const AUDIO_ENERGY_FLOW_KEY = "audio-energy-flow";
const AUDIO_OPTIMIZATION_SUCCESS_KEY = "audio-optimization-success";
const AUDIO_SEQUENCE_SELECT_KEY = "audio-sequence-select";
const AUDIO_PREDICTION_VALID_KEY = "audio-prediction-valid";
const AUDIO_PREDICTION_ERROR_KEY = "audio-prediction-error";
const AUDIO_CORE_RESTORE_KEY = "audio-core-restore";
const AUDIO_CORRUPTION_WARNING_KEY = "audio-corruption-warning";
const AUDIO_DEBUG_SUCCESS_KEY = "audio-debug-success";
const AUDIO_FINAL_SEQUENCE_COMPLETE_KEY = "audio-final-sequence-complete";
const AUDIO_ECOSYSTEM_RESTORED_KEY = "audio-ecosystem-restored";
const AUDIO_FINAL_PHASE_COMPLETE_KEY = "audio-final-phase-complete";
const AUDIO_FINAL_WARNING_KEY = "audio-final-warning";
const AUDIO_AUTOMATION_EXECUTE_KEY = "audio-automation-execute";
const AUDIO_CORRUPTION_DESTROYED_KEY = "audio-corruption-destroyed";
const AUDIO_CASCADE_RESTORED_KEY = "audio-cascade-restored";
const AUDIO_FINAL_VICTORY_KEY = "audio-final-victory";
const AUDIO_PLACEHOLDER_PATHS: Record<string, string> = {
  [AUDIO_CLICK_MODULE_KEY]: AUDIO_CLICK_MODULE_PATH,
  [AUDIO_SUCCESS_SYNC_KEY]: AUDIO_SUCCESS_SYNC_PATH,
  [AUDIO_ERROR_LIMIT_KEY]: AUDIO_ERROR_LIMIT_PATH,
  [AUDIO_PHASE_COMPLETE_KEY]: AUDIO_PHASE_COMPLETE_PATH,
  [AUDIO_ENERGY_CLICK_KEY]: AUDIO_CLICK_MODULE_PATH,
  [AUDIO_OVERLOAD_WARNING_KEY]: AUDIO_ERROR_LIMIT_PATH,
  [AUDIO_SEQUENCE_SUCCESS_KEY]: AUDIO_SUCCESS_SYNC_PATH,
  [AUDIO_DIVISION_CLICK_KEY]: AUDIO_CLICK_MODULE_PATH,
  [AUDIO_ENERGY_FLOW_KEY]: AUDIO_SUCCESS_SYNC_PATH,
  [AUDIO_OPTIMIZATION_SUCCESS_KEY]: AUDIO_SUCCESS_SYNC_PATH,
  [AUDIO_SEQUENCE_SELECT_KEY]: AUDIO_CLICK_MODULE_PATH,
  [AUDIO_PREDICTION_VALID_KEY]: AUDIO_SUCCESS_SYNC_PATH,
  [AUDIO_PREDICTION_ERROR_KEY]: AUDIO_ERROR_LIMIT_PATH,
  [AUDIO_CORE_RESTORE_KEY]: AUDIO_SUCCESS_SYNC_PATH,
  [AUDIO_CORRUPTION_WARNING_KEY]: AUDIO_ERROR_LIMIT_PATH,
  [AUDIO_DEBUG_SUCCESS_KEY]: AUDIO_SUCCESS_SYNC_PATH,
  [AUDIO_FINAL_SEQUENCE_COMPLETE_KEY]: AUDIO_SUCCESS_SYNC_PATH,
  [AUDIO_ECOSYSTEM_RESTORED_KEY]: AUDIO_SUCCESS_SYNC_PATH,
  [AUDIO_FINAL_PHASE_COMPLETE_KEY]: AUDIO_PHASE_COMPLETE_PATH,
  [AUDIO_FINAL_WARNING_KEY]: AUDIO_ERROR_LIMIT_PATH,
  [AUDIO_AUTOMATION_EXECUTE_KEY]: AUDIO_CLICK_MODULE_PATH,
  [AUDIO_CORRUPTION_DESTROYED_KEY]: AUDIO_SUCCESS_SYNC_PATH,
  [AUDIO_CASCADE_RESTORED_KEY]: AUDIO_SUCCESS_SYNC_PATH,
  [AUDIO_FINAL_VICTORY_KEY]: AUDIO_PHASE_COMPLETE_PATH
};

const PHASE_ELEMENT_CONFIGS: PhaseElementConfig[] = [
  {
    id: "arvores_mortas",
    textureKey: ARVORES_MORTAS_KEY,
    path: ARVORES_MORTAS_PATH,
    x: 0,
    y: 0,
    depth: -15,
    output: "Arvores",
    restoreTextureKey: ARVORES_VIVAS_KEY
  },
  {
    id: "flores_morta",
    textureKey: FLOR_MORTA_KEY,
    path: FLOR_MORTA_PATH,
    x: 0,
    y: 0,
    depth: -10,
    output: "Flores",
    restoreTextureKey: FLOR_VIVA_KEY
  }
];

const RESTORE_SUPPORT_CONFIGS: Record<string, PhaseElementConfig[]> = {
  Flores: [
    {
      id: "agua_flor",
      textureKey: AGUA_FLOR_KEY,
      path: AGUA_FLOR_PATH,
      x: 0,
      y: 0,
      depth: -2
    }
  ],
  Solo: [
    {
      id: "vaso_solo",
      textureKey: VASO_SOLO_KEY,
      path: VASO_SOLO_PATH,
      x: 0,
      y: 0,
      depth: -3
    },
    {
      id: "agua_solo",
      textureKey: AGUA_SOLO_KEY,
      path: AGUA_SOLO_PATH,
      x: 0,
      y: 0,
      depth: -16
    }
  ],
  Arvores: [
    {
      id: "agua_arvores",
      textureKey: AGUA_SOLO_KEY,
      path: AGUA_SOLO_PATH,
      x: 0,
      y: 0,
      depth: -16
    }
  ]
};

const WATER_SLOTS: WaterSlotConfig[] = [
  { id: "slot-flores", x: 340, y: 468 },
  { id: "slot-arvores", x: 525, y: 438 },
  { id: "slot-solo", x: 720, y: 472 }
];

const PLAQUE_POSITIONS = [
  { x: 620, y: 975 },
  { x: 1000, y: 1065 },
  { x: 1360, y: 964 }
];

const COMPUTATIONAL_FLOW_STEPS: ComputationalFlowStep[] = [
  {
    system: "condutores",
    goals: { Flores: 35, Arvores: 45, Solo: 15 },
    message: "Condutores restaurados. O fluxo chegou aos portais."
  },
  {
    system: "portais",
    goals: { Flores: 45, Arvores: 55, Solo: 25 },
    message: "Portais estabilizados. A energia encontrou os distribuidores."
  },
  {
    system: "distribuidores",
    goals: { Flores: 40, Arvores: 50, Solo: 20 },
    message: "Distribuidores sincronizados. O ecossistema voltou a respirar."
  }
];

const DEBUG_MESSAGES = [
  "Hmm... o fluxo ainda não foi restaurado.\nTalvez outra sequência funcione melhor.",
  "O Buggie confundiu os sistemas...\nMas toda tentativa revela uma nova estratégia.",
  "Na computação, testar faz parte da solução.",
  "Debugging iniciado:\nvamos analisar uma nova possibilidade?",
  "As conexões ainda estão instáveis...\nMas agora sabemos o que ajustar.",
  "Algoritmos também aprendem com tentativas.",
  "O sistema reagiu diferente do esperado.\nHora de testar uma nova lógica.",
  "Cada tentativa aproxima a cascata da restauração.",
  "O fluxo quase foi sincronizado.\nTalvez outra combinação funcione melhor.",
  "Grandes sistemas exigem múltiplos testes.",
  "O Buggie criou interferências...\nMas padrões podem revelar a solução.",
  "A lógica está evoluindo.\nVamos tentar novamente?",
  "Mesmo sistemas inteligentes precisam recalcular rotas.",
  "Talvez a ordem das operações seja a chave.",
  "O ecossistema respondeu parcialmente...\nContinue investigando."
];

const DEBUG_MESSAGES_BY_PHASE: Record<number, string[]> = {
  4: [
    "Sequências instáveis pedem ordem e precisão.\nQual operação prepara melhor o próximo passo?",
    "Multiplicar pode acelerar o fluxo...\nmas talvez a preparação venha antes."
  ],
  5: [
    "O fluxo computacional respondeu parcialmente.\nQue etapa da rede precisa ser restaurada agora?",
    "Condutores, portais e distribuidores precisam de sincronia.\nVamos depurar a sequência?"
  ],
  6: [
    "O Sistema Central precisa prever antes de executar.\nTeste uma rota lógica diferente.",
    "Quando a previsão não fecha, o algoritmo recalcula.\nQue valor deve mudar primeiro?"
  ],
  7: [
    "Depurar o Buggie exige observar padrões.\nQual comando estabiliza melhor o núcleo?",
    "O núcleo respondeu, mas ainda há ruído lógico.\nVamos revisar a sequência?"
  ],
  8: [
    "A cascata está perto da restauração completa.\nQual automação reduz os passos?",
    "Sistemas finais pedem soluções enxutas.\nQue sequência usa menos energia?"
  ]
};

const SUB_LEVELS: Record<number, CascataSubLevelConfig> = {
  1: {
    subtitle: "Fase 01 - Soma",
    background: BACKGROUND_CORRUPTED_KEY,
    robotButtons: [
      { operation: "adicao", texture: ROBO_ADICAO_KEY, label: "Adição", x: 40, y: -46 }
    ],
    targets: [
      { output: "Flores", initial: 20, goal: 30 },
      { output: "Arvores", initial: 10, goal: 50 },
      { output: "Solo", initial: 0, goal: 30 }
    ]
  },
  2: {
    subtitle: "Fluxo e Refluxo",
    background: BACKGROUND_CORRUPTED_KEY,
    robotButtons: [
      { operation: "adicao", texture: ROBO_ADICAO_KEY, label: "Adição", x: 10, y: -46, value: 10 },
      { operation: "subtraction", texture: ROBO_SUBTRACAO_KEY, label: "Subtração", x: 80, y: -46, value: -10 }
    ],
    targets: [
      { output: "Flores", initial: 40, goal: 20 },
      { output: "Arvores", initial: 50, goal: 10 },
      { output: "Solo", initial: 10, goal: 30 }
    ]
  },
  3: {
    subtitle: "Sincronizar os Sensores das Raízes Digitais",
    background: BACKGROUND_CORRUPTED_KEY,
    maxMoves: 5,
    puzzleType: "root-sensor-sync",
    narrative: "As Raízes Digitais operam em frequências desalinhadas após a falha de sincronização do Buggie.",
    robotButtons: [
      { operation: "adicao", texture: ROBO_ADICAO_KEY, label: "+10", x: -2, y: -46, value: 10 },
      { operation: "addition", texture: ROBO_ADICAO_KEY, label: "+5", x: 58, y: -46, value: 5 },
      { operation: "subtraction", texture: ROBO_SUBTRACAO_KEY, label: "-10", x: 88, y: -46, value: -10 },
      { operation: "subtraction", texture: ROBO_SUBTRACAO_KEY, label: "-5", x: 118, y: -46, value: -5 }
    ],
    targets: [
      { output: "Flores", initial: 15, goal: 35 },
      { output: "Solo", initial: 5, goal: 20 },
      { output: "Arvores", initial: 30, goal: 20 }
    ]
  },
  4: {
    subtitle: "Sequência Instável",
    background: BACKGROUND_CORRUPTED_FASE_04_KEY,
    maxMoves: 10,
    puzzleType: "unstable-sequence",
    narrative: "As Rochas Energéticas da Cascata sofreram uma sobrecarga e precisam de operações em ordem segura.",
    sequenceRules: {
      lockedOperations: ["multiply", "multiplication"],
      unlockAfterStabilizingMove: ["multiply", "multiplication"],
      criticalInvalidOperations: ["multiply", "multiplication"]
    },
    robotButtons: [
      { operation: "addition", texture: ROBO_ADICAO_KEY, label: "+10", x: -2, y: -46, value: 10 },
      { operation: "addition", texture: ROBO_ADICAO_KEY, label: "+5", x: 28, y: -46, value: 5 },
      { operation: "subtraction", texture: ROBO_SUBTRACAO_KEY, label: "-10", x: 58, y: -46, value: -10 },
      { operation: "subtraction", texture: ROBO_SUBTRACAO_KEY, label: "-5", x: 88, y: -46, value: -5 },
      { operation: "multiply", texture: ROBO_MULTIPLICACAO_KEY, label: "x2", x: 118, y: -46, value: 2 }
    ],
    targets: [
      { output: "Flores", initial: 10, goal: 50 },
      { output: "Arvores", initial: 15, goal: 55 },
      { output: "Solo", initial: 60, goal: 20 }
    ]
  },
  5: {
    subtitle: "Fluxo Computacional",
    background: BACKGROUND_CORRUPTED_KEY,
    maxMoves: 5,
    puzzleType: "computational-flow",
    narrative: "O fluxo energético do bioma digital entrou em colapso após falhas nos circuitos vivos responsáveis pela redistribuição de energia.",
    robotButtons: [
      { operation: "addition", texture: ROBO_ADICAO_KEY, label: "+10", x: -2, y: -46, value: 10 },
      { operation: "addition", texture: ROBO_ADICAO_KEY, label: "+5", x: 28, y: -46, value: 5 },
      { operation: "subtraction", texture: ROBO_SUBTRACAO_KEY, label: "-10", x: 58, y: -46, value: -10 },
      { operation: "subtraction", texture: ROBO_SUBTRACAO_KEY, label: "-5", x: 88, y: -46, value: -5 },
      { operation: "multiply", texture: ROBO_MULTIPLICACAO_KEY, label: "x2", x: 118, y: -46, value: 2 },
      { operation: "division", texture: ROBO_DIVISAO_KEY, label: "/2", x: 118, y: -46, value: 2 }
    ],
    targets: [
      { output: "Flores", initial: 70, goal: 35 },
      { output: "Arvores", initial: 90, goal: 45 },
      { output: "Solo", initial: 30, goal: 15 }
    ]
  },
  6: {
    subtitle: "Sistema Central",
    background: BACKGROUND_CORRUPTED_KEY,
    maxMoves: 8,
    puzzleType: "central-system",
    sequenceMode: true,
    narrative: "O núcleo principal da Cascata de Dados entrou em colapso após sucessivas falhas energéticas provocadas pelo Buggie.",
    operationRules: {
      previewBeforeDrop: true,
      criticalMin: 0,
      criticalMax: 120
    },
    robotButtons: [
      { operation: "addition", texture: ROBO_ADICAO_KEY, label: "+10", x: -2, y: -46, value: 10 },
      { operation: "subtraction", texture: ROBO_SUBTRACAO_KEY, label: "-5", x: 58, y: -46, value: -5 },
      { operation: "multiply", texture: ROBO_MULTIPLICACAO_KEY, label: "x2", x: 118, y: -46, value: 2 },
      { operation: "division", texture: ROBO_DIVISAO_KEY, label: "/2", x: 178, y: -46, value: 2 }
    ],
    targets: [
      { output: "Flores", initial: 25, goal: 70 },
      { output: "Arvores", initial: 40, goal: 80 },
      { output: "Solo", initial: 90, goal: 30 }
    ]
  },
  7: {
    subtitle: "Núcleo do Buggie",
    background: BACKGROUND_CORRUPTED_KEY,
    maxMoves: 7,
    puzzleType: "buggie-core",
    sequenceMode: true,
    corruptionMode: true,
    debugMode: true,
    narrative: "O Buggie revelou seu núcleo central e espalhou corrupção lógica por toda a Cascata de Dados.",
    operationRules: {
      previewBeforeDrop: true,
      criticalMin: 0,
      criticalMax: 180
    },
    robotButtons: [
      { operation: "addition", texture: ROBO_ADICAO_KEY, label: "+10", x: -2, y: -46, value: 10 },
      { operation: "subtraction", texture: ROBO_SUBTRACAO_KEY, label: "-10", x: 58, y: -46, value: -10 },
      { operation: "addition", texture: ROBO_ADICAO_KEY, label: "+5", x: 118, y: -46, value: 5 },
      { operation: "subtraction", texture: ROBO_SUBTRACAO_KEY, label: "-5", x: 178, y: -46, value: -5 },
      { operation: "multiply", texture: ROBO_MULTIPLICACAO_KEY, label: "x2", x: 238, y: -46, value: 2 },
      { operation: "division", texture: ROBO_DIVISAO_KEY, label: "/2", x: 298, y: -46, value: 2 }
    ],
    targets: [
      { output: "Flores", initial: 120, goal: 40 },
      { output: "Arvores", initial: 90, goal: 30 },
      { output: "Solo", initial: 150, goal: 75 }
    ]
  },
  8: {
    subtitle: "Colapso da Cascata",
    background: BACKGROUND_CORRUPTED_KEY,
    maxMoves: 5,
    puzzleType: "cascade-collapse",
    automationMode: true,
    sequenceMode: true,
    corruptionMode: true,
    debugMode: true,
    corruptionLevel: 3,
    optimizationRules: {
      idealMoves: 3
    },
    narrative: "A Cascata de Dados entrou em falha crítica e o último núcleo corrompido ameaça destruir o ecossistema digital.",
    operationRules: {
      previewBeforeDrop: true,
      criticalMin: 0,
      criticalMax: 320
    },
    robotButtons: [
      { operation: "addition", texture: ROBO_ADICAO_KEY, label: "+10", x: -2, y: -46, value: 10 },
      { operation: "subtraction", texture: ROBO_SUBTRACAO_KEY, label: "-10", x: 58, y: -46, value: -10 },
      { operation: "addition", texture: ROBO_ADICAO_KEY, label: "+5", x: 118, y: -46, value: 5 },
      { operation: "subtraction", texture: ROBO_SUBTRACAO_KEY, label: "-5", x: 178, y: -46, value: -5 },
      { operation: "multiply", texture: ROBO_MULTIPLICACAO_KEY, label: "x2", x: 238, y: -46, value: 2 },
      { operation: "division", texture: ROBO_DIVISAO_KEY, label: "/2", x: 298, y: -46, value: 2 }
    ],
    targets: [
      { output: "Flores", initial: 200, goal: 50 },
      { output: "Arvores", initial: 25, goal: 125 },
      { output: "Solo", initial: 300, goal: 100 }
    ]
  }
};

export class CascataScene extends Phaser.Scene {
  public currentSubLevel = 1;
  private readonly biomeId = "level-01";

  private fullscreenRestoredBackground?: Phaser.GameObjects.Image;
  private fullscreenCorruptedBackground?: Phaser.GameObjects.Image;
  private cascataOverlay?: Phaser.GameObjects.Image;
  private phaseBackgroundLayers: Phaser.GameObjects.Image[] = [];
  private topHudContainer!: Phaser.GameObjects.Container;
  private subtitleText?: Phaser.GameObjects.Text;
  private missionPanelContainer?: Phaser.GameObjects.Container;
  private missionPanelTitle?: Phaser.GameObjects.Text;
  private missionPanelLine1?: Phaser.GameObjects.Text;
  private missionPanelLine2?: Phaser.GameObjects.Text;
  private panelContainer!: Phaser.GameObjects.Container;
  private robotPanelFrame?: Phaser.GameObjects.Graphics;
  private robotPanelTitle?: Phaser.GameObjects.Text;
  private robotResetButton?: Phaser.GameObjects.Image;
  private resultText?: Phaser.GameObjects.Text;
  private nextButton?: Phaser.GameObjects.Image;
  private homeButton?: Phaser.GameObjects.Image;
  private ecosystemHealthFill?: Phaser.GameObjects.Graphics;
  private ecosystemHealthBackground?: Phaser.GameObjects.Graphics;
  private ecosystemHealthText?: Phaser.GameObjects.Text;
  private energyPanelContainer?: Phaser.GameObjects.Container;
  private energyPanelFrame?: Phaser.GameObjects.Graphics;
  private energyPercentText?: Phaser.GameObjects.Text;
  private energyClickBars: Phaser.GameObjects.Rectangle[] = [];
  private phaseElements = new Map<string, PhaseElementView>();
  private restoredTopics = new Set<string>();
  private computationalFlowPaths = new Map<string, ComputationalEnergyPath>();
  private computationalFlowNodes = new Map<ComputationalFlowSystem, ComputationalPortalNode>();
  private computationalFlowObjects: Phaser.GameObjects.GameObject[] = [];
  private computationalFlowEvents: Phaser.Time.TimerEvent[] = [];
  private activatedComputationalSystems = new Set<ComputationalFlowSystem>();
  private phase6EnergyPaths = new Map<Phase6EnergyRoute, Phase6EnergyPath>();
  private phase6EnergyObjects: Phaser.GameObjects.GameObject[] = [];
  private phase6EnergyEvents: Phaser.Time.TimerEvent[] = [];
  private phase6ActivatedStages = new Set<string>();
  private phase6CascadeOrb?: Phaser.GameObjects.Container;
  private phase6SyncTargets: Phaser.GameObjects.GameObject[] = [];
  private firstRestoreDecorationShown = false;
  private slotViews = new Map<string, SlotView>();
  private slotObjects: Phaser.GameObjects.GameObject[] = [];
  private robotButtons = new Map<string, RobotButtonView>();
  private unsubscribeStore?: () => void;
  private panelDynamicObjects: Phaser.GameObjects.GameObject[] = [];
  private draggedRobotPreview?: Phaser.GameObjects.Image;
  private moveCounterText?: Phaser.GameObjects.Text;
  private predictionPreviewText?: Phaser.GameObjects.Text;
  private currentMoves = 0;
  private maxMoves?: number;
  private phaseFailed = false;
  private stabilizingMovePlayed = false;
  private computationalFlowStepIndex = 0;
  private playfieldBounds = new Phaser.Geom.Rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT);
  private slotLayoutBaseWidth = BASE_WIDTH;
  private slotLayoutBaseHeight = BASE_HEIGHT;
  private completionRecorded = false;
  private autoReturnScheduled = false;
  private autoReturnTimeoutId?: number;
  private biomeIdInStore = "level-01";
  private isRobotIntroActive = false;
  private robotIntroObjects: Phaser.GameObjects.GameObject[] = [];
  private activeRobotIntroId?: string;
  private debugPopupObjects: Phaser.GameObjects.GameObject[] = [];
  private lastDebugMessage?: string;
  private isDebugPopupOpen = false;

  public constructor() {
    super("CascataScene");
  }

  public init(data: CascataSceneData): void {
    this.resetSceneSessionState();
    this.currentSubLevel = data.subLevel ?? 1;
    this.completionRecorded = false;
    this.autoReturnScheduled = false;
  }

  public preload(): void {
    ([
      [BACKGROUND_CORRUPTED_KEY, BACKGROUND_CORRUPTED_PATH],
      [BACKGROUND_RESTORED_KEY, BACKGROUND_RESTORED_PATH],
      [BACKGROUND_RESTORED_FASE_02_KEY, BACKGROUND_RESTORED_FASE_02_PATH],
      [BACKGROUND_CORRUPTED_FASE_04_KEY, BACKGROUND_CORRUPTED_FASE_04_PATH],
      [BACKGROUND_RESTORED_FASE_04_KEY, BACKGROUND_RESTORED_FASE_04_PATH],
      [BACKGROUND_RESTORED_FASE_06_KEY, BACKGROUND_RESTORED_FASE_06_PATH],
      [CASCATA_KEY, CASCATA_PATH],
      [CASCATA_FASE_02_KEY, CASCATA_FASE_02_PATH],
      [CASCATA_FASE_04_KEY, CASCATA_FASE_04_PATH],
      [CASCATA_FASE_06_KEY, CASCATA_FASE_06_PATH],
      [ROBO_ADICAO_KEY, ROBO_ADICAO_PATH],
      [ROBO_SUBTRACAO_KEY, ROBO_SUBTRACAO_PATH],
      [ROBO_DIVISAO_KEY, ROBO_DIVISAO_PATH],
      [ROBO_MULTIPLICACAO_KEY, ROBO_MULTIPLICACAO_PATH],
      [ARVORES_MORTAS_KEY, ARVORES_MORTAS_PATH],
      [FLOR_MORTA_KEY, FLOR_MORTA_PATH],
      [ARVORES_VIVAS_KEY, ARVORES_VIVAS_PATH],
      [FLOR_VIVA_KEY, FLOR_VIVA_PATH],
      [VASO_SOLO_KEY, VASO_SOLO_PATH],
      [AGUA_SOLO_KEY, AGUA_SOLO_PATH],
      [AGUA_FLOR_KEY, AGUA_FLOR_PATH],
      [FLOR_SENSOR_FASE_02_KEY, FLOR_SENSOR_FASE_02_PATH],
      [FLUXO_AGUA_SENSOR_FASE_02_KEY, FLUXO_AGUA_SENSOR_FASE_02_PATH],
      [ARVORES_TURBINA_FASE_02_KEY, ARVORES_TURBINA_FASE_02_PATH],
      [SOLO_RESERVATORIO_FASE_02_KEY, SOLO_RESERVATORIO_FASE_02_PATH],
      [FLUXO_AGUA_SOLO_FASE_02_KEY, FLUXO_AGUA_SOLO_FASE_02_PATH],
      [FLUXO_AGUA_SOLO_FASE_03_KEY, FLUXO_AGUA_SOLO_FASE_03_PATH],
      [FLUXO_AGUA_SENSOR_FASE_03_KEY, FLUXO_AGUA_SENSOR_FASE_03_PATH],
      [ARVORES_RAIZES_FASE_03_KEY, ARVORES_RAIZES_FASE_03_PATH],
      [GERADOR_FASE_04_KEY, GERADOR_FASE_04_PATH],
      [GERADOR_CERTO_FASE_04_KEY, GERADOR_CERTO_FASE_04_PATH],
      [ARVORES_ROCHAS_FASE_04_KEY, ARVORES_ROCHAS_FASE_04_PATH],
      [SOLO_BOMBA_FASE_04_KEY, SOLO_BOMBA_FASE_04_PATH],
      [FLUXO_AGUA_SENSOR_FASE_04_KEY, FLUXO_AGUA_SENSOR_FASE_04_PATH],
      [FLUXO_AGUA_SOLO_FASE_04_KEY, FLUXO_AGUA_SOLO_FASE_04_PATH],
      [FLUXO_AGUA_SENSOR_FASE_06_KEY, FLUXO_AGUA_SENSOR_FASE_06_PATH]
    ] as [string, string][]).forEach(([textureKey, path]) => {
      if (!this.textures.exists(textureKey)) {
        this.load.image(textureKey, path);
      }
    });

    PHASE_ELEMENT_CONFIGS.forEach((config) => {
      if (!this.textures.exists(config.textureKey)) {
        this.load.image(config.textureKey, config.path);
      }
    });

    Object.entries(AUDIO_PLACEHOLDER_PATHS).forEach(([audioKey, path]) => {
      if (!this.cache.audio.exists(audioKey)) {
        this.load.audio(audioKey, path);
      }
    });
  }

  public create(): void {
    this.createRobotIntroParticleTexture();
    this.createFullscreenBackground();
    this.createPhaseElements();
    this.createTopHud();
    this.createMissionPanel();
    this.createEcosystemHealthBar();
    this.createEnergyPanel();
    this.createRightPanel();
    this.createFooterMessage();
    this.createNextButton();
    this.createHomeButton();
    this.installInputEvents();
    this.installStoreSync();
    this.setupLevel(this.currentSubLevel);
    this.layoutScene(this.scale.width, this.scale.height);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.autoReturnTimeoutId) {
        window.clearTimeout(this.autoReturnTimeoutId);
        this.autoReturnTimeoutId = undefined;
      }
      this.clearRobotIntroduction();
      if (this.predictionPreviewText) {
        this.predictionPreviewText.destroy();
        this.predictionPreviewText = undefined;
      }
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.unsubscribeStore?.();
    });
  }

  public setupLevel(levelNumber: number, options: SetupLevelOptions = {}): void {
    const config = SUB_LEVELS[levelNumber];
    if (!config) {
      return;
    }

    this.currentSubLevel = levelNumber;
    this.currentMoves = 0;
    this.maxMoves = config.maxMoves;
    this.phaseFailed = false;
    this.closeDebugPopup();
    this.stabilizingMovePlayed = false;
    this.computationalFlowStepIndex = 0;
    this.isRobotIntroActive = false;
    // Inicializa o estado global
    const metas: MetaDeBioma[] = config.targets.map(t => ({
      output: t.output,
      initial: t.initial,
      goal: t.goal,
      current: t.initial
    }));
    biomaStoreApi.getState().inicializarNivel(this.biomeIdInStore, metas);

    this.clearDynamicLevelObjects();
    this.restoredTopics.clear();
    this.firstRestoreDecorationShown = false;
    if (!options.preservePhaseVisuals) {
      this.resetPhaseVisualState();
    }

    this.subtitleText?.setText("Cascata de dados");
    this.updateAuxiliaryTextVisibility();
    this.fullscreenCorruptedBackground?.setTexture(config.background);

    if (!options.preservePhaseVisuals) {
      this.fullscreenCorruptedBackground?.setAlpha(1);
      this.fullscreenRestoredBackground?.setAlpha(0);
      this.applyInheritedPhaseVisualState();
    }
    this.applyPhaseEntryAssets();
    this.applyPhaseVisualTheme();
    this.updateMissionPanel();
    this.nextButton?.setVisible(false).disableInteractive();
    this.nextButton?.setAlpha(0);

    this.createSlotZones();
    config.robotButtons.forEach((button) => {
      this.createRobotButton(button.operation, button.x, button.y, button.texture, button.value);
    });
    this.createMoveCounter();
    this.updateSequenceLocks();

    this.renderMetaValues(biomaStoreApi.getState().metas);
    this.resultText?.setText("");
    this.resultText?.setColor("#fff5cf");
    this.updateAuxiliaryTextVisibility();
    this.layoutScene(this.scale.width, this.scale.height);
    this.time.delayedCall(220, () => {
      this.showRobotIntroduction();
    });
  }

  private installStoreSync(): void {
    // O Phaser agora observa o Zustand. Se o estado mudar, o Phaser reage.
    this.unsubscribeStore = biomaStoreApi.subscribe(
      (state: BiomaState) => state.metas,
      (metas: MetaDeBioma[]) => {
        this.renderMetaValues(metas);
        this.checkWin();
      }
    );
  }

  private createFullscreenBackground(): void {
    this.fullscreenRestoredBackground = this.add
      .image(0, 0, BACKGROUND_RESTORED_KEY)
      .setOrigin(0, 0)
      .setDepth(-21)
      .setAlpha(0);
    this.fullscreenCorruptedBackground = this.add
      .image(0, 0, BACKGROUND_CORRUPTED_KEY)
      .setOrigin(0, 0)
      .setDepth(-20)
      .setAlpha(1);
  }

  private createTopHud(): void {
    const tituloLog = this.add.text(0, 0, "Log", {
      font: "bold 52px Arial",
      color: "#4CAF50"
    });
    tituloLog.setStroke("#FFFFFF", 10);
    tituloLog.setShadow(3, 3, "#333333", 3, true, true);

    const tituloCraft = this.add.text(tituloLog.width - 6, 0, "Craft:", {
      font: "bold 52px Arial",
      color: "#f59e0b"
    });
    tituloCraft.setStroke("#FFFFFF", 10);
    tituloCraft.setShadow(3, 3, "#333333", 3, true, true);

    this.subtitleText = this.add.text(8, 48, "Cascata de dados", {
      font: "bold 29px Arial",
      color: "#F2F2F2"
    });
    this.subtitleText.setStroke("#000000", 4);
    this.subtitleText.setShadow(2, 2, "#000000", 1, false, false);

    this.topHudContainer = this.add.container(SIDE_PADDING, TOP_PADDING, [tituloLog, tituloCraft, this.subtitleText]);
    this.topHudContainer.setDepth(20);
  }

  private createMissionPanel(): void {
    const frame = this.add.graphics();
    drawFantasyPanelFrame(frame, {
      width: MISSION_PANEL_WIDTH,
      height: MISSION_PANEL_HEIGHT,
      shadowExpansion: 8,
      shadowRadius: 10,
      darkBorderWidth: 8,
      accentBorderColor: 0xb7832f
    });

    frame.fillStyle(FANTASY_PANEL_COLORS.titleSurface, 0.96);
    frame.fillRoundedRect(14, 13, MISSION_PANEL_WIDTH - 28, MISSION_PANEL_TITLE_HEIGHT, 5);
    frame.lineStyle(2, FANTASY_PANEL_COLORS.titleBorder, 0.88);
    frame.strokeRoundedRect(15, 14, MISSION_PANEL_WIDTH - 30, MISSION_PANEL_TITLE_HEIGHT - 2, 4);

    frame.fillStyle(FANTASY_PANEL_COLORS.scanLine, 0.42);
    for (let y = 72; y < MISSION_PANEL_HEIGHT - 18; y += 14) {
      frame.fillRect(24, y, MISSION_PANEL_WIDTH - 48, 1);
    }
    frame.fillStyle(FANTASY_PANEL_COLORS.goldDetail, 0.18);
    frame.fillCircle(48, 108, 38);
    frame.lineStyle(2, 0xe0ae58, 0.64);
    frame.strokeCircle(48, 108, 28);
    frame.lineStyle(2, 0x5b4522, 0.75);
    frame.strokeCircle(48, 108, 21);

    const iconCore = this.add.circle(48, 108, 12, 0x50c878, 0.95);
    iconCore.setStrokeStyle(3, 0xf0cc6b, 0.9);
    const iconSpark = this.add.star(48, 108, 5, 4, 11, 0xf5e8b8, 0.72);

    this.missionPanelTitle = this.add.text(MISSION_PANEL_WIDTH / 2, 37, "", {
      fontFamily: "Georgia",
      fontSize: "21px",
      fontStyle: "bold",
      color: "#f2c45d",
      stroke: "#24170a",
      strokeThickness: 4,
      align: "center",
      wordWrap: { width: MISSION_PANEL_WIDTH - 42, useAdvancedWrap: true }
    });
    this.missionPanelTitle.setOrigin(0.5);
    this.missionPanelTitle.setShadow(0, 2, "#000000", 5, true, true);

    const bodyStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#f5f0df",
      stroke: "#0a0806",
      strokeThickness: 3,
      lineSpacing: 4,
      align: "left"
    };

    const bodyX = 88;
    const bodyY = 82;
    const bodyMaxWidth = MISSION_PANEL_WIDTH - bodyX - 24;
    this.missionPanelLine1 = this.add.text(bodyX, bodyY, "", {
      ...bodyStyle,
      wordWrap: { width: bodyMaxWidth, useAdvancedWrap: true }
    });
    this.missionPanelLine1.setFixedSize(bodyMaxWidth, 34);

    this.missionPanelLine2 = this.add.text(bodyX, bodyY + 39, "", {
      ...bodyStyle,
      color: "#4dff8c",
      wordWrap: { width: bodyMaxWidth, useAdvancedWrap: true }
    });
    this.missionPanelLine2.setFixedSize(bodyMaxWidth, 56);

    this.missionPanelContainer = this.add.container(0, 0, [
      frame,
      iconCore,
      iconSpark,
      this.missionPanelTitle,
      this.missionPanelLine1,
      this.missionPanelLine2
    ]);
    this.missionPanelContainer.setDepth(19);

    this.tweens.add({
      targets: iconSpark,
      angle: 360,
      alpha: 0.95,
      duration: 3600,
      repeat: -1,
      ease: "Sine.InOut"
    });
    this.tweens.add({
      targets: iconCore,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });
  }

  private updateMissionPanel(): void {
    const copy = MISSION_PANEL_COPY[this.currentSubLevel];
    this.missionPanelContainer?.setVisible(Boolean(copy));
    if (!copy) {
      return;
    }

    this.missionPanelTitle?.setText(copy.title);
    this.missionPanelLine1?.setText(copy.line1);
    this.missionPanelLine2?.setText(copy.line2);
  }

  private updateAuxiliaryTextVisibility(): void {
    this.subtitleText?.setVisible(false);
    this.resultText?.setVisible(false);
  }

  private createPhaseElements(): void {
    PHASE_ELEMENT_CONFIGS.forEach((config) => {
      this.createPhaseElementFromConfig(config);
    });
  }

  private createPhaseElementFromConfig(
    config: PhaseElementConfig,
    initialAlpha = 1
  ): Phaser.GameObjects.Image {
    const image = this.add
      .image(config.x, config.y, config.textureKey)
      .setDepth(config.depth ?? -5)
      .setOrigin(0, 0)
      .setAlpha(initialAlpha);
    image.setAngle(config.angle ?? 0);
    this.phaseBackgroundLayers.push(image);

    image.setData("output", config.output);
    image.setData("restoreTextureKey", config.restoreTextureKey);
    image.setData("elementId", config.id);

    this.phaseElements.set(config.id, {
      id: config.id,
      anchorX: 0,
      anchorY: 0,
      image
    });

    return image;
  }

  private getOutputLabel(output: string): string {
    if (this.currentSubLevel === 8) {
      switch (output) {
        case "Flores":
          return "Matriz Central";
        case "Solo":
          return "Fluxo Primario";
        case "Arvores":
          return "Nucleo Quantico";
        default:
          return output;
      }
    }

    if (this.currentSubLevel === 7) {
      switch (output) {
        case "Flores":
          return "Firewall Natural";
        case "Solo":
          return "Codigo da Cascata";
        case "Arvores":
          return "Coracao do Ecossistema";
        default:
          return output;
      }
    }

    if (this.currentSubLevel === 6) {
      switch (output) {
        case "Flores":
          return "Cristal Central";
        case "Solo":
          return "Rede de Energia";
        case "Arvores":
          return "Orb da Cascata";
        default:
          return output;
      }
    }

    if (this.currentSubLevel === 5) {
      switch (output) {
        case "Flores":
          return "Condutores";
        case "Solo":
          return "Portais";
        case "Arvores":
          return "Distribuidores";
        default:
          return output;
      }
    }

    if (this.currentSubLevel === 3) {
      switch (output) {
        case "Flores":
          return "Canais";
        case "Solo":
          return "Raízes Digitais";
        case "Arvores":
          return "Purificadores";
        default:
          return output;
      }
    }

    if (this.currentSubLevel === 4) {
      switch (output) {
        case "Flores":
          return "Geradores";
        case "Solo":
          return "Bombas";
        case "Arvores":
          return "Rochas Energéticas";
        default:
          return output;
      }
    }

    if (this.currentSubLevel === 2) {
      switch (output) {
        case "Flores":
          return "Sensores";
        case "Solo":
          return "Reservatórios";
        case "Arvores":
          return "Turbinas";
        default:
          return output;
      }
    }

    return output;
  }

  private showCascataOverlay(textureKey = this.getCurrentCascataTextureKey()): void {
    if (this.cascataOverlay) {
      const nextTextureKey =
        textureKey !== this.getCurrentCascataTextureKey()
          ? textureKey
          : this.currentSubLevel === 2
            ? CASCATA_FASE_02_KEY
            : textureKey;

      if (this.cascataOverlay.texture.key === nextTextureKey) {
        this.cascataOverlay.setDepth(this.getCascataOverlayDepth(nextTextureKey));
        return;
      }

      this.transitionImageTexture(
        this.cascataOverlay,
        nextTextureKey,
        () => {
          this.cascataOverlay
            ?.setOrigin(0, 0)
            .setDepth(this.getCascataOverlayDepth(nextTextureKey))
            .setPosition(0, 0)
            .setScale(1)
            .clearTint();
        },
        820
      );
      return;
    }

    const overlay = this.add
      .image(0, 0, textureKey)
      .setOrigin(0, 0)
      .setDepth(this.getCascataOverlayDepth(textureKey))
      .setAlpha(0);
    this.cascataOverlay = overlay;
    this.phaseBackgroundLayers.push(overlay);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 820,
      ease: "Sine.Out"
    });
  }

  private getCurrentCascataTextureKey(): string {
    if (this.currentSubLevel >= 5) {
      return CASCATA_FASE_04_KEY;
    }

    if (this.currentSubLevel >= 3) {
      return CASCATA_FASE_02_KEY;
    }

    if (this.currentSubLevel === 2) {
      return CASCATA_FASE_02_KEY;
    }

    return CASCATA_KEY;
  }

  private setCascataOverlayTexture(textureKey: string): void {
    if (textureKey === CASCATA_FASE_04_KEY && this.cascataOverlay) {
      this.tweens.killTweensOf(this.cascataOverlay);
      this.cascataOverlay
        .setTexture(textureKey)
        .setPosition(0, 0)
        .setOrigin(0, 0)
        .setScale(1)
        .setDepth(this.getCascataOverlayDepth(textureKey))
        .setAlpha(1)
        .setVisible(true)
        .clearTint();
      return;
    }

    this.showCascataOverlay(textureKey);
  }

  private getCascataOverlayDepth(textureKey: string): number {
    return textureKey === CASCATA_FASE_04_KEY ? CASCATA_FASE_04_OVERLAY_DEPTH : CASCATA_OVERLAY_DEPTH;
  }

  private fadeImageIn(image: Phaser.GameObjects.Image, duration = 720, targetAlpha = 1): void {
    this.tweens.killTweensOf(image);
    image.setAlpha(0);
    this.tweens.add({
      targets: image,
      alpha: targetAlpha,
      duration,
      ease: "Sine.Out"
    });
  }

  private transitionImageTexture(
    image: Phaser.GameObjects.Image,
    textureKey: string,
    applyLayout: () => void,
    duration = 720,
    targetAlpha = 1
  ): void {
    this.tweens.killTweensOf(image);
    this.tweens.add({
      targets: image,
      alpha: 0,
      duration: 180,
      ease: "Sine.In",
      onComplete: () => {
        if (!image.scene) {
          return;
        }

        image.setTexture(textureKey);
        applyLayout();
        this.fadeImageIn(image, duration, targetAlpha);
      }
    });
  }

  private createEcosystemHealthBar(): void {
    this.ecosystemHealthBackground = this.add.graphics();
    this.ecosystemHealthFill = this.add.graphics();
    this.ecosystemHealthText = this.add.text(0, 0, "0%", {
      fontFamily: "Arial",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#FFFFFF"
    });
    this.ecosystemHealthText.setOrigin(0.5);
    this.ecosystemHealthText.setStroke("#04130d", 6);
    this.ecosystemHealthText.setShadow(0, 2, "#7affcd", 10, true, true);
    this.redrawEcosystemHealthBar(0);
  }

  private createRobotIntroParticleTexture(): void {
    if (this.textures.exists(ROBOT_INTRO_PARTICLE_KEY)) {
      return;
    }

    const particle = this.add.graphics();
    particle.fillStyle(0xffffff, 1);
    particle.fillCircle(8, 8, 8);
    particle.generateTexture(ROBOT_INTRO_PARTICLE_KEY, 16, 16);
    particle.destroy();
  }

  private showRobotIntroduction(): void {
    const introConfig = ROBOT_INTRO_CONFIGS[this.currentSubLevel];
    if (!introConfig || this.hasSeenRobotIntroduction(introConfig.id)) {
      return;
    }

    this.isRobotIntroActive = true;
    this.activeRobotIntroId = introConfig.id;
    this.createRobotPresentation(introConfig);
  }

  private createRobotPresentation(config: RobotIntroConfig): void {
    this.clearRobotIntroduction();

    const isBuilderIntro = config.level === 1;
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2 - 96;
    const panelWidth = Math.min(this.scale.width - 180, 1120);
    const panelHeight = isBuilderIntro ? 610 : 540;
    const panelX = centerX - panelWidth / 2;
    const panelY = Phaser.Math.Clamp(centerY - 150, 48, Math.max(48, this.scale.height - panelHeight - 48));
    const closeButtonSize = 44;
    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x030512, 0);
    overlay.setOrigin(0, 0).setDepth(80).setScrollFactor(0);

    const vignette = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0);
    vignette.setOrigin(0, 0).setDepth(81).setScrollFactor(0);

    const glow = this.add.circle(centerX, centerY, 118, config.color, 0);
    glow.setDepth(82).setScrollFactor(0).setBlendMode(Phaser.BlendModes.ADD);

    const accentGlow = this.add.circle(centerX, centerY, 72, config.accentColor, 0);
    accentGlow.setDepth(83).setScrollFactor(0).setBlendMode(Phaser.BlendModes.ADD);

    const readabilityPanel = this.add.graphics();
    readabilityPanel.setDepth(83).setScrollFactor(0).setAlpha(0);
    readabilityPanel.fillStyle(0xf8fbff, 0.78);
    readabilityPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 26);
    readabilityPanel.lineStyle(2, config.accentColor, 0.32);
    readabilityPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 26);

    const robotY = isBuilderIntro ? panelY + 42 : panelY + 76;
    const robot = this.add.image(centerX, robotY, config.textureKey);
    robot.setDepth(84).setScrollFactor(0).setAlpha(0).setScale(isBuilderIntro ? 0.52 : this.getRobotIntroScale(config.level, "initial"));

    const nameText = this.add.text(centerX, isBuilderIntro ? panelY + 190 : panelY + 232, config.name, {
      fontFamily: "Georgia",
      fontSize: isBuilderIntro ? "44px" : "38px",
      fontStyle: "bold",
      color: isBuilderIntro ? "#102033" : "#102033",
      align: "center"
    });
    nameText.setOrigin(0.5).setDepth(85).setScrollFactor(0).setAlpha(0);
    nameText.setStroke("#ffffff", isBuilderIntro ? 5 : 4);
    nameText.setShadow(0, 0, "#7df7ff", isBuilderIntro ? 12 : 8, true, true);

    const textWidth = panelWidth - 130;
    const bodyText = this.add.text(
      centerX,
      isBuilderIntro ? panelY + 250 : panelY + 282,
      isBuilderIntro
        ? "O Buggie corrompeu os fluxos da Cascata de Dados."
        : this.getRobotIntroBodyText(config),
      {
        fontFamily: "Georgia",
        fontSize: isBuilderIntro ? "25px" : "24px",
        color: "#172033",
        align: "center",
        lineSpacing: isBuilderIntro ? 7 : 6,
        wordWrap: { width: textWidth }
      }
    );
    bodyText.setOrigin(0.5, 0).setDepth(85).setScrollFactor(0).setAlpha(0);
    bodyText.setStroke("#ffffff", 3);

    const highlightTexts: Phaser.GameObjects.Text[] = [];
    if (isBuilderIntro) {
      const hopeText = this.add.text(centerX, panelY + 314, "Mas ainda existe esperança.", {
        fontFamily: "Georgia",
        fontSize: "29px",
        fontStyle: "bold",
        color: "#0f4865",
        align: "center",
        wordWrap: { width: textWidth }
      });
      hopeText.setOrigin(0.5, 0).setDepth(85).setScrollFactor(0).setAlpha(0);
      hopeText.setStroke("#ffffff", 3);

      const restoreText = this.add.text(
        centerX,
        panelY + 362,
        "Cada conexão restaurada devolve vida ao mundo.\nCom lógica e energia, podemos reconstruir os ecossistemas digitais.",
        {
          fontFamily: "Georgia",
          fontSize: "24px",
          color: "#172033",
          align: "center",
          lineSpacing: 8,
          wordWrap: { width: textWidth }
        }
      );
      restoreText.setOrigin(0.5, 0).setDepth(85).setScrollFactor(0).setAlpha(0);
      restoreText.setStroke("#ffffff", 3);

      const buildText = this.add.text(centerX, panelY + 456, "Somar é o primeiro passo para construir.", {
        fontFamily: "Georgia",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#775115",
        align: "center",
        wordWrap: { width: textWidth }
      });
      buildText.setOrigin(0.5, 0).setDepth(85).setScrollFactor(0).setAlpha(0);
      buildText.setStroke("#ffffff", 3);

      highlightTexts.push(hopeText, restoreText, buildText);
    }

    const moduleText = this.add.text(centerX, panelY + panelHeight - (isBuilderIntro ? 58 : 54), config.moduleText, {
      fontFamily: "Georgia",
      fontSize: isBuilderIntro ? "32px" : "26px",
      fontStyle: "bold",
      color: isBuilderIntro ? "#0f4865" : "#0f4865",
      align: "center"
    });
    moduleText.setOrigin(0.5).setDepth(85).setScrollFactor(0).setAlpha(0);
    moduleText.setStroke("#ffffff", isBuilderIntro ? 5 : 4);
    moduleText.setShadow(0, 0, "#bff7ff", isBuilderIntro ? 16 : 12, true, true);

    const closeButton = this.add.graphics();
    closeButton.setDepth(86).setScrollFactor(0).setAlpha(0);
    closeButton.fillStyle(0x102033, 0.9);
    closeButton.fillCircle(panelX + panelWidth - 38, panelY + 38, closeButtonSize / 2);
    closeButton.lineStyle(2, 0xffffff, 0.82);
    closeButton.strokeCircle(panelX + panelWidth - 38, panelY + 38, closeButtonSize / 2);

    const closeIcon = this.add.text(panelX + panelWidth - 38, panelY + 38, "X", {
      fontFamily: "Arial",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#ffffff"
    });
    closeIcon.setOrigin(0.5).setDepth(87).setScrollFactor(0).setAlpha(0);

    const closeZone = this.add.zone(panelX + panelWidth - 38, panelY + 38, closeButtonSize + 16, closeButtonSize + 16);
    closeZone.setDepth(88).setScrollFactor(0).setInteractive({ useHandCursor: true });
    closeZone.on("pointerdown", () => {
      if (!this.isRobotIntroActive) {
        return;
      }
      this.startGameplay();
    });

    this.robotIntroObjects.push(overlay, vignette, glow, accentGlow, readabilityPanel, robot, nameText, bodyText, ...highlightTexts, moduleText, closeButton, closeIcon, closeZone);
    this.playRobotEffects(config, { overlay, vignette, glow, accentGlow, readabilityPanel, robot, nameText, bodyText, highlightTexts, moduleText, closeButton, closeIcon });
  }

  private playRobotEffects(
    config: RobotIntroConfig,
    objects: {
      overlay: Phaser.GameObjects.Rectangle;
      vignette: Phaser.GameObjects.Rectangle;
      glow: Phaser.GameObjects.Arc;
      accentGlow: Phaser.GameObjects.Arc;
      readabilityPanel: Phaser.GameObjects.Graphics;
      robot: Phaser.GameObjects.Image;
      nameText: Phaser.GameObjects.Text;
      bodyText: Phaser.GameObjects.Text;
      highlightTexts: Phaser.GameObjects.Text[];
      moduleText: Phaser.GameObjects.Text;
      closeButton: Phaser.GameObjects.Graphics;
      closeIcon: Phaser.GameObjects.Text;
    }
  ): void {
    this.tweens.add({ targets: this.cameras.main, zoom: 1.035, duration: 900, ease: "Sine.InOut", yoyo: true });
    this.tweens.add({ targets: objects.overlay, alpha: 0.58, duration: 520, ease: "Sine.Out" });
    this.tweens.add({ targets: objects.vignette, alpha: 0.2, duration: 700, ease: "Sine.Out" });
    this.tweens.add({ targets: objects.readabilityPanel, alpha: 1, duration: 640, ease: "Sine.Out" });

    const particles = this.add.particles(this.scale.width / 2, this.scale.height / 2, ROBOT_INTRO_PARTICLE_KEY, {
      x: { min: -260, max: 260 },
      y: { min: -220, max: 220 },
      speedX: { min: -24, max: 24 },
      speedY: { min: -46, max: -12 },
      lifespan: { min: 1400, max: 3000 },
      quantity: config.level === 1 ? 3 : 2,
      frequency: 55,
      alpha: { start: 0.58, end: 0 },
      scale: { start: 0.5, end: 0.08 },
      tint: [config.color, config.accentColor, 0xffffff],
      blendMode: Phaser.BlendModes.ADD,
      stopAfter: 78
    });
    particles.setDepth(83).setScrollFactor(0);
    this.robotIntroObjects.push(particles);

    this.createRobotIntroEnergyLines(config);

    this.tweens.add({
      targets: [objects.glow, objects.accentGlow],
      alpha: { from: 0, to: config.level === 1 ? 0.46 : 0.36 },
      scaleX: { from: 0.7, to: 1.18 },
      scaleY: { from: 0.7, to: 1.18 },
      duration: 1000,
      ease: "Sine.Out"
    });

    this.tweens.add({
      targets: objects.glow,
      alpha: { from: config.level === 1 ? 0.42 : 0.32, to: 0.18 },
      scaleX: { from: 1.08, to: 1.34 },
      scaleY: { from: 1.08, to: 1.34 },
      duration: 1300,
      yoyo: true,
      repeat: 1,
      ease: "Sine.InOut",
      delay: 900
    });

    this.tweens.add({
      targets: objects.robot,
      alpha: 1,
      scaleX: config.level === 1 ? 0.66 : this.getRobotIntroScale(config.level, "target"),
      scaleY: config.level === 1 ? 0.66 : this.getRobotIntroScale(config.level, "target"),
      y: objects.robot.y - (config.level === 1 ? 14 : 10),
      duration: 980,
      ease: "Back.Out"
    });

    this.tweens.add({
      targets: objects.robot,
      y: config.level === 1 ? "-=6" : "-=5",
      angle: config.level === 4 ? 2 : 1.2,
      duration: 1450,
      yoyo: true,
      repeat: 2,
      ease: "Sine.InOut",
      delay: 850
    });

    this.time.delayedCall(820, () => {
      this.tweens.add({ targets: objects.nameText, alpha: 1, scaleX: { from: 0.96, to: 1 }, scaleY: { from: 0.96, to: 1 }, duration: 520, ease: "Sine.Out" });
    });

    this.time.delayedCall(1300, () => {
      this.tweens.add({ targets: objects.bodyText, alpha: 1, y: objects.bodyText.y - 8, duration: 620, ease: "Sine.Out" });
    });

    if (objects.highlightTexts.length > 0) {
      objects.highlightTexts.forEach((text, index) => {
        this.time.delayedCall(1650 + index * 260, () => {
          this.tweens.add({ targets: text, alpha: 1, y: text.y - 8, duration: 620, ease: "Sine.Out" });
        });
      });
    }

    this.time.delayedCall(config.level === 1 ? 3300 : 2600, () => {
      this.tweens.add({ targets: objects.moduleText, alpha: 1, scaleX: { from: 0.96, to: 1 }, scaleY: { from: 0.96, to: 1 }, duration: 540, ease: "Sine.Out" });
    });

    this.time.delayedCall(1550, () => {
      this.tweens.add({ targets: [objects.closeButton, objects.closeIcon], alpha: 1, duration: 420, ease: "Sine.Out" });
    });
  }

  private getRobotIntroScale(level: number, state: "initial" | "target"): number {
    if (level === 4) {
      return state === "initial" ? 0.34 : 0.42;
    }

    if (level === 5) {
      return state === "initial" ? 0.32 : 0.4;
    }

    return state === "initial" ? 0.34 : 0.42;
  }

  private startGameplay(): void {
    if (!this.isRobotIntroActive) {
      return;
    }

    this.isRobotIntroActive = false;
    const objects = [...this.robotIntroObjects];
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1,
      duration: 360,
      ease: "Sine.InOut"
    });
    this.tweens.add({
      targets: objects,
      alpha: 0,
      duration: 520,
      ease: "Sine.InOut",
      onComplete: () => {
        if (this.activeRobotIntroId) {
          this.markRobotIntroductionAsSeen(this.activeRobotIntroId);
          this.activeRobotIntroId = undefined;
        }
        this.clearRobotIntroduction();
        this.isRobotIntroActive = false;
      }
    });
  }

  private createRobotIntroEnergyLines(config: RobotIntroConfig): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2 - 58;
    const lineCount = config.level === 5 ? 5 : config.level === 4 ? 6 : 4;

    Array.from({ length: lineCount }).forEach((_, index) => {
      const angle = (Math.PI * 2 * index) / lineCount;
      const radius = config.level === 5 ? 164 : 138;
      const line = this.add.graphics().setDepth(83).setScrollFactor(0).setAlpha(0);
      line.lineStyle(2, index % 2 === 0 ? config.color : config.accentColor, 0.32);
      line.beginPath();
      line.moveTo(centerX + Math.cos(angle) * 54, centerY + Math.sin(angle) * 42);
      line.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius * 0.68);
      line.strokePath();
      line.setBlendMode(Phaser.BlendModes.ADD);
      this.robotIntroObjects.push(line);
      this.tweens.add({ targets: line, alpha: { from: 0, to: 0.46 }, duration: 520, yoyo: true, repeat: config.level === 4 ? 2 : 1, ease: "Sine.InOut", delay: 420 + index * 90 });
    });
  }

  private getRobotIntroBodyText(config: RobotIntroConfig): string {
    const sections = config.specialOpening ? [...config.specialOpening, ...config.lines] : config.lines;
    return sections.join("\n");
  }

  private clearRobotIntroduction(): void {
    this.robotIntroObjects.forEach((object) => {
      if (object.scene) {
        this.tweens.killTweensOf(object);
        object.destroy();
      }
    });
    this.robotIntroObjects = [];
  }

  private hasSeenRobotIntroduction(robotId: string): boolean {
    if (this.shouldAlwaysShowRobotIntroductions()) {
      return false;
    }

    try {
      const rawValue = window.localStorage.getItem(ROBOT_INTRO_STORAGE_KEY);
      if (!rawValue) {
        return false;
      }
      const seenIds = JSON.parse(rawValue) as string[];
      return Array.isArray(seenIds) && seenIds.includes(robotId);
    } catch {
      return false;
    }
  }

  private markRobotIntroductionAsSeen(robotId: string): void {
    if (this.shouldAlwaysShowRobotIntroductions()) {
      return;
    }

    try {
      const rawValue = window.localStorage.getItem(ROBOT_INTRO_STORAGE_KEY);
      const seenIds = rawValue ? (JSON.parse(rawValue) as string[]) : [];
      const nextSeenIds = Array.isArray(seenIds) ? seenIds : [];
      if (!nextSeenIds.includes(robotId)) {
        nextSeenIds.push(robotId);
      }
      window.localStorage.setItem(ROBOT_INTRO_STORAGE_KEY, JSON.stringify(nextSeenIds));
    } catch {
      // Se o navegador bloquear storage, a apresentação não interrompe o jogo.
    }
  }

  private shouldAlwaysShowRobotIntroductions(): boolean {
    return ["localhost", "127.0.0.1"].includes(window.location.hostname);
  }

  private createEnergyPanel(): void {
    this.energyPanelFrame = this.add.graphics();
    this.energyPercentText = this.add.text(ENERGY_PANEL_WIDTH / 2, 86, "0%", {
      fontFamily: "Georgia",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#090604",
      strokeThickness: 3
    });
    this.energyPercentText.setOrigin(0.5);
    this.energyPercentText.setShadow(0, 0, "#72ff9a", 8, true, true);

    const title = this.add.text(ENERGY_PANEL_WIDTH / 2, 26, "ENERGIA", {
      fontFamily: "Georgia",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#f0c45c",
      stroke: "#241609",
      strokeThickness: 3
    });
    title.setOrigin(0.5);
    title.setShadow(0, 1, "#000000", 5, true, true);

    const clickLabel = this.add.text(ENERGY_PANEL_WIDTH / 2, 139, "Cliques\ndisponiveis", {
      fontFamily: "Georgia",
      fontSize: "13px",
      color: "#f4ecd4",
      stroke: "#0a0704",
      strokeThickness: 2,
      align: "center",
      lineSpacing: 2
    });
    clickLabel.setOrigin(0.5);

    this.energyClickBars = [];
    const bars: Phaser.GameObjects.Rectangle[] = [];
    const totalBarsWidth = 8 * ENERGY_BAR_WIDTH + 7 * ENERGY_BAR_GAP;
    const firstBarX = ENERGY_PANEL_WIDTH / 2 - totalBarsWidth / 2 + ENERGY_BAR_WIDTH / 2;
    for (let index = 0; index < 8; index += 1) {
      const bar = this.add
        .rectangle(firstBarX + index * (ENERGY_BAR_WIDTH + ENERGY_BAR_GAP), 174, ENERGY_BAR_WIDTH, ENERGY_BAR_HEIGHT, 0x13301d, 0.72)
        .setStrokeStyle(1, 0x346340, 0.95);
      bars.push(bar);
      this.energyClickBars.push(bar);
    }

    this.energyPanelContainer = this.add.container(0, 0, [
      this.energyPanelFrame,
      title,
      this.energyPercentText,
      clickLabel,
      ...bars
    ]);
    this.energyPanelContainer.setDepth(21);
    this.energyPanelContainer.setVisible(false);

    this.tweens.add({
      targets: this.energyPercentText,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });
  }

  private createRightPanel(): void {
    this.panelContainer = this.createRobotPanel();
    this.panelContainer.setScrollFactor(0).setDepth(10);

    this.createResetButton(this.getRobotPanelWidth() - 32, ROBOT_PANEL_HEIGHT - 30);
  }

  private createRobotPanel(): Phaser.GameObjects.Container {
    this.robotPanelFrame = this.add.graphics();
    this.robotPanelTitle = this.add.text(this.getRobotPanelWidth() / 2, 27, "Robôs Assistentes", {
      fontFamily: "Georgia",
      fontSize: "19px",
      fontStyle: "bold",
      color: "#f2c45d",
      stroke: "#24170a",
      strokeThickness: 4,
      align: "center"
    });
    this.robotPanelTitle.setOrigin(0.5);
    this.robotPanelTitle.setShadow(0, 2, "#000000", 5, true, true);

    const panel = this.add.container(0, 0, [this.robotPanelFrame, this.robotPanelTitle]);
    this.redrawRobotPanel();
    return panel;
  }

  private redrawRobotPanel(): void {
    if (!this.robotPanelFrame || !this.robotPanelTitle) {
      return;
    }

    const width = this.getRobotPanelWidth();
    const height = ROBOT_PANEL_HEIGHT;
    this.robotPanelFrame.clear();
    drawFantasyPanelFrame(this.robotPanelFrame, {
      width,
      height,
      glowColor: 0x56d7ff,
      glowAlpha: 0.14,
      accentBorderColor: 0x58b8c9
    });

    this.robotPanelFrame.fillStyle(FANTASY_PANEL_COLORS.titleSurface, 0.92);
    this.robotPanelFrame.fillRoundedRect(16, 13, width - 32, ROBOT_PANEL_TITLE_HEIGHT, 5);
    this.robotPanelFrame.lineStyle(2, FANTASY_PANEL_COLORS.titleBorder, 0.78);
    this.robotPanelFrame.strokeRoundedRect(17, 14, width - 34, ROBOT_PANEL_TITLE_HEIGHT - 2, 4);

    this.robotPanelFrame.fillStyle(FANTASY_PANEL_COLORS.scanLine, 0.35);
    for (let lineY = 56; lineY < height - 18; lineY += 15) {
      this.robotPanelFrame.fillRect(24, lineY, width - 48, 1);
    }

    this.robotPanelTitle.setPosition(width / 2, 27);
    this.robotResetButton?.setPosition(width - 32, ROBOT_PANEL_HEIGHT - 30);
    this.moveCounterText?.setPosition(width / 2, ROBOT_PANEL_HEIGHT - 12);
  }

  private getRobotPanelWidth(): number {
    const robotCount = Math.max(2, SUB_LEVELS[this.currentSubLevel]?.robotButtons.length ?? 1);
    const slotsWidth = robotCount * ROBOT_PANEL_SLOT_WIDTH + Math.max(0, robotCount - 1) * ROBOT_PANEL_SLOT_GAP;
    return ROBOT_PANEL_PADDING_X * 2 + slotsWidth + 44;
  }

  private getRobotButtonHomePosition(index: number): { x: number; y: number } {
    return {
      x: ROBOT_PANEL_PADDING_X + ROBOT_PANEL_SLOT_WIDTH / 2 + index * (ROBOT_PANEL_SLOT_WIDTH + ROBOT_PANEL_SLOT_GAP),
      y: ROBOT_PANEL_TITLE_HEIGHT + 54
    };
  }

  private createRobotSlot(index: number): Phaser.GameObjects.Graphics {
    const position = this.getRobotButtonHomePosition(index);
    const slot = this.add.graphics({ x: position.x, y: position.y });
    this.drawRobotSlot(slot);
    this.panelContainer.add(slot);
    this.panelDynamicObjects.push(slot);
    return slot;
  }

  private drawRobotSlot(slot: Phaser.GameObjects.Graphics, active = false): void {
    const width = ROBOT_PANEL_SLOT_WIDTH;
    const height = ROBOT_PANEL_SLOT_HEIGHT;
    const left = -width / 2;
    const top = -height / 2;
    slot.clear();
    slot.fillStyle(0x56d7ff, active ? 0.18 : 0.08);
    slot.fillRoundedRect(left - 4, top - 4, width + 8, height + 8, 9);
    slot.fillStyle(0x17130f, active ? 0.86 : 0.72);
    slot.fillRoundedRect(left, top, width, height, 7);
    slot.lineStyle(2, active ? 0x73f7ff : 0x58b8c9, active ? 0.92 : 0.42);
    slot.strokeRoundedRect(left + 3, top + 3, width - 6, height - 6, 6);
    slot.fillStyle(0xd2a24a, active ? 0.18 : 0.1);
    slot.fillCircle(0, 0, 22);
    slot.lineStyle(1, 0x58b8c9, active ? 0.72 : 0.38);
    slot.strokeCircle(0, 0, 28);
  }

  private getRobotButtonCaption(operation: TipoDeOperacaoDaCascata, value: number): string {
    if (isCascataMultiplicationOperation(operation)) {
      return `x${value}`;
    }

    if (isCascataDivisionOperation(operation)) {
      return `/${value}`;
    }

    return value > 0 ? `+${value}` : String(value);
  }

  private createFooterMessage(): void {
    this.resultText = this.add.text(0, 0, "", {
      fontFamily: "Georgia",
      fontSize: "13px",
      color: "#fff2d6",
      stroke: "#352212",
      strokeThickness: 2
    });
    this.resultText.setDepth(20);
  }

  private createNextButton(): void {
    this.nextButton = this.add.image(0, 0, NEXT_BUTTON_KEY).setScale(0.2).setDepth(25).setAlpha(0);
    this.nextButton.setVisible(false);
    this.nextButton.setInteractive({ useHandCursor: true });
    this.nextButton.on("pointerdown", () => {
      if (this.isRobotIntroActive) {
        return;
      }

      if (this.currentSubLevel === 1) {
        this.setupLevel(2, { preservePhaseVisuals: true });
        return;
      }

      if (this.currentSubLevel === 2) {
        this.setupLevel(3, { preservePhaseVisuals: true });
        return;
      }

      if (this.currentSubLevel === 3) {
        this.setupLevel(4, { preservePhaseVisuals: true });
        return;
      }

      if (this.currentSubLevel === 4) {
        this.setupLevel(5, { preservePhaseVisuals: true });
        return;
      }

      if (this.currentSubLevel === 5) {
        this.setupLevel(6, { preservePhaseVisuals: true });
        return;
      }

      if (this.currentSubLevel === 6) {
        this.setupLevel(7, { preservePhaseVisuals: true });
        return;
      }

      if (this.currentSubLevel === 7) {
        this.setupLevel(8, { preservePhaseVisuals: true });
        return;
      }

      this.scene.start("GameScene", { levelId: "level-02" });
    });
    this.nextButton.disableInteractive();
  }

  private createHomeButton(): void {
    this.homeButton = this.add.image(0, 0, HOME_BUTTON_KEY).setScale(0.16).setDepth(25);
    this.homeButton.setScrollFactor(0);
    this.homeButton.setInteractive({ useHandCursor: true });
    this.homeButton.on("pointerdown", () => {
      if (this.isRobotIntroActive) {
        return;
      }
      this.scene.start("WorldMapScene");
    });
  }

  private createGoalPanel(x: number, y: number): Phaser.GameObjects.Graphics {
    const panel = this.add.graphics({ x, y });
    panel.setDepth(1);
    this.drawGoalPanel(panel);
    return panel;
  }

  private drawGoalPanel(
    panel: Phaser.GameObjects.Graphics,
    accentColor = 0xb7832f,
    glowColor = 0x50c878,
    complete = false
  ): void {
    const width = SLOT_PLAQUE_WIDTH;
    const height = SLOT_PLAQUE_HEIGHT;
    const left = -width / 2;
    const top = -height / 2;

    panel.clear();
    drawFantasyPanelFrame(panel, {
      x: left,
      y: top,
      width,
      height,
      glowColor,
      glowAlpha: complete ? 0.2 : 0.12,
      accentBorderColor: accentColor
    });

    panel.fillStyle(FANTASY_PANEL_COLORS.titleSurface, 0.92);
    panel.fillRoundedRect(left + 15, top + 13, width - 30, 34, 5);
    panel.lineStyle(2, FANTASY_PANEL_COLORS.titleBorder, 0.78);
    panel.strokeRoundedRect(left + 16, top + 14, width - 32, 32, 4);

    panel.fillStyle(FANTASY_PANEL_COLORS.scanLine, 0.42);
    for (let lineY = top + 56; lineY < top + height - 20; lineY += 15) {
      panel.fillRect(left + 24, lineY, width - 48, 1);
    }

    panel.fillStyle(FANTASY_PANEL_COLORS.goldDetail, complete ? 0.26 : 0.16);
    panel.fillCircle(left + 34, top + 28, 10);
    panel.fillCircle(left + width - 34, top + 28, 10);
    panel.lineStyle(2, accentColor, 0.64);
    panel.strokeCircle(left + 34, top + 28, 14);
    panel.strokeCircle(left + width - 34, top + 28, 14);

    panel.fillStyle(glowColor, complete ? 0.22 : 0.1);
    panel.fillCircle(0, top + 85, 32);
    panel.lineStyle(2, accentColor, 0.48);
    panel.strokeCircle(0, top + 85, 24);
  }

  private createSlotZones(): void {
    this.slotLayoutBaseWidth = this.scale.width;
    this.slotLayoutBaseHeight = this.scale.height;

    const metas = biomaStoreApi.getState().metas;
    WATER_SLOTS.forEach((slot, index) => {
      const meta = metas[index];
      if (!meta) {
        return;
      }

      const plaquePosition = PLAQUE_POSITIONS[index] ?? { x: slot.x, y: slot.y };
      const slotX = plaquePosition.x;
      const slotY = plaquePosition.y;

      const zone = this.add
        .zone(slotX, slotY, SLOT_ZONE_WIDTH, SLOT_ZONE_HEIGHT)
        .setRectangleDropZone(SLOT_ZONE_WIDTH, SLOT_ZONE_HEIGHT);
      zone.setData("slotId", slot.id);
      zone.setDepth(3);

      const plaque = this.createGoalPanel(slotX, slotY);

      const valueText = this.add.text(slotX, slotY + SLOT_VALUE_OFFSET_Y, `${meta.initial}`, {
        fontFamily: "Georgia",
        fontSize: "36px",
        fontStyle: "bold",
        color: "#fff5d8",
        stroke: "#24170a",
        strokeThickness: 4
      });
      valueText.setOrigin(0.5);
      valueText.setDepth(4);

      const meterBackground = this.add
        .rectangle(slotX, slotY + SLOT_METER_OFFSET_Y, SLOT_METER_WIDTH, SLOT_METER_HEIGHT, 0x17130f, 0.82)
        .setOrigin(0.5)
        .setDepth(3);
      meterBackground.setStrokeStyle(2, 0xb7832f, 0.75);

      const meterFill = this.add
        .rectangle(slotX - SLOT_METER_FILL_WIDTH / 2, slotY + SLOT_METER_OFFSET_Y, 0, SLOT_METER_FILL_HEIGHT, 0x76ff03, 1)
        .setOrigin(0, 0.5)
        .setDepth(4);

      const progressText = this.add.text(slotX, slotY + SLOT_PROGRESS_OFFSET_Y, `${meta.initial}/${meta.goal}`, {
        fontFamily: "Georgia",
        fontSize: "20px",
        color: "#f5f0df",
        stroke: "#0a0806",
        strokeThickness: 3
      });
      progressText.setOrigin(0.5);
      progressText.setDepth(4);

      const labelText = this.add.text(slotX, slotY + SLOT_LABEL_OFFSET_Y, this.getOutputLabel(meta.output), {
        fontFamily: "Georgia",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#f2c45d",
        stroke: "#24170a",
        strokeThickness: 4
      });
      labelText.setOrigin(0.5);
      labelText.setDepth(4);

      this.slotViews.set(slot.id, {
        slot: { ...slot, x: slotX, y: slotY },
        output: meta.output,
        anchorX: this.slotLayoutBaseWidth > 0 ? slotX / this.slotLayoutBaseWidth : 0,
        anchorY: this.slotLayoutBaseHeight > 0 ? slotY / this.slotLayoutBaseHeight : 0,
        zone,
        plaque,
        valueText,
        progressText,
        meterBackground,
        meterFill,
        labelText
      });

      this.slotObjects.push(zone, plaque, valueText, progressText, meterBackground, meterFill, labelText);
    });
  }

  private createRobotButton(
    operation: TipoDeOperacaoDaCascata,
    localX: number,
    localY: number,
    textureKey: string,
    value?: number
  ): void {
    const buttonValue = value ?? this.getDefaultOperationValue(operation);
    const buttonIndex = this.robotButtons.size;
    const homePosition = this.getRobotButtonHomePosition(buttonIndex);
    const slotFrame = this.createRobotSlot(buttonIndex);
    localX = homePosition.x;
    localY = homePosition.y - 4;
    const buttonId = `${operation}-${buttonValue}-${localX}-${localY}`;
    const sprite = this.add.image(localX, localY, textureKey);
    this.setRobotButtonVisualSize(sprite, ROBOT_PANEL_ICON_SIZE);
    sprite.setData("panelButton", true);
    sprite.setData("slotFrame", slotFrame);
    sprite.setData("buttonId", buttonId);
    sprite.setData("operation", operation);
    sprite.setData("operationValue", buttonValue);
    sprite.setData("homeX", localX);
    sprite.setData("homeY", localY);
    sprite.setInteractive({ useHandCursor: true, draggable: true });

    const caption = this.add.text(localX, localY + 44, this.getRobotButtonCaption(operation, buttonValue), {
      fontFamily: "Georgia",
      fontSize: "40px",
      color: "#f2c45d",
      stroke: "#24170a",
      strokeThickness: 3,
      align: "center"
    });
    caption.setOrigin(0.5);

    this.panelContainer.add([sprite, caption]);
    this.input.setDraggable(sprite);
    this.robotButtons.set(buttonId, { id: buttonId, operation, value: buttonValue, sprite, label: caption, homeX: localX, homeY: localY });
    this.panelDynamicObjects.push(sprite, caption);

    if (this.currentSubLevel >= 3) {
      sprite.setTint(this.currentSubLevel === 4 ? 0xffdf74 : 0xd7fbff);
      this.tweens.add({
        targets: sprite,
        angle: this.currentSubLevel === 4 ? "+=3" : "+=4",
        duration: 1600,
        ease: "Sine.InOut",
        yoyo: true,
        repeat: -1
      });
    } else {
      this.tweens.add({
        targets: sprite,
        angle: "+=2",
        duration: 1500,
        ease: "Sine.InOut",
        yoyo: true,
        repeat: -1
      });
    }

    this.redrawRobotPanel();
  }

  private setRobotButtonVisualSize(sprite: Phaser.GameObjects.Image, size: number): void {
    const textureSource = sprite.texture.getSourceImage() as { width?: number; height?: number };
    const sourceWidth = textureSource.width ?? size;
    const sourceHeight = textureSource.height ?? size;
    const ratio = sourceWidth > 0 && sourceHeight > 0 ? sourceWidth / sourceHeight : 1;

    if (ratio >= 1) {
      sprite.setDisplaySize(size, size / ratio);
      return;
    }

    sprite.setDisplaySize(size * ratio, size);
  }

  private clearDraggedRobotPreview(): void {
    if (!this.draggedRobotPreview) {
      return;
    }

    this.tweens.killTweensOf(this.draggedRobotPreview);
    this.draggedRobotPreview.destroy();
    this.draggedRobotPreview = undefined;
  }

  private createMoveCounter(): void {
    this.moveCounterText = undefined;
    this.updateMoveCounter();
  }

  private createResetButton(localX: number, localY: number): void {
    const resetButton = this.add.image(localX, localY, BACK_BUTTON_KEY).setScale(0.08);
    resetButton.setDepth(25);
    resetButton.setScrollFactor(0);
    resetButton.setInteractive({ useHandCursor: true });
    resetButton.on("pointerdown", () => {
      if (this.isRobotIntroActive) {
        return;
      }
      this.handleReset();
    });
    this.robotResetButton = resetButton;
    this.panelContainer.add(resetButton);
  }

  private installInputEvents(): void {
    this.input.on(
      Phaser.Input.Events.GAMEOBJECT_OVER,
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (this.isRobotIntroActive) {
        return;
      }
      if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
        return;
      }

      this.setRobotButtonVisualSize(gameObject, ROBOT_PANEL_ICON_HOVER_SIZE);
      gameObject.setTint(0xffffff);
      const slotFrame = gameObject.getData("slotFrame") as Phaser.GameObjects.Graphics | undefined;
      if (slotFrame) {
        this.drawRobotSlot(slotFrame, true);
      }
      }
    );

    this.input.on(
      Phaser.Input.Events.GAMEOBJECT_OUT,
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (this.isRobotIntroActive) {
        return;
      }
      if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
        return;
      }

      this.setRobotButtonVisualSize(gameObject, ROBOT_PANEL_ICON_SIZE);
      if (this.currentSubLevel >= 3) {
        gameObject.setTint(this.currentSubLevel === 4 ? 0xffdf74 : 0xd7fbff);
      } else {
        gameObject.clearTint();
      }
      const slotFrame = gameObject.getData("slotFrame") as Phaser.GameObjects.Graphics | undefined;
      if (slotFrame) {
        this.drawRobotSlot(slotFrame);
      }
      }
    );

    this.input.on(
      Phaser.Input.Events.GAMEOBJECT_DOWN,
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (this.isRobotIntroActive) {
          return;
        }
        if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
          return;
        }

        gameObject.setTint(0xffffff);
        this.setRobotButtonVisualSize(gameObject, ROBOT_PANEL_ICON_ACTIVE_SIZE);
        const slotFrame = gameObject.getData("slotFrame") as Phaser.GameObjects.Graphics | undefined;
        if (slotFrame) {
          this.drawRobotSlot(slotFrame, true);
        }
        this.resultText?.setText("Arrastando robô. Solte sobre uma nascente.");
      }
    );

    this.input.on(
      Phaser.Input.Events.DRAG_START,
      (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (this.isRobotIntroActive) {
          return;
        }
        if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
          return;
        }
        gameObject.setDepth(11);
        this.clearDraggedRobotPreview();
        this.draggedRobotPreview = this.add.image(pointer.worldX, pointer.worldY, gameObject.texture.key);
        this.setRobotButtonVisualSize(this.draggedRobotPreview, ROBOT_PANEL_ICON_ACTIVE_SIZE);
        this.draggedRobotPreview
          .setDepth(50)
          .setAlpha(0.9)
          .setTint(0xffffff);
      }
    );

    this.input.on(
      Phaser.Input.Events.DRAG,
      (
        pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        _dragX: number,
        _dragY: number
      ) => {
        if (this.isRobotIntroActive) {
          return;
        }
        if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
          return;
        }

        this.draggedRobotPreview?.setPosition(pointer.worldX, pointer.worldY);
        this.updatePredictionPreview(gameObject, pointer.worldX, pointer.worldY);
      }
    );

    this.input.on(
      Phaser.Input.Events.DROP,
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dropZone: Phaser.GameObjects.Zone
      ) => {
        if (this.isRobotIntroActive) {
          return;
        }
        if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
          return;
        }

        const operation = gameObject.getData("operation") as TipoDeOperacaoDaCascata;
        const operationValue = gameObject.getData("operationValue") as number | undefined;
        const slotId = dropZone.getData("slotId") as string;
        this.clearPredictionPreview();
        this.handleRobotDrop(operation, slotId, operationValue);
      }
    );

    this.input.on(
      Phaser.Input.Events.DRAG_END,
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dropped: boolean
      ) => {
        if (!(gameObject instanceof Phaser.GameObjects.Image) || !gameObject.getData("panelButton")) {
          return;
        }
        this.clearPredictionPreview();
        this.clearDraggedRobotPreview();

        const buttonId = gameObject.getData("buttonId") as string;
        const button = this.robotButtons.get(buttonId);
        if (!button) {
          return;
        }

        this.tweens.add({
          targets: gameObject,
          x: button.homeX,
          y: button.homeY,
          duration: dropped ? 120 : 180,
          ease: "Sine.Out",
          onComplete: () => {
            this.setRobotButtonVisualSize(gameObject, ROBOT_PANEL_ICON_SIZE);
            if (this.currentSubLevel >= 3) {
              gameObject.setTint(this.currentSubLevel === 4 ? 0xffdf74 : 0xd7fbff);
            } else {
              gameObject.clearTint();
            }
            const slotFrame = gameObject.getData("slotFrame") as Phaser.GameObjects.Graphics | undefined;
            if (slotFrame) {
              this.drawRobotSlot(slotFrame);
            }
            gameObject.setDepth(11);
            this.updateSequenceLocks();
          }
        });
      }
    );
  }

  private updatePredictionPreview(
    gameObject: Phaser.GameObjects.Image,
    worldX: number,
    worldY: number
  ): void {
    const config = SUB_LEVELS[this.currentSubLevel];
    if (!config?.operationRules?.previewBeforeDrop) {
      return;
    }

    const slotView = this.findSlotUnderPointer(worldX, worldY);
    if (!slotView) {
      this.clearPredictionPreview();
      return;
    }

    const targetMeta = biomaStoreApi.getState().metas.find((meta) => meta.output === slotView.output);
    if (!targetMeta) {
      this.clearPredictionPreview();
      return;
    }

    const operation = gameObject.getData("operation") as TipoDeOperacaoDaCascata;
    const operationValue = gameObject.getData("operationValue") as number | undefined;
    const numericValue = operationValue ?? this.getDefaultOperationValue(operation);
    const automationPreview = this.getAutomationPreviewValue(slotView.output, operation, targetMeta.current);
    if (automationPreview !== undefined) {
      this.showPredictionPreview(slotView, automationPreview, true);
      return;
    }

    if (config.automationMode) {
      this.showPredictionPreview(slotView, undefined, false);
      return;
    }

    const isDivision = isCascataDivisionOperation(operation);
    const validDivision = !isDivision || targetMeta.current % numericValue === 0;
    const previewValue = validDivision ? this.applyOperation(targetMeta.current, operation, operationValue) : NaN;
    const criticalMin = config.operationRules.criticalMin ?? Number.NEGATIVE_INFINITY;
    const criticalMax = config.operationRules.criticalMax ?? Number.POSITIVE_INFINITY;
    const valid = Number.isFinite(previewValue) && previewValue >= criticalMin && previewValue <= criticalMax;

    this.showPredictionPreview(slotView, valid ? previewValue : undefined, valid);
  }

  private findSlotUnderPointer(worldX: number, worldY: number): SlotView | undefined {
    return [...this.slotViews.values()].find((slotView) => slotView.zone.getBounds().contains(worldX, worldY));
  }

  private showPredictionPreview(slotView: SlotView, previewValue: number | undefined, valid: boolean): void {
    const text = valid && previewValue !== undefined ? `-> ${previewValue}` : "invalido";
    const color = valid ? "#b8fbff" : "#ffb4a8";
    const shadow = valid ? "#62e8ff" : "#ff3030";

    if (!this.predictionPreviewText) {
      this.predictionPreviewText = this.add.text(0, 0, text, {
        fontFamily: "Georgia",
        fontSize: "28px",
        fontStyle: "bold",
        color,
        stroke: "#070b13",
        strokeThickness: 5
      });
      this.predictionPreviewText.setOrigin(0.5);
      this.predictionPreviewText.setDepth(28);
    }

    this.predictionPreviewText
      .setPosition(slotView.slot.x, slotView.slot.y - SLOT_PLAQUE_HEIGHT / 2 - 22)
      .setText(text)
      .setColor(color)
      .setAlpha(1)
      .setVisible(true);
    this.predictionPreviewText.setShadow(0, 0, shadow, valid ? 14 : 10, true, true);
    this.drawGoalPanel(slotView.plaque, valid ? 0x7dd3fc : 0xff5c5c, valid ? 0x38d5ff : 0xff3030, valid);
    slotView.labelText.setShadow(0, 0, shadow, valid ? 12 : 8, true, true);
  }

  private clearPredictionPreview(): void {
    if (this.predictionPreviewText) {
      this.predictionPreviewText.destroy();
      this.predictionPreviewText = undefined;
    }

    if (SUB_LEVELS[this.currentSubLevel]?.operationRules?.previewBeforeDrop) {
      this.renderMetaValues(biomaStoreApi.getState().metas);
    }
  }

  private getAutomationPreviewValue(
    output: string,
    operation: TipoDeOperacaoDaCascata,
    currentValue: number
  ): number | undefined {
    if (!SUB_LEVELS[this.currentSubLevel]?.automationMode) {
      return undefined;
    }

    const sequence = this.getAutomationSequence(output, operation);
    if (!sequence) {
      return undefined;
    }

    return sequence.reduce((value, step) => this.applyOperation(value, step.operation, step.value), currentValue);
  }

  private getAutomationSequence(
    output: string,
    operation: TipoDeOperacaoDaCascata
  ): Array<{ operation: TipoDeOperacaoDaCascata; value: number }> | undefined {
    if (this.currentSubLevel !== 8) {
      return undefined;
    }

    const isDivision = isCascataDivisionOperation(operation);
    const isMultiply = isCascataMultiplicationOperation(operation);

    if (output === "Flores" && isDivision) {
      return [
        { operation: "division", value: 2 },
        { operation: "division", value: 2 }
      ];
    }

    if (output === "Solo" && isDivision) {
      return [
        { operation: "division", value: 2 },
        { operation: "division", value: 2 },
        { operation: "addition", value: 10 },
        { operation: "addition", value: 10 },
        { operation: "addition", value: 5 }
      ];
    }

    if (output === "Arvores" && isMultiply) {
      return [
        { operation: "multiply", value: 2 },
        { operation: "multiply", value: 2 },
        { operation: "addition", value: 10 },
        { operation: "addition", value: 10 },
        { operation: "addition", value: 5 }
      ];
    }

    return undefined;
  }

  private handleAutomationDrop(
    operation: TipoDeOperacaoDaCascata,
    slotView: SlotView,
    targetMeta: MetaDeBioma
  ): void {
    const sequence = this.getAutomationSequence(slotView.output, operation);
    if (!sequence) {
      this.failCurrentPhase("Sequência inválida: este módulo não otimiza esse sistema.", true);
      this.flashSlot(slotView, 0xff306f);
      this.playAudioPlaceholder(AUDIO_FINAL_WARNING_KEY);
      this.playDebugCoreFeedback(slotView, false);
      return;
    }

    const levelConfig = SUB_LEVELS[this.currentSubLevel];
    const nextValue = sequence.reduce((value, step) => this.applyOperation(value, step.operation, step.value), targetMeta.current);
    const criticalMin = levelConfig?.operationRules?.criticalMin ?? Number.NEGATIVE_INFINITY;
    const criticalMax = levelConfig?.operationRules?.criticalMax ?? Number.POSITIVE_INFINITY;
    if (nextValue < criticalMin || nextValue > criticalMax) {
      this.failCurrentPhase("Automação inválida: a sequência excedeu os limites seguros.", true);
      this.flashSlot(slotView, 0xff306f);
      this.playAudioPlaceholder(AUDIO_FINAL_WARNING_KEY);
      this.playDebugCoreFeedback(slotView, false);
      return;
    }

    const currentMetas = biomaStoreApi.getState().metas;
    const updatedOutputs: Record<string, number> = {};
    currentMetas.forEach((meta) => {
      updatedOutputs[meta.output] = meta.output === slotView.output ? nextValue : meta.current;
    });

    this.currentMoves += 1;
    this.updateMoveCounter();
    this.playAudioPlaceholder(AUDIO_AUTOMATION_EXECUTE_KEY);
    this.playAutomationSequenceFeedback(slotView, sequence.length);
    biomaStoreApi.getState().atualizarProgresso(updatedOutputs);

    const updatedMetas = biomaStoreApi.getState().metas;
    const venceu = updatedMetas.length > 0 && updatedMetas.every((meta: MetaDeBioma) => meta.current === meta.goal);
    if (this.maxMoves && this.currentMoves >= this.maxMoves && !venceu) {
      this.failCurrentPhase("Energia encerrada. Hora de revisar a estratégia.", true);
      this.playAudioPlaceholder(AUDIO_FINAL_WARNING_KEY);
    }
  }

  private handleRobotDrop(operation: TipoDeOperacaoDaCascata, slotId: string, operationValue?: number): void {
    if (this.phaseFailed || this.isRobotIntroActive) {
      return;
    }

    const slotView = this.slotViews.get(slotId);
    if (!slotView) {
      return;
    }

    const currentMetas = biomaStoreApi.getState().metas;
    const targetMeta = currentMetas.find((meta: MetaDeBioma) => meta.output === slotView.output);
    if (!targetMeta) {
      return;
    }

    if (SUB_LEVELS[this.currentSubLevel]?.automationMode) {
      this.handleAutomationDrop(operation, slotView, targetMeta);
      return;
    }

    if (this.currentSubLevel === 5) {
      this.handleComputationalFlowDrop(operation, operationValue);
      return;
    }

    if (!this.validateSequenceOperation(operation, slotView)) {
      return;
    }

    const levelConfig = SUB_LEVELS[this.currentSubLevel];
    const simultaneousDivision = this.currentSubLevel === 5 && operation === "division" && Boolean(levelConfig?.operationRules?.simultaneousDivision);
    const divisionValue = operationValue ?? this.getDefaultOperationValue(operation);
    const isDivision = isCascataDivisionOperation(operation);
    if (isDivision && (simultaneousDivision ? currentMetas.some((meta) => meta.current % divisionValue !== 0) : targetMeta.current % divisionValue !== 0)) {
      this.failCurrentPhase("Fluxo inválido: a divisão geraria energia fracionada.", true);
      this.flashSlot(slotView, 0xff5c5c);
      this.playAudioPlaceholder(this.currentSubLevel >= 6 ? AUDIO_PREDICTION_ERROR_KEY : AUDIO_ERROR_LIMIT_KEY);
      this.playComputationalFlowFeedback(slotView, false);
      this.playCentralSystemFeedback(slotView, false);
      this.playDebugCoreFeedback(slotView, false);
      return;
    }

    const nextValue = this.applyOperation(targetMeta.current, operation, operationValue);
    const criticalMin = levelConfig?.operationRules?.criticalMin ?? Number.NEGATIVE_INFINITY;
    const criticalMax = levelConfig?.operationRules?.criticalMax ?? Number.POSITIVE_INFINITY;
    if (this.currentSubLevel >= 6 && (nextValue < criticalMin || nextValue > criticalMax)) {
      this.failCurrentPhase(this.currentSubLevel === 7 ? "Corrupção crítica: a operação travou o núcleo lógico." : "Sequência inválida: previsão excede o limite seguro do Sistema Central.", true);
      this.flashSlot(slotView, 0xff5c5c);
      this.playAudioPlaceholder(this.currentSubLevel === 7 ? AUDIO_CORRUPTION_WARNING_KEY : AUDIO_PREDICTION_ERROR_KEY);
      this.playCentralSystemFeedback(slotView, false);
      this.playDebugCoreFeedback(slotView, false);
      return;
    }

    const isMovingPastGoal =
      (targetMeta.goal > targetMeta.current && nextValue > targetMeta.goal) ||
      (targetMeta.goal < targetMeta.current && nextValue < targetMeta.goal);

    if ((this.currentSubLevel === 3 || this.currentSubLevel === 4) && isMovingPastGoal) {
      this.failCurrentPhase(this.currentSubLevel === 4 ? "Sobrecarga energética. Sequência reiniciada." : "Limite excedido. Sincronização reiniciada.", true);
      this.flashSlot(slotView, 0xff5c5c);
      this.playAudioPlaceholder(this.currentSubLevel === 4 ? AUDIO_OVERLOAD_WARNING_KEY : AUDIO_ERROR_LIMIT_KEY);
      this.playSequenceInstability(slotView);
      return;
    }

    const updatedOutputs: Record<string, number> = {};
    
    currentMetas.forEach((m: MetaDeBioma) => {
      updatedOutputs[m.output] = simultaneousDivision
        ? this.applyOperation(m.current, operation, operationValue)
        : m.output === slotView.output
          ? nextValue
          : m.current;
    });

    this.playAudioPlaceholder(this.currentSubLevel >= 6 ? AUDIO_SEQUENCE_SELECT_KEY : operation === "division" ? AUDIO_DIVISION_CLICK_KEY : this.currentSubLevel === 4 ? AUDIO_ENERGY_CLICK_KEY : AUDIO_CLICK_MODULE_KEY);
    this.currentMoves += 1;
    if (this.currentSubLevel === 4 && !isCascataMultiplicationOperation(operation)) {
      this.stabilizingMovePlayed = true;
    }
    this.updateMoveCounter();
    this.updateSequenceLocks();
    this.playSequenceFeedback(slotView, operation);
    this.playComputationalFlowFeedback(slotView, simultaneousDivision);
    this.playCentralSystemFeedback(slotView, true);
    this.playDebugCoreFeedback(slotView, true);
    biomaStoreApi.getState().atualizarProgresso(updatedOutputs);

    const updatedMetas = biomaStoreApi.getState().metas;
    const venceu = updatedMetas.length > 0 && updatedMetas.every((meta: MetaDeBioma) => meta.current === meta.goal);
    if (this.maxMoves && this.currentMoves >= this.maxMoves && !venceu) {
      this.failCurrentPhase("Energia encerrada. Hora de revisar a estratégia.", true);
      this.playAudioPlaceholder(this.currentSubLevel === 7 ? AUDIO_CORRUPTION_WARNING_KEY : this.currentSubLevel === 6 ? AUDIO_PREDICTION_ERROR_KEY : this.currentSubLevel === 4 ? AUDIO_OVERLOAD_WARNING_KEY : AUDIO_ERROR_LIMIT_KEY);
    }
  }

  private handleComputationalFlowDrop(operation: TipoDeOperacaoDaCascata, operationValue?: number): void {
    const step = COMPUTATIONAL_FLOW_STEPS[this.computationalFlowStepIndex];
    if (!step) {
      return;
    }

    const currentMetas = biomaStoreApi.getState().metas;
    const value = operationValue ?? this.getDefaultOperationValue(operation);
    if (isCascataDivisionOperation(operation) && currentMetas.some((meta) => meta.current % value !== 0)) {
      this.registerComputationalFlowMiss("Fluxo inválido: a divisão geraria energia fracionada.");
      return;
    }

    const updatedOutputs: Record<string, number> = {};
    currentMetas.forEach((meta) => {
      updatedOutputs[meta.output] = this.applyOperation(meta.current, operation, operationValue);
    });

    const matchesStepGoals = currentMetas.every((meta) => updatedOutputs[meta.output] === step.goals[meta.output]);
    this.currentMoves += 1;
    this.updateMoveCounter();

    if (!matchesStepGoals) {
      this.playComputationalFlowAttempt(updatedOutputs, false);
      this.registerComputationalFlowMiss("Redistribuição instável. Recalibre o próximo ciclo.");
      return;
    }

    this.playAudioPlaceholder(isCascataDivisionOperation(operation) ? AUDIO_DIVISION_CLICK_KEY : AUDIO_ENERGY_FLOW_KEY);
    this.computationalFlowStepIndex += 1;
    this.activateComputationalFlowSystem(step.system);
    this.playComputationalFlowAttempt(updatedOutputs, true);
    this.resultText?.setColor("#bbf7d0");
    this.resultText?.setText(step.message);
    this.setComputationalFlowMetasForStep(this.computationalFlowStepIndex, updatedOutputs);
  }

  private setComputationalFlowMetasForStep(stepIndex: number, currentOutputs: Record<string, number>): void {
    const nextStep = COMPUTATIONAL_FLOW_STEPS[stepIndex];
    const nextMetas = biomaStoreApi.getState().metas.map((meta) => ({
      ...meta,
      initial: meta.initial,
      current: currentOutputs[meta.output] ?? meta.current,
      goal: nextStep?.goals[meta.output] ?? currentOutputs[meta.output] ?? meta.goal
    }));

    biomaStoreApi.setState({ metas: nextMetas });
  }

  private registerComputationalFlowMiss(message: string): void {
    this.resultText?.setColor("#ffcf70");
    this.resultText?.setText(message);
    this.playAudioPlaceholder(AUDIO_ERROR_LIMIT_KEY);

    if (this.maxMoves && this.currentMoves >= this.maxMoves) {
      this.failCurrentPhase("Energia encerrada. Hora de revisar o fluxo computacional.", true);
      this.playAudioPlaceholder(AUDIO_ERROR_LIMIT_KEY);
    }
  }

  private playComputationalFlowAttempt(updatedOutputs: Record<string, number>, valid: boolean): void {
    const color = valid ? 0x8cf8ff : 0xff5c5c;
    this.slotViews.forEach((slotView) => {
      this.flashSlot(slotView, color);
      this.createElectricParticles(slotView, valid ? 8 : 4, color);
    });

    const metas = biomaStoreApi.getState().metas;
    metas.forEach((meta) => {
      const fromSlot = [...this.slotViews.values()].find((slotView) => slotView.output === meta.output);
      if (!fromSlot) {
        return;
      }

      this.slotViews.forEach((targetSlot) => {
        if (targetSlot === fromSlot) {
          return;
        }

        this.createFlowParticle(fromSlot.slot.x, fromSlot.slot.y, targetSlot.slot.x, targetSlot.slot.y, color);
      });
    });

    if (!valid) {
      return;
    }

    const labels = Object.entries(updatedOutputs)
      .map(([output, value]) => `${this.getOutputLabel(output)} ${value}`)
      .join(" | ");
    this.resultText?.setText(labels);
  }

  private validateSequenceOperation(operation: TipoDeOperacaoDaCascata, slotView: SlotView): boolean {
    const config = SUB_LEVELS[this.currentSubLevel];
    if (!config) {
      return true;
    }

    const rules = config.sequenceRules;
    if (!rules) {
      return true;
    }

    const unlockAfterStabilizingMove = rules.unlockAfterStabilizingMove ?? [];
    const operationNeedsStabilization = unlockAfterStabilizingMove.includes(operation);
    if (!operationNeedsStabilization || this.stabilizingMovePlayed) {
      return true;
    }

    this.flashSlot(slotView, 0xff3030);
    this.playSequenceInstability(slotView);
    this.playAudioPlaceholder(AUDIO_OVERLOAD_WARNING_KEY);

    const isCritical = (rules.criticalInvalidOperations ?? []).includes(operation);
    if (isCritical) {
      this.failCurrentPhase("Sequência crítica: estabilize com +10 ou -10 antes de multiplicar.", true);
      return false;
    }

    this.resultText?.setColor("#ffcf70");
    this.resultText?.setText("Operação bloqueada: estabilize a cascata antes.");
    return false;
  }

  private checkWin(): void {
    if (this.phaseFailed) {
      return;
    }

    const metas = biomaStoreApi.getState().metas;
    const venceu = metas.length > 0 && metas.every((meta: MetaDeBioma) => meta.current === meta.goal);
    if (!venceu) {
      return;
    }

    this.playAudioPlaceholder(this.currentSubLevel >= 3 ? AUDIO_PHASE_COMPLETE_KEY : AUDIO_SUCCESS_SYNC_KEY);
    this.resultText?.setColor("#bbf7d0");
    this.resultText?.setText(
      this.currentSubLevel < 8
        ? `Subnível ${this.currentSubLevel} concluído. Preparando próxima sincronização...`
        : "Cascata restaurada. Retornando ao mapa..."
    );

    if (this.currentSubLevel === 1) {
      this.resultText?.setText("Subnível 1 concluído. Preparando Fluxo e Refluxo...");
      this.scheduleNextSubLevel(2, this.getPendingRestoreDuration() + 3000);
      return;
    }

    if (this.currentSubLevel === 2) {
      this.resultText?.setText("Subnível 2 concluído. Preparando Raízes Digitais...");
      this.scheduleNextSubLevel(3, this.getPendingRestoreDuration() + 3000);
      return;
    }

    if (this.currentSubLevel === 3) {
      this.resultText?.setText("Subnível 3 concluído. Preparando Sequência Instável...");
      this.scheduleNextSubLevel(4, this.getPendingRestoreDuration() + 3000);
      return;
    }

    if (this.currentSubLevel === 4) {
      this.resultText?.setText("Subnível 4 concluído. Preparando Fluxo Computacional...");
      this.scheduleNextSubLevel(5, this.getPendingRestoreDuration() + 3000);
      return;
    }

    if (this.currentSubLevel === 5) {
      this.resultText?.setText("Fluxo Computacional restaurado. Energia redistribuída pelo ecossistema...");
      this.playAudioPlaceholder(AUDIO_OPTIMIZATION_SUCCESS_KEY);
      this.revealCompleteComputationalFlow();
      this.scheduleNextSubLevel(6, this.getPendingRestoreDuration() + 6500);
      return;
    }

    if (this.currentSubLevel === 6) {
      this.resultText?.setText("Sistema Central restaurado. Preparando Nucleo do Buggie...");
      this.playAudioPlaceholder(AUDIO_CORE_RESTORE_KEY);
      this.scheduleNextSubLevel(7, this.getPendingRestoreDuration() + 3000);
      return;
    }

    if (this.currentSubLevel === 7) {
      this.resultText?.setText("Nucleo do Buggie depurado. Preparando Colapso da Cascata...");
      this.playAudioPlaceholder(AUDIO_DEBUG_SUCCESS_KEY);
      this.scheduleNextSubLevel(8, this.getPendingRestoreDuration() + 3000);
      return;
    }

    if (this.currentSubLevel === 8) {
      const idealMoves = SUB_LEVELS[this.currentSubLevel]?.optimizationRules?.idealMoves ?? this.currentMoves;
      this.resultText?.setText(
        this.currentMoves <= idealMoves
          ? "Sequência otimizada. Cascata totalmente restaurada."
          : "Cascata restaurada. Sistema estabilizado."
      );
      this.playFinalRestorationFeedback();
      this.playUltimateRestorationFeedback();
      this.playAudioPlaceholder(AUDIO_CORRUPTION_DESTROYED_KEY);
      this.playAudioPlaceholder(AUDIO_CASCADE_RESTORED_KEY);
      this.playAudioPlaceholder(AUDIO_ECOSYSTEM_RESTORED_KEY);
      this.playAudioPlaceholder(AUDIO_FINAL_VICTORY_KEY);
      this.markBiomeAsCompleted();
      this.scheduleReturnToWorldMap(this.getPendingRestoreDuration() + 5200);
    }
  }

  private markBiomeAsCompleted(): void {
    if (this.completionRecorded) {
      return;
    }

    const store = biomaStoreApi.getState();
    if (!store.biomasConcluidos.includes(this.biomeId)) {
      biomaStoreApi.getState().concluirRestauracao(this.biomeId);
    }

    this.completionRecorded = true;
  }

  private renderMetaValues(metas: MetaDeBioma[]): void {
    let desafiosConcluidos = 0;

    metas.forEach((meta: MetaDeBioma) => {
      const slotView = [...this.slotViews.values()].find((slot) => slot.output === meta.output);
      if (!slotView) {
        return;
      }

      const progresso = this.calcularProgresso(meta);
      const alvoConcluido = meta.current === meta.goal;

      slotView.valueText.setText(String(meta.current));
      slotView.progressText.setText(`${meta.current}/${meta.goal}`);
      slotView.valueText.setColor(alvoConcluido ? "#bbf7d0" : "#fff5cf");
      slotView.meterFill.width = SLOT_METER_FILL_WIDTH * progresso;
      slotView.meterFill.setFillStyle(alvoConcluido ? 0x86efac : 0x76ff03, 1);
      this.applyGoalPanelStyle(slotView, alvoConcluido);

      if (this.currentSubLevel === 3) {
        slotView.meterFill.setFillStyle(alvoConcluido ? 0x73f7ff : 0x56d7ff, 1);
        slotView.labelText.setShadow(0, 0, alvoConcluido ? "#6ff7ff" : "#1b8ea8", alvoConcluido ? 10 : 4, true, true);
      }

      if (this.currentSubLevel === 4) {
        slotView.meterFill.setFillStyle(alvoConcluido ? 0xffe08a : 0xffbd38, 1);
        slotView.labelText.setShadow(0, 0, alvoConcluido ? "#ffe08a" : "#9d5a00", alvoConcluido ? 12 : 5, true, true);
      }

      if (this.currentSubLevel === 5) {
        slotView.meterFill.setFillStyle(alvoConcluido ? 0x8cf8ff : 0x38d5ff, 1);
        slotView.labelText.setShadow(0, 0, alvoConcluido ? "#9ffbff" : "#1682aa", alvoConcluido ? 12 : 5, true, true);
        slotView.valueText.setShadow(0, 0, alvoConcluido ? "#7bf7ff" : "#1b8ea8", alvoConcluido ? 10 : 4, true, true);
      }

      if (alvoConcluido && this.currentSubLevel !== 5) {
        this.restoreTopic(meta.output);
        desafiosConcluidos += 1;
      }
    });

    if (this.currentSubLevel === 5) {
      desafiosConcluidos = this.computationalFlowStepIndex;
    }

    biomaStoreApi.getState().registrarMetasConcluidas(
      this.getCurrentLevelProgressId(),
      desafiosConcluidos,
      TOTAL_WORLD_TARGETS
    );
    this.redrawEcosystemHealthBar(this.getCurrentEcosystemHealth());
  }

  private calcularProgresso(meta: MetaDeBioma): number {
    const distanciaInicial = Math.abs(meta.initial - meta.goal);
    if (distanciaInicial === 0) {
      return 1;
    }

    const distanciaAtual = Math.abs(meta.current - meta.goal);
    return Phaser.Math.Clamp(1 - distanciaAtual / distanciaInicial, 0, 1);
  }

  private getDefaultOperationValue(operation: TipoDeOperacaoDaCascata): number {
    return getDefaultCascataOperationValue(operation);
  }

  private applyOperation(value: number, operation: TipoDeOperacaoDaCascata, operationValue?: number): number {
    return applyCascataOperation(value, operation, operationValue);
  }

  private updateMoveCounter(): void {
    if (!this.maxMoves) {
      return;
    }

    const remainingMoves = Math.max(0, this.maxMoves - this.currentMoves);

    if (this.moveCounterText) {
      this.moveCounterText.setText(`Movimentos\n${remainingMoves}/${this.maxMoves}`);
    this.moveCounterText.setColor(remainingMoves <= 2 ? "#ffdf7e" : this.currentSubLevel === 4 ? "#ffe6a3" : this.currentSubLevel === 5 ? "#b8fbff" : this.currentSubLevel === 6 ? "#d8b4fe" : this.currentSubLevel === 7 || this.currentSubLevel === 8 ? "#ffc4dd" : "#d9f2ff");
      this.moveCounterText.setScale(remainingMoves <= 2 ? 1.05 : 1);
    if ((this.currentSubLevel === 4 || this.currentSubLevel === 5 || this.currentSubLevel === 6 || this.currentSubLevel === 7 || this.currentSubLevel === 8) && remainingMoves <= 2) {
        this.moveCounterText.setShadow(0, 0, this.currentSubLevel >= 6 ? "#ff3030" : "#ffb000", 8, true, true);
      }
    }

    this.redrawEnergyPanel();
  }

  private failCurrentPhase(message: string, showDebugPopup = false): void {
    this.phaseFailed = true;
    this.resultText?.setColor("#ffb4a8");
    this.resultText?.setText(message);
    this.robotButtons.forEach((button) => {
      button.sprite.disableInteractive();
      button.sprite.setTint(0x667080);
    });
    this.moveCounterText?.setColor("#ff8a80");
    if (showDebugPopup) {
      this.showDebuggingPopup();
    }
  }

  private showDebuggingPopup(): void {
    if (this.isDebugPopupOpen) {
      return;
    }

    this.isDebugPopupOpen = true;
    const overlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x02070b, 0.46)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(90);

    const panelWidth = Math.min(760, this.scale.width - 56);
    const panelHeight = 370;
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const frame = this.add.graphics();
    drawFantasyPanelFrame(frame, {
      width: panelWidth,
      height: panelHeight,
      glowColor: 0xff4f4f,
      glowAlpha: 0.2,
      accentBorderColor: 0xff4f4f
    });
    frame.fillStyle(FANTASY_PANEL_COLORS.titleSurface, 0.94);
    frame.fillRoundedRect(18, 16, panelWidth - 36, 50, 5);
    frame.lineStyle(2, 0xff6b6b, 0.82);
    frame.strokeRoundedRect(19, 17, panelWidth - 38, 48, 4);

    const robotColumnCenterX = 124;
    const textColumnLeft = 222;
    const textColumnWidth = panelWidth - textColumnLeft - 42;
    const textColumnCenterX = textColumnLeft + textColumnWidth / 2;
    const messageFrame = this.add.graphics();
    messageFrame.fillStyle(0x160909, 0.18);
    messageFrame.fillRoundedRect(textColumnLeft, 92, textColumnWidth, 168, 7);
    messageFrame.lineStyle(2, 0xff4f4f, 0.72);
    messageFrame.strokeRoundedRect(textColumnLeft + 1, 93, textColumnWidth - 2, 166, 6);

    const robot = this.add.image(robotColumnCenterX, 188, this.getDominantDebugRobotTextureKey());
    this.setRobotButtonVisualSize(robot, 118);
    robot.setTint(0xf3fbff).setAlpha(0.58);

    const title = this.add.text(panelWidth / 2, 41, "Debugging de Energia", {
      fontFamily: "Georgia",
      fontSize: "25px",
      fontStyle: "bold",
      color: "#f2c45d",
      stroke: "#24170a",
      strokeThickness: 4,
      align: "center"
    });
    title.setOrigin(0.5);

    const message = this.add.text(textColumnCenterX, 176, this.selectDebugMessage(), {
      fontFamily: "Georgia",
      fontSize: "29px",
      color: "#f5f0df",
      stroke: "#3d0808",
      strokeThickness: 4,
      align: "center",
      lineSpacing: 16,
      wordWrap: { width: textColumnWidth - 44, useAdvancedWrap: true }
    });
    message.setOrigin(0.5);

    const retryButton = this.createDebugPopupButton(
      panelWidth / 2,
      panelHeight - 48,
      230,
      "Tentar Novamente",
      0x73f7ff,
      () => {
        this.closeDebugPopup();
        this.handleReset();
      }
    );

    const popup = this.add.container(centerX - panelWidth / 2, centerY - panelHeight / 2 + 16, [
      frame,
      messageFrame,
      robot,
      title,
      message,
      retryButton
    ]);
    popup.setScrollFactor(0).setDepth(91).setAlpha(0);
    this.debugPopupObjects.push(overlay, popup);

    this.tweens.add({
      targets: popup,
      alpha: 1,
      y: centerY - panelHeight / 2,
      duration: 260,
      ease: "Back.Out"
    });
    this.tweens.add({
      targets: robot,
      y: robot.y - 8,
      duration: 1150,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });
  }

  private createDebugPopupButton(
    x: number,
    y: number,
    width: number,
    label: string,
    accentColor: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const height = 46;
    const background = this.add.graphics();
    background.fillStyle(0x17130f, 0.92);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 7);
    background.lineStyle(2, accentColor, 0.9);
    background.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 6);

    const text = this.add.text(0, 0, label, {
      fontFamily: "Georgia",
      fontSize: "17px",
      fontStyle: "bold",
      color: "#fff5d8",
      stroke: "#24170a",
      strokeThickness: 3
    });
    text.setOrigin(0.5);

    const button = this.add.container(x, y, [background, text]);
    button.setSize(width, height);
    button.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    button.on("pointerover", () => {
      background.clear();
      background.fillStyle(accentColor, 0.2);
      background.fillRoundedRect(-width / 2, -height / 2, width, height, 7);
      background.lineStyle(2, accentColor, 1);
      background.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 6);
      text.setColor("#ffffff");
    });
    button.on("pointerout", () => {
      background.clear();
      background.fillStyle(0x17130f, 0.92);
      background.fillRoundedRect(-width / 2, -height / 2, width, height, 7);
      background.lineStyle(2, accentColor, 0.9);
      background.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 6);
      text.setColor("#fff5d8");
    });
    button.on("pointerdown", onClick);
    return button;
  }

  private selectDebugMessage(): string {
    const messages = [...DEBUG_MESSAGES, ...(DEBUG_MESSAGES_BY_PHASE[this.currentSubLevel] ?? [])];
    const availableMessages = messages.filter((message) => message !== this.lastDebugMessage);
    const pool = availableMessages.length > 0 ? availableMessages : messages;
    const selected = Phaser.Utils.Array.GetRandom(pool);
    this.lastDebugMessage = selected;
    return selected;
  }

  private getDominantDebugRobotTextureKey(): string {
    if (this.currentSubLevel === 4 || this.currentSubLevel === 6 || this.currentSubLevel === 8) {
      return ROBO_MULTIPLICACAO_KEY;
    }

    if (this.currentSubLevel === 5 || this.currentSubLevel === 7) {
      return ROBO_DIVISAO_KEY;
    }

    if (this.currentSubLevel === 2 || this.currentSubLevel === 3) {
      return ROBO_SUBTRACAO_KEY;
    }

    return ROBO_ADICAO_KEY;
  }

  private closeDebugPopup(): void {
    if (this.debugPopupObjects.length === 0) {
      this.isDebugPopupOpen = false;
      return;
    }

    this.debugPopupObjects.forEach((object) => {
      this.tweens.killTweensOf(object);
      if (object instanceof Phaser.GameObjects.Container) {
        object.list.forEach((child) => this.tweens.killTweensOf(child));
      }
      object.destroy();
    });
    this.debugPopupObjects = [];
    this.isDebugPopupOpen = false;
  }

  private updateSequenceLocks(): void {
    const config = SUB_LEVELS[this.currentSubLevel];
    if (!config) {
      return;
    }

    const lockedOperations = config.sequenceRules?.lockedOperations ?? [];
    if (lockedOperations.length === 0) {
      return;
    }

    this.robotButtons.forEach((button) => {
      if (!lockedOperations.includes(button.operation)) {
        return;
      }

      if (this.stabilizingMovePlayed) {
        button.sprite.setAlpha(1).setTint(0xffdf74);
        button.label.setColor("#ffe6a3");
        return;
      }

      button.sprite.setAlpha(0.62).setTint(0x8a6a28);
      button.label.setColor("#bca467");
    });
  }

  private playSequenceFeedback(slotView: SlotView, operation: TipoDeOperacaoDaCascata): void {
    if (this.currentSubLevel !== 4) {
      return;
    }

    this.flashSlot(slotView, operation === "multiply" || operation === "multiplication" ? 0xffe066 : 0xffc23a);
    this.createElectricParticles(slotView, operation === "multiply" || operation === "multiplication" ? 8 : 4);

  }

  private playComputationalFlowFeedback(slotView: SlotView, efficient: boolean): void {
    if (this.currentSubLevel !== 5) {
      return;
    }

    const color = efficient ? 0x38d5ff : 0xff5c5c;
    this.flashSlot(slotView, color);
    this.createElectricParticles(slotView, efficient ? 10 : 5, color);
    this.playAudioPlaceholder(efficient ? AUDIO_ENERGY_FLOW_KEY : AUDIO_ERROR_LIMIT_KEY);

    const connectionLayer = this.add.graphics().setDepth(23).setAlpha(0.82);
    connectionLayer.lineStyle(efficient ? 4 : 3, color, efficient ? 0.78 : 0.58);
    this.slotViews.forEach((targetSlot) => {
      if (targetSlot === slotView) {
        return;
      }
      connectionLayer.lineBetween(slotView.slot.x, slotView.slot.y, targetSlot.slot.x, targetSlot.slot.y);
      this.createFlowParticle(slotView.slot.x, slotView.slot.y, targetSlot.slot.x, targetSlot.slot.y, color);
    });

    this.tweens.add({
      targets: connectionLayer,
      alpha: 0,
      duration: efficient ? 620 : 320,
      ease: "Sine.Out",
      onComplete: () => connectionLayer.destroy()
    });

  }

  private playCentralSystemFeedback(slotView: SlotView, valid: boolean): void {
    if (this.currentSubLevel !== 6) {
      return;
    }

    const color = valid ? 0x9f7aea : 0xff5c5c;
    this.flashSlot(slotView, color);
    this.createElectricParticles(slotView, valid ? 12 : 6, color);
    this.playAudioPlaceholder(valid ? AUDIO_PREDICTION_VALID_KEY : AUDIO_PREDICTION_ERROR_KEY);

    const connectionLayer = this.add.graphics().setDepth(24).setAlpha(0.86);
    connectionLayer.lineStyle(valid ? 4 : 3, color, valid ? 0.72 : 0.58);
    this.slotViews.forEach((targetSlot) => {
      if (targetSlot === slotView) {
        return;
      }

      connectionLayer.lineBetween(slotView.slot.x, slotView.slot.y, targetSlot.slot.x, targetSlot.slot.y);
      this.createFlowParticle(slotView.slot.x, slotView.slot.y, targetSlot.slot.x, targetSlot.slot.y, color);
    });

    this.tweens.add({
      targets: connectionLayer,
      alpha: 0,
      duration: valid ? 700 : 340,
      ease: "Sine.Out",
      onComplete: () => connectionLayer.destroy()
    });

    const wave = this.add.circle(slotView.slot.x, slotView.slot.y, 18, color, 0).setDepth(25);
    wave.setStrokeStyle(3, color, valid ? 0.78 : 0.54);
    this.tweens.add({
      targets: wave,
      radius: valid ? 72 : 48,
      alpha: 0,
      duration: valid ? 540 : 300,
      ease: "Sine.Out",
      onComplete: () => wave.destroy()
    });

  }

  private playDebugCoreFeedback(slotView: SlotView, valid: boolean): void {
    if (this.currentSubLevel !== 7) {
      return;
    }

    const color = valid ? 0x57ffb0 : 0xff306f;
    this.flashSlot(slotView, color);
    this.createElectricParticles(slotView, valid ? 14 : 8, color);
    this.playAudioPlaceholder(valid ? AUDIO_DEBUG_SUCCESS_KEY : AUDIO_CORRUPTION_WARNING_KEY);

    const debugLayer = this.add.graphics().setDepth(24).setAlpha(0.88);
    debugLayer.lineStyle(valid ? 4 : 3, color, valid ? 0.76 : 0.62);
    this.slotViews.forEach((targetSlot) => {
      if (targetSlot === slotView) {
        return;
      }

      const midX = (slotView.slot.x + targetSlot.slot.x) / 2;
      const midY = (slotView.slot.y + targetSlot.slot.y) / 2 + Phaser.Math.Between(-18, 18);
      debugLayer.beginPath();
      debugLayer.moveTo(slotView.slot.x, slotView.slot.y);
      debugLayer.lineTo(midX, midY);
      debugLayer.lineTo(targetSlot.slot.x, targetSlot.slot.y);
      debugLayer.strokePath();
      this.createFlowParticle(slotView.slot.x, slotView.slot.y, targetSlot.slot.x, targetSlot.slot.y, color);
    });

    this.tweens.add({
      targets: debugLayer,
      alpha: 0,
      duration: valid ? 760 : 300,
      ease: "Sine.Out",
      onComplete: () => debugLayer.destroy()
    });

    if (!valid) {
      this.cameras.main.shake(120, 0.003);
    }

  }

  private playAutomationSequenceFeedback(slotView: SlotView, sequenceLength: number): void {
    if (this.currentSubLevel !== 8) {
      return;
    }

    this.resultText?.setColor("#b9ffd9");
    this.resultText?.setText(`Sequência programada executada: ${sequenceLength} passos automatizados.`);
    this.flashSlot(slotView, 0x7df7ff);
    this.createElectricParticles(slotView, 16, 0x7df7ff);
    this.createElectricParticles(slotView, 10, 0x57ffb0);

    const debugLayer = this.add.graphics().setDepth(25).setAlpha(0.9);
    debugLayer.lineStyle(5, 0x7df7ff, 0.72);
    this.slotViews.forEach((targetSlot) => {
      if (targetSlot === slotView) {
        return;
      }

      debugLayer.lineBetween(slotView.slot.x, slotView.slot.y, targetSlot.slot.x, targetSlot.slot.y);
      this.createFlowParticle(slotView.slot.x, slotView.slot.y, targetSlot.slot.x, targetSlot.slot.y, 0x57ffb0);
    });

    this.tweens.add({
      targets: debugLayer,
      alpha: 0,
      duration: 820,
      ease: "Sine.Out",
      onComplete: () => debugLayer.destroy()
    });
  }

  private playFinalRestorationFeedback(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const burst = this.add.circle(centerX, centerY, 24, 0x57ffb0, 0).setDepth(26);
    burst.setStrokeStyle(5, 0x7df7ff, 0.8);
    this.tweens.add({
      targets: burst,
      radius: Math.max(this.scale.width, this.scale.height) * 0.45,
      alpha: 0,
      duration: 900,
      ease: "Sine.Out",
      onComplete: () => burst.destroy()
    });

    this.phaseElements.forEach((element) => {
      element.image.clearTint();
      element.image.setAlpha(1);
    });

    this.slotViews.forEach((slotView) => {
      this.createElectricParticles(slotView, 12, 0x57ffb0);
      this.createElectricParticles(slotView, 8, 0x7df7ff);
    });
  }

  private playUltimateRestorationFeedback(): void {
    this.fullscreenCorruptedBackground?.setAlpha(0);
    this.fullscreenRestoredBackground?.setAlpha(1);
    this.cameras.main.flash(900, 125, 247, 255, false);

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    for (let index = 0; index < 36; index += 1) {
      const angle = (Math.PI * 2 * index) / 36;
      const distance = Phaser.Math.Between(120, 460);
      const particle = this.add
        .circle(centerX, centerY, Phaser.Math.Between(4, 8), index % 2 === 0 ? 0x57ffb0 : 0x7df7ff, 0.9)
        .setDepth(27);
      this.tweens.add({
        targets: particle,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        alpha: 0,
        duration: Phaser.Math.Between(900, 1500),
        ease: "Sine.Out",
        onComplete: () => particle.destroy()
      });
    }
  }

  private createFlowParticle(startX: number, startY: number, endX: number, endY: number, color: number): void {
    const particle = this.add
      .rectangle(startX, startY, 9, 5, color, 0.95)
      .setDepth(24)
      .setRotation(Phaser.Math.Angle.Between(startX, startY, endX, endY));
    this.tweens.add({
      targets: particle,
      x: endX,
      y: endY,
      alpha: 0,
      duration: 480,
      ease: "Sine.InOut",
      onComplete: () => particle.destroy()
    });
  }

  private activateComputationalFlowForOutput(output: string): void {
    if (this.currentSubLevel !== 5) {
      return;
    }

    if (output === "Flores") {
      this.activateComputationalFlowSystem("condutores");
      return;
    }

    if (output === "Solo") {
      this.activateComputationalFlowSystem("portais");
      return;
    }

    if (output === "Arvores") {
      this.activateComputationalFlowSystem("distribuidores");
    }
  }

  private activateComputationalFlowSystem(system: ComputationalFlowSystem): void {
    if (this.activatedComputationalSystems.has(system)) {
      return;
    }

    this.activatedComputationalSystems.add(system);

    if (system === "condutores") {
      this.createEnergyPath("cascade-to-condutores", 0x8cf8ff, 3, 0.7);
      this.createEnergyPath("condutores-to-portais", 0xf8e6a0, 2, 0.48);
      this.createFlowParticles("cascade-to-condutores", 0x8cf8ff, 720);
      this.createFlowParticles("condutores-to-portais", 0xf8e6a0, 980);
      this.createEnergyPulse("cascade-to-condutores", 0xffffff, 920);
      return;
    }

    if (system === "portais") {
      this.createPortalNode("portais");
      this.createEnergyPath("portais-to-distribuidores", 0x7df7ff, 3, 0.62);
      this.createFlowParticles("portais-to-distribuidores", 0x7df7ff, 760);
      this.createEnergyPulse("portais-to-distribuidores", 0xf8e6a0, 860);
      return;
    }

    this.createPortalNode("distribuidores");
    this.createEnergyPath("distribuidores-to-ecosystem-left", 0xf8e6a0, 2, 0.42);
    this.createEnergyPath("distribuidores-to-ecosystem-right", 0x8cf8ff, 2, 0.42);
    this.createFlowParticles("distribuidores-to-ecosystem-left", 0xf8e6a0, 1040);
    this.createFlowParticles("distribuidores-to-ecosystem-right", 0x8cf8ff, 1120);
    this.createSynchronizedEcosystemPulse();
  }

  private createEnergyPath(
    route: ComputationalFlowRoute,
    color = 0x8cf8ff,
    lineWidth = 3,
    alpha = 0.58
  ): Phaser.GameObjects.Graphics {
    const path = this.add.graphics().setDepth(3.2).setAlpha(0);
    path.setBlendMode(Phaser.BlendModes.ADD);
    this.computationalFlowPaths.set(route, { route, graphics: path, color, lineWidth, alpha });
    this.computationalFlowObjects.push(path);
    this.drawComputationalEnergyPath(this.computationalFlowPaths.get(route));

    this.tweens.add({
      targets: path,
      alpha: 1,
      duration: 520,
      ease: "Sine.Out"
    });

    this.tweens.add({
      targets: path,
      alpha: 0.72,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    return path;
  }

  private createPortalNode(system: ComputationalFlowSystem): Phaser.GameObjects.Container | undefined {
    if (this.computationalFlowNodes.has(system)) {
      return this.computationalFlowNodes.get(system)?.container;
    }

    const position = this.getComputationalFlowNodePosition(system);
    if (!position) {
      return undefined;
    }

    const outer = this.add.circle(0, 0, system === "portais" ? 42 : 34, 0x7df7ff, 0);
    outer.setStrokeStyle(3, system === "portais" ? 0x7df7ff : 0xf8e6a0, system === "portais" ? 0.56 : 0.46);
    const middle = this.add.circle(0, 0, system === "portais" ? 28 : 23, 0x8cf8ff, 0.1);
    middle.setStrokeStyle(2, 0xffffff, 0.36);
    const core = this.add.circle(0, 0, system === "portais" ? 8 : 7, system === "portais" ? 0x8cf8ff : 0xf8e6a0, 0.72);
    const orbit = this.add.rectangle(system === "portais" ? 36 : 28, 0, system === "portais" ? 10 : 8, 4, 0xffffff, 0.8);
    const container = this.add.container(position.x, position.y, [outer, middle, core, orbit]).setDepth(3.4).setAlpha(0);
    container.setBlendMode(Phaser.BlendModes.ADD);

    this.computationalFlowNodes.set(system, { system, container });
    this.computationalFlowObjects.push(container);

    this.tweens.add({
      targets: container,
      alpha: system === "portais" ? 0.82 : 0.66,
      duration: 520,
      ease: "Sine.Out"
    });
    this.tweens.add({
      targets: container,
      angle: 360,
      duration: system === "portais" ? 5200 : 3800,
      repeat: -1,
      ease: "Linear"
    });
    this.tweens.add({
      targets: [outer, middle],
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: system === "portais" ? 0.78 : 0.58,
      duration: 1280,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    return container;
  }

  private createEnergyPulse(route: ComputationalFlowRoute, color = 0xffffff, duration = 760): void {
    const points = this.getComputationalFlowRoutePoints(route);
    if (points.length < 2) {
      return;
    }

    const start = points[0];
    if (!start) {
      return;
    }

    const pulse = this.add.circle(start.x, start.y, 4, color, 0.92).setDepth(3.6);
    pulse.setBlendMode(Phaser.BlendModes.ADD);
    this.computationalFlowObjects.push(pulse);

    const progress = { value: 0 };
    this.tweens.add({
      targets: progress,
      value: 1,
      duration,
      ease: "Sine.InOut",
      onUpdate: () => {
        const point = this.getPointOnPolyline(points, progress.value);
        pulse.setPosition(point.x, point.y);
      },
      onComplete: () => {
        this.computationalFlowObjects = this.computationalFlowObjects.filter((object) => object !== pulse);
        pulse.destroy();
      }
    });
  }

  private createFlowParticles(route: ComputationalFlowRoute, color = 0x8cf8ff, delay = 900): void {
    this.createEnergyPulse(route, color, delay * 0.72);
    const event = this.time.addEvent({
      delay,
      loop: true,
      callback: () => {
        if (this.currentSubLevel !== 5 || !this.activatedComputationalSystems.size) {
          return;
        }

        this.createEnergyPulse(route, color, delay * 0.72);
      }
    });
    this.computationalFlowEvents.push(event);
  }

  private createSynchronizedEcosystemPulse(): void {
    const event = this.time.addEvent({
      delay: 1320,
      loop: true,
      callback: () => {
        if (this.currentSubLevel !== 5) {
          return;
        }

        const distributorPosition = this.getComputationalFlowNodePosition("distribuidores");
        if (!distributorPosition) {
          return;
        }

        const pulse = this.add.circle(distributorPosition.x, distributorPosition.y, 18, 0xf8e6a0, 0).setDepth(3.6);
        pulse.setStrokeStyle(3, 0xf8e6a0, 0.48);
        pulse.setBlendMode(Phaser.BlendModes.ADD);
        this.computationalFlowObjects.push(pulse);
        this.tweens.add({
          targets: pulse,
          radius: 72,
          alpha: 0,
          duration: 760,
          ease: "Sine.Out",
          onComplete: () => {
            this.computationalFlowObjects = this.computationalFlowObjects.filter((object) => object !== pulse);
            pulse.destroy();
          }
        });
      }
    });

    this.computationalFlowEvents.push(event);
  }

  private revealCompleteComputationalFlow(): void {
    if (this.currentSubLevel !== 5) {
      return;
    }

    this.activateComputationalFlowSystem("condutores");
    this.activateComputationalFlowSystem("portais");
    this.activateComputationalFlowSystem("distribuidores");

    const routes: ComputationalFlowRoute[] = [
      "cascade-to-condutores",
      "condutores-to-portais",
      "portais-to-distribuidores",
      "distribuidores-to-ecosystem-left",
      "distribuidores-to-ecosystem-right"
    ];
    routes.forEach((route, index) => {
      this.time.delayedCall(index * 150, () => {
        this.createEnergyPulse(route, index % 2 === 0 ? 0x8cf8ff : 0xf8e6a0, 980);
      });
    });

    const centerX = this.scale.width * 0.5;
    const centerY = this.scale.height * 0.58;
    const wave = this.add.circle(centerX, centerY, 28, 0x8cf8ff, 0).setDepth(3.6);
    wave.setStrokeStyle(4, 0x8cf8ff, 0.62);
    wave.setBlendMode(Phaser.BlendModes.ADD);
    this.computationalFlowObjects.push(wave);
    this.tweens.add({
      targets: wave,
      radius: 190,
      alpha: 0,
      duration: 1400,
      ease: "Sine.Out",
      onComplete: () => {
        this.computationalFlowObjects = this.computationalFlowObjects.filter((object) => object !== wave);
        wave.destroy();
      }
    });
  }

  private layoutComputationalFlowVisuals(): void {
    this.computationalFlowPaths.forEach((path) => this.drawComputationalEnergyPath(path));
    this.computationalFlowNodes.forEach((node) => {
      const position = this.getComputationalFlowNodePosition(node.system);
      if (position) {
        node.container.setPosition(position.x, position.y);
      }
    });
  }

  private drawComputationalEnergyPath(path?: ComputationalEnergyPath): void {
    if (!path) {
      return;
    }

    const points = this.getComputationalFlowRoutePoints(path.route);
    path.graphics.clear();
    if (points.length < 2) {
      return;
    }

    path.graphics.lineStyle(path.lineWidth + 8, path.color, path.alpha * 0.16);
    this.strokePolyline(path.graphics, points);
    path.graphics.lineStyle(path.lineWidth + 2, path.color, path.alpha * 0.3);
    this.strokePolyline(path.graphics, points);
    path.graphics.lineStyle(path.lineWidth, path.color, path.alpha);
    this.strokePolyline(path.graphics, points);

    points.forEach((point, index) => {
      const endpointAlpha = index === 0 || index === points.length - 1 ? 0.22 : 0.12;
      path.graphics.fillStyle(index % 2 === 0 ? path.color : 0xffffff, endpointAlpha);
      path.graphics.fillCircle(point.x, point.y, index === 0 || index === points.length - 1 ? 9 : 5);
    });
  }

  private strokePolyline(graphics: Phaser.GameObjects.Graphics, points: Phaser.Math.Vector2[]): void {
    const start = points[0];
    if (!start) {
      return;
    }

    graphics.beginPath();
    graphics.moveTo(start.x, start.y);
    points.slice(1).forEach((point) => graphics.lineTo(point.x, point.y));
    graphics.strokePath();
  }

  private getComputationalFlowRoutePoints(route: ComputationalFlowRoute): Phaser.Math.Vector2[] {
    const cascade = new Phaser.Math.Vector2(this.scale.width * 0.42, this.scale.height * 0.42);
    const condutores = this.getComputationalFlowSlotPoint("Flores");
    const portais = this.getComputationalFlowSlotPoint("Solo");
    const distribuidores = this.getComputationalFlowSlotPoint("Arvores");
    const ecosystemLeft = new Phaser.Math.Vector2(this.scale.width * 0.28, this.scale.height * 0.58);
    const ecosystemRight = new Phaser.Math.Vector2(this.scale.width * 0.68, this.scale.height * 0.55);

    switch (route) {
      case "cascade-to-condutores":
        return condutores ? [cascade, new Phaser.Math.Vector2(cascade.x + 40, condutores.y - 90), condutores] : [];
      case "condutores-to-portais":
        return condutores && portais
          ? [condutores, new Phaser.Math.Vector2((condutores.x + portais.x) / 2, condutores.y - 80), portais]
          : [];
      case "portais-to-distribuidores":
        return portais && distribuidores
          ? [portais, new Phaser.Math.Vector2((portais.x + distribuidores.x) / 2, portais.y - 64), distribuidores]
          : [];
      case "distribuidores-to-ecosystem-left":
        return distribuidores
          ? [distribuidores, new Phaser.Math.Vector2(distribuidores.x - 160, distribuidores.y - 120), ecosystemLeft]
          : [];
      case "distribuidores-to-ecosystem-right":
        return distribuidores
          ? [distribuidores, new Phaser.Math.Vector2(distribuidores.x + 140, distribuidores.y - 130), ecosystemRight]
          : [];
      default:
        return [];
    }
  }

  private getComputationalFlowNodePosition(system: ComputationalFlowSystem): Phaser.Math.Vector2 | undefined {
    if (system === "portais") {
      return this.getComputationalFlowSlotPoint("Solo");
    }

    if (system === "distribuidores") {
      return this.getComputationalFlowSlotPoint("Arvores");
    }

    return this.getComputationalFlowSlotPoint("Flores");
  }

  private getComputationalFlowSlotPoint(output: string): Phaser.Math.Vector2 | undefined {
    const slotView = [...this.slotViews.values()].find((slot) => slot.output === output);
    if (!slotView) {
      return undefined;
    }

    return new Phaser.Math.Vector2(slotView.slot.x, slotView.slot.y - 18);
  }

  private getPointOnPolyline(points: Phaser.Math.Vector2[], progress: number): Phaser.Math.Vector2 {
    const firstPoint = points[0];
    if (!firstPoint || points.length === 1) {
      return firstPoint?.clone() ?? new Phaser.Math.Vector2(0, 0);
    }

    const segments = points.slice(1).map((point, index) => {
      const start = points[index] ?? firstPoint;
      return {
        start,
        end: point,
        length: Phaser.Math.Distance.Between(start.x, start.y, point.x, point.y)
      };
    });
    const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
    const targetDistance = Phaser.Math.Clamp(progress, 0, 1) * totalLength;
    let traveled = 0;

    for (const segment of segments) {
      if (traveled + segment.length >= targetDistance) {
        const localProgress = segment.length === 0 ? 0 : (targetDistance - traveled) / segment.length;
        return new Phaser.Math.Vector2(
          Phaser.Math.Linear(segment.start.x, segment.end.x, localProgress),
          Phaser.Math.Linear(segment.start.y, segment.end.y, localProgress)
        );
      }

      traveled += segment.length;
    }

    return points[points.length - 1]?.clone() ?? firstPoint.clone();
  }

  private activateEnergySync(output: string): void {
    if (this.currentSubLevel !== 6) {
      return;
    }

    if (output === "Flores") {
      this.createEnergyNetwork(["crystal-to-cascade", "crystal-to-conductors"], 0.42);
      this.createCascadeOrb(0.42);
      this.intensifyCascadeOrb(0.5);
      return;
    }

    if (output === "Solo") {
      this.createEnergyNetwork(["crystal-to-portals", "crystal-to-reservoirs"], 0.58);
      this.createPhase6FlowParticles("crystal-to-cascade", 0x8cf8ff, 980);
      this.createPhase6FlowParticles("crystal-to-conductors", 0xf8e6a0, 1180);
      this.createPhase6FlowParticles("crystal-to-portals", 0x8cf8ff, 880);
      this.intensifyCascadeOrb(0.72);
      return;
    }

    if (output === "Arvores") {
      this.createEnergyNetwork(["crystal-to-distributors"], 0.68);
      this.createPhase6FlowParticles("crystal-to-distributors", 0xf8e6a0, 920);
      this.createPhase6FlowParticles("crystal-to-reservoirs", 0x8cf8ff, 1240);
      this.activateCompleteEnergySync();
      this.intensifyCascadeOrb(1);
    }
  }

  private createEnergyNetwork(routes: Phase6EnergyRoute[], alpha = 0.55): void {
    routes.forEach((route) => {
      if (this.phase6EnergyPaths.has(route)) {
        return;
      }

      const color = route === "crystal-to-distributors" || route === "crystal-to-reservoirs" ? 0xf8e6a0 : 0x8cf8ff;
      const path = this.add.graphics().setDepth(3.15).setAlpha(0);
      path.setBlendMode(Phaser.BlendModes.ADD);

      this.phase6EnergyPaths.set(route, {
        route,
        graphics: path,
        color,
        lineWidth: route === "crystal-to-cascade" ? 3 : 2,
        alpha
      });
      this.phase6EnergyObjects.push(path);
      this.drawPhase6EnergyPath(this.phase6EnergyPaths.get(route));

      this.tweens.add({
        targets: path,
        alpha: 1,
        duration: 560,
        ease: "Sine.Out"
      });
      this.tweens.add({
        targets: path,
        alpha: 0.72,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut"
      });
    });
  }

  private createPhase6EnergyPulse(route: Phase6EnergyRoute, color = 0xffffff, duration = 900): void {
    const points = this.getPhase6EnergyRoutePoints(route);
    const start = points[0];
    if (!start || points.length < 2) {
      return;
    }

    const pulse = this.add.circle(start.x, start.y, 4, color, 0.94).setDepth(3.75);
    pulse.setBlendMode(Phaser.BlendModes.ADD);
    this.phase6EnergyObjects.push(pulse);

    const progress = { value: 0 };
    this.tweens.add({
      targets: progress,
      value: 1,
      duration,
      ease: "Sine.InOut",
      onUpdate: () => {
        const point = this.getPointOnPolyline(points, progress.value);
        pulse.setPosition(point.x, point.y);
        pulse.setScale(Phaser.Math.Linear(0.82, 1.2, Math.sin(progress.value * Math.PI)));
      },
      onComplete: () => {
        this.phase6EnergyObjects = this.phase6EnergyObjects.filter((object) => object !== pulse);
        pulse.destroy();
      }
    });
  }

  private createPhase6FlowParticles(route: Phase6EnergyRoute, color = 0x8cf8ff, delay = 1000): void {
    if (this.phase6ActivatedStages.has(`pulse-${route}`)) {
      return;
    }

    this.phase6ActivatedStages.add(`pulse-${route}`);
    this.createPhase6EnergyPulse(route, color, delay * 0.72);

    const event = this.time.addEvent({
      delay,
      loop: true,
      callback: () => {
        if (this.currentSubLevel !== 6 || !this.phase6EnergyPaths.has(route)) {
          return;
        }

        this.createPhase6EnergyPulse(route, color, delay * 0.72);
      }
    });
    this.phase6EnergyEvents.push(event);
  }

  private createCascadeOrb(intensity = 0.5): Phaser.GameObjects.Container {
    if (this.phase6CascadeOrb) {
      return this.phase6CascadeOrb;
    }

    const position = this.getPhase6EnergyNodePosition("orb");
    const glow = this.add.circle(0, 0, 38, 0x8cf8ff, 0.16);
    const halo = this.add.circle(0, 0, 30, 0x8cf8ff, 0);
    halo.setStrokeStyle(3, 0x8cf8ff, 0.36);
    const core = this.add.circle(0, 0, 12, 0xf4ffff, 0.82);
    const smallCore = this.add.circle(0, 0, 6, 0xf8e6a0, 0.62);
    const orbitA = this.add.circle(28, 0, 3, 0xffffff, 0.82);
    const orbitB = this.add.circle(-20, 16, 2.5, 0xf8e6a0, 0.74);
    const orbitC = this.add.circle(10, -24, 2.5, 0x8cf8ff, 0.72);
    const orbitLayer = this.add.container(0, 0, [orbitA, orbitB, orbitC]);

    const orb = this.add
      .container(position.x, position.y, [glow, halo, core, smallCore, orbitLayer])
      .setDepth(3.9)
      .setAlpha(0);
    orb.setBlendMode(Phaser.BlendModes.ADD);
    orb.setData("baseAlpha", intensity);

    this.phase6CascadeOrb = orb;
    this.phase6EnergyObjects.push(orb);

    this.tweens.add({
      targets: orb,
      alpha: intensity,
      duration: 540,
      ease: "Sine.Out"
    });
    this.tweens.add({
      targets: [glow, core, smallCore],
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: 1,
      duration: 1280,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });
    this.tweens.add({
      targets: halo,
      angle: 360,
      duration: 5200,
      repeat: -1,
      ease: "Linear"
    });
    this.tweens.add({
      targets: orbitLayer,
      angle: 360,
      duration: 4200,
      repeat: -1,
      ease: "Linear"
    });
    this.tweens.add({
      targets: [orbitA, orbitB, orbitC],
      alpha: 0.28,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });

    return orb;
  }

  private intensifyCascadeOrb(intensity: number): void {
    const orb = this.createCascadeOrb(intensity);
    orb.setData("baseAlpha", intensity);
    this.tweens.add({
      targets: orb,
      alpha: intensity,
      scaleX: Phaser.Math.Linear(0.96, 1.08, intensity),
      scaleY: Phaser.Math.Linear(0.96, 1.08, intensity),
      duration: 520,
      ease: "Sine.Out"
    });
  }

  private activateCompleteEnergySync(): void {
    if (this.currentSubLevel !== 6 || this.phase6ActivatedStages.has("full-sync")) {
      return;
    }

    this.phase6ActivatedStages.add("full-sync");
    const center = this.getPhase6EnergyNodePosition("crystal");
    const event = this.time.addEvent({
      delay: 1360,
      loop: true,
      callback: () => {
        if (this.currentSubLevel !== 6) {
          return;
        }

        const wave = this.add.circle(center.x, center.y, 20, 0x8cf8ff, 0).setDepth(3.65);
        wave.setStrokeStyle(3, 0x8cf8ff, 0.34);
        wave.setBlendMode(Phaser.BlendModes.ADD);
        this.phase6EnergyObjects.push(wave);
        this.tweens.add({
          targets: wave,
          radius: 86,
          alpha: 0,
          duration: 820,
          ease: "Sine.Out",
          onComplete: () => {
            this.phase6EnergyObjects = this.phase6EnergyObjects.filter((object) => object !== wave);
            wave.destroy();
          }
        });
      }
    });
    this.phase6EnergyEvents.push(event);
  }

  private layoutPhase6EnergyNetwork(): void {
    this.phase6EnergyPaths.forEach((path) => this.drawPhase6EnergyPath(path));
    if (this.phase6CascadeOrb) {
      const position = this.getPhase6EnergyNodePosition("orb");
      this.phase6CascadeOrb.setPosition(position.x, position.y);
    }
  }

  private drawPhase6EnergyPath(path?: Phase6EnergyPath): void {
    if (!path) {
      return;
    }

    const points = this.getPhase6EnergyRoutePoints(path.route);
    path.graphics.clear();
    if (points.length < 2) {
      return;
    }

    path.graphics.lineStyle(path.lineWidth + 8, path.color, path.alpha * 0.12);
    this.strokePolyline(path.graphics, points);
    path.graphics.lineStyle(path.lineWidth + 3, path.color, path.alpha * 0.24);
    this.strokePolyline(path.graphics, points);
    path.graphics.lineStyle(path.lineWidth, path.color, path.alpha);
    this.strokePolyline(path.graphics, points);

    points.forEach((point, index) => {
      const endpoint = index === 0 || index === points.length - 1;
      path.graphics.fillStyle(index % 2 === 0 ? path.color : 0xffffff, endpoint ? 0.2 : 0.1);
      path.graphics.fillCircle(point.x, point.y, endpoint ? 8 : 4);
    });
  }

  private getPhase6EnergyRoutePoints(route: Phase6EnergyRoute): Phaser.Math.Vector2[] {
    const crystal = this.getPhase6EnergyNodePosition("crystal");
    const cascade = this.getPhase6EnergyNodePosition("cascade");
    const portals = this.getPhase6EnergyNodePosition("portals");
    const distributors = this.getPhase6EnergyNodePosition("distributors");
    const reservoirs = this.getPhase6EnergyNodePosition("reservoirs");
    const conductors = this.getPhase6EnergyNodePosition("conductors");

    switch (route) {
      case "crystal-to-cascade":
        return [crystal, new Phaser.Math.Vector2(crystal.x - 120, crystal.y - 120), cascade];
      case "crystal-to-portals":
        return [crystal, new Phaser.Math.Vector2((crystal.x + portals.x) / 2, crystal.y - 90), portals];
      case "crystal-to-distributors":
        return [crystal, new Phaser.Math.Vector2((crystal.x + distributors.x) / 2, distributors.y - 120), distributors];
      case "crystal-to-reservoirs":
        return [crystal, new Phaser.Math.Vector2(crystal.x + 165, crystal.y + 18), reservoirs];
      case "crystal-to-conductors":
        return [crystal, new Phaser.Math.Vector2(crystal.x - 170, crystal.y + 58), conductors];
      default:
        return [];
    }
  }

  private getPhase6EnergyNodePosition(node: string): Phaser.Math.Vector2 {
    const crystal = this.getComputationalFlowSlotPoint("Flores") ?? new Phaser.Math.Vector2(this.scale.width * 0.42, this.scale.height * 0.48);
    const solo = this.getComputationalFlowSlotPoint("Solo") ?? new Phaser.Math.Vector2(this.scale.width * 0.58, this.scale.height * 0.5);
    const arvores = this.getComputationalFlowSlotPoint("Arvores") ?? new Phaser.Math.Vector2(this.scale.width * 0.5, this.scale.height * 0.46);

    switch (node) {
      case "crystal":
        return crystal;
      case "orb":
        return new Phaser.Math.Vector2(crystal.x - 62, crystal.y - 96);
      case "cascade":
        return new Phaser.Math.Vector2(this.scale.width * 0.42, this.scale.height * 0.37);
      case "portals":
        return solo;
      case "distributors":
        return arvores;
      case "reservoirs":
        return new Phaser.Math.Vector2(solo.x + 138, solo.y + 28);
      case "conductors":
        return new Phaser.Math.Vector2(crystal.x - 145, crystal.y + 88);
      default:
        return crystal;
    }
  }

  private clearComputationalFlowVisuals(): void {
    this.computationalFlowEvents.forEach((event) => event.remove(false));
    this.computationalFlowEvents = [];
    this.computationalFlowObjects.forEach((object) => {
      this.tweens.killTweensOf(object);
      object.destroy();
    });
    this.computationalFlowObjects = [];
    this.computationalFlowPaths.clear();
    this.computationalFlowNodes.clear();
    this.activatedComputationalSystems.clear();
    this.clearPhase6EnergyNetwork();
  }

  private clearPhase6EnergyNetwork(): void {
    this.phase6EnergyEvents.forEach((event) => event.remove(false));
    this.phase6EnergyEvents = [];
    this.phase6EnergyObjects.forEach((object) => {
      this.tweens.killTweensOf(object);
      object.destroy();
    });
    this.phase6EnergyObjects = [];
    this.phase6EnergyPaths.clear();
    this.phase6ActivatedStages.clear();
    this.phase6CascadeOrb = undefined;
    this.phase6SyncTargets.forEach((target) => this.tweens.killTweensOf(target));
    this.phase6SyncTargets = [];
  }

  private playSequenceInstability(slotView: SlotView): void {
    if (this.currentSubLevel !== 4) {
      return;
    }

    this.cameras.main.shake(180, 0.004);
    this.createElectricParticles(slotView, 10, 0xff3030);

  }

  private createElectricParticles(slotView: SlotView, count: number, color = 0xffdf74): void {
    this.createElectricParticlesAt(slotView.slot.x, slotView.slot.y, count, color);
  }

  private createElectricParticlesAt(originX: number, originY: number, count: number, color = 0xffdf74): void {
    for (let index = 0; index < count; index += 1) {
      const spark = this.add
        .rectangle(
          originX + Phaser.Math.Between(-70, 70),
          originY + Phaser.Math.Between(-48, 48),
          Phaser.Math.Between(8, 18),
          3,
          color,
          0.9
        )
        .setDepth(24)
        .setAngle(Phaser.Math.Between(-35, 35));

      this.tweens.add({
        targets: spark,
        x: spark.x + Phaser.Math.Between(-24, 24),
        y: spark.y + Phaser.Math.Between(-28, 12),
        alpha: 0,
        duration: Phaser.Math.Between(220, 420),
        ease: "Sine.Out",
        onComplete: () => spark.destroy()
      });
    }
  }

  private flashSlot(slotView: SlotView, color: number): void {
    this.drawGoalPanel(slotView.plaque, color, color, true);
    this.tweens.add({
      targets: slotView.plaque,
      alpha: 0.72,
      duration: 90,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        slotView.plaque.setAlpha(1);
        const meta = biomaStoreApi.getState().metas.find((item) => item.output === slotView.output);
        this.applyGoalPanelStyle(slotView, Boolean(meta && meta.current === meta.goal));
      }
    });
  }

  private applyGoalPanelStyle(slotView: SlotView, complete: boolean): void {
    if (this.currentSubLevel === 3) {
      this.drawGoalPanel(slotView.plaque, complete ? 0x73f7ff : 0x58b8c9, 0x56d7ff, complete);
      return;
    }

    if (this.currentSubLevel === 5) {
      this.drawGoalPanel(slotView.plaque, complete ? 0x8cf8ff : 0x38d5ff, 0x38d5ff, complete);
      return;
    }

    if (this.currentSubLevel === 4) {
      this.drawGoalPanel(slotView.plaque, complete ? 0xffdf74 : 0xd2a24a, 0xffbd38, complete);
      return;
    }

    this.drawGoalPanel(slotView.plaque, complete ? 0xd2a24a : 0xb7832f, 0x50c878, complete);
  }

  private playAudioPlaceholder(audioKey: string): void {
    const placeholderPath = AUDIO_PLACEHOLDER_PATHS[audioKey];
    if (!placeholderPath) {
      return;
    }

    if (this.cache.audio.exists(audioKey)) {
      this.sound.play(audioKey);
    }
  }

  private resetSceneSessionState(): void {
    if (this.autoReturnTimeoutId) {
      window.clearTimeout(this.autoReturnTimeoutId);
      this.autoReturnTimeoutId = undefined;
    }

    this.phaseElements.clear();
    this.phaseBackgroundLayers = [];
    this.cascataOverlay = undefined;
    this.restoredTopics.clear();
    this.computationalFlowPaths.clear();
    this.computationalFlowNodes.clear();
    this.computationalFlowObjects = [];
    this.computationalFlowEvents = [];
    this.activatedComputationalSystems.clear();
    this.phase6EnergyPaths.clear();
    this.phase6EnergyObjects = [];
    this.phase6EnergyEvents = [];
    this.phase6ActivatedStages.clear();
    this.phase6CascadeOrb = undefined;
    this.phase6SyncTargets = [];
    this.firstRestoreDecorationShown = false;
    this.slotViews.clear();
    this.slotObjects = [];
    this.robotButtons.clear();
    this.panelDynamicObjects = [];
    this.robotIntroObjects = [];
    this.activeRobotIntroId = undefined;
    this.debugPopupObjects = [];
    this.isDebugPopupOpen = false;
    this.moveCounterText = undefined;
    this.currentMoves = 0;
    this.maxMoves = undefined;
    this.phaseFailed = false;
    this.stabilizingMovePlayed = false;
    this.computationalFlowStepIndex = 0;
    this.isRobotIntroActive = false;
  }

  private resetPhaseVisualState(): void {
    this.restoredTopics.clear();
    this.firstRestoreDecorationShown = false;
    this.clearComputationalFlowVisuals();

    if (this.cascataOverlay) {
      this.tweens.killTweensOf(this.cascataOverlay);
      this.phaseBackgroundLayers = this.phaseBackgroundLayers.filter((layer) => layer !== this.cascataOverlay);
      this.cascataOverlay.destroy();
      this.cascataOverlay = undefined;
    }

    const supportIds = new Set(
      Object.values(RESTORE_SUPPORT_CONFIGS)
        .flat()
        .map((config) => config.id)
    );

    supportIds.forEach((supportId) => {
      const supportView = this.phaseElements.get(supportId);
      if (!supportView) {
        return;
      }

      this.tweens.killTweensOf(supportView.image);
      this.phaseBackgroundLayers = this.phaseBackgroundLayers.filter((layer) => layer !== supportView.image);
      supportView.image.destroy();
      this.phaseElements.delete(supportId);
    });

    PHASE_ELEMENT_CONFIGS.forEach((config) => {
      const view = this.phaseElements.get(config.id);
      if (!view) {
        this.createPhaseElementFromConfig(config);
        return;
      }

      this.tweens.killTweensOf(view.image);
      view.image
        .setTexture(config.textureKey)
        .setPosition(config.x, config.y)
        .setOrigin(0, 0)
        .setScale(1)
        .setAngle(config.angle ?? 0)
        .setDepth(config.depth ?? -5)
        .setAlpha(1)
        .clearTint();
      view.image.setData("output", config.output);
      view.image.setData("restoreTextureKey", config.restoreTextureKey);
      view.image.setData("elementId", config.id);
    });
  }

  private applyInheritedPhaseVisualState(): void {
    if (this.currentSubLevel <= 1) {
      return;
    }

    this.applyPhase1CompletedVisualState();

    if (this.currentSubLevel >= 3) {
      this.applyPhase2CompletedVisualState();
    }

    if (this.currentSubLevel >= 4) {
      this.applyPhase3CompletedVisualState();
    }

    if (this.currentSubLevel >= 5) {
      this.applyPhase4CompletedVisualState();
    }
  }

  private applyPhase1CompletedVisualState(): void {
    this.setSceneBackground(BACKGROUND_RESTORED_KEY);
    this.setCascataOverlayImmediate(CASCATA_KEY);
    this.setPhaseElementTextureImmediate("flores_morta", FLOR_VIVA_KEY, -10);
    this.setPhaseElementTextureImmediate("arvores_mortas", ARVORES_VIVAS_KEY, -3);
    this.ensurePhaseSupportImmediate({
      id: "agua_flor",
      textureKey: AGUA_FLOR_KEY,
      path: AGUA_FLOR_PATH,
      x: 0,
      y: 0,
      depth: -2
    });
    this.ensurePhaseSupportImmediate({
      id: "vaso_solo",
      textureKey: VASO_SOLO_KEY,
      path: VASO_SOLO_PATH,
      x: 0,
      y: 0,
      depth: -3
    });
    this.ensurePhaseSupportImmediate({
      id: "agua_solo",
      textureKey: AGUA_SOLO_KEY,
      path: AGUA_SOLO_PATH,
      x: 0,
      y: 0,
      depth: -16
    });
  }

  private applyPhase2CompletedVisualState(): void {
    this.setSceneBackground(BACKGROUND_RESTORED_FASE_02_KEY);
    this.setCascataOverlayImmediate(CASCATA_FASE_02_KEY);
    this.setPhaseElementTextureImmediate("flores_morta", FLOR_SENSOR_FASE_02_KEY, -10);
    this.setPhaseElementTextureImmediate("arvores_mortas", ARVORES_TURBINA_FASE_02_KEY, -3);
    this.ensurePhaseSupportImmediate({
      id: "agua_flor",
      textureKey: FLUXO_AGUA_SENSOR_FASE_02_KEY,
      path: FLUXO_AGUA_SENSOR_FASE_02_PATH,
      x: 0,
      y: 0,
      depth: -2
    });
    this.ensurePhaseSupportImmediate({
      id: "vaso_solo",
      textureKey: SOLO_RESERVATORIO_FASE_02_KEY,
      path: SOLO_RESERVATORIO_FASE_02_PATH,
      x: 0,
      y: 0,
      depth: -3
    });
    this.ensurePhaseSupportImmediate({
      id: "agua_solo",
      textureKey: FLUXO_AGUA_SOLO_FASE_02_KEY,
      path: FLUXO_AGUA_SOLO_FASE_02_PATH,
      x: 0,
      y: 0,
      depth: -16
    });
  }

  private applyPhase3CompletedVisualState(): void {
    this.setPhaseElementTextureImmediate("arvores_mortas", ARVORES_RAIZES_FASE_03_KEY, -3);
    this.ensurePhaseSupportImmediate({
      id: "agua_flor",
      textureKey: FLUXO_AGUA_SENSOR_FASE_03_KEY,
      path: FLUXO_AGUA_SENSOR_FASE_03_PATH,
      x: 0,
      y: 0,
      depth: -2
    });
    this.ensurePhaseSupportImmediate({
      id: "agua_solo",
      textureKey: FLUXO_AGUA_SOLO_FASE_03_KEY,
      path: FLUXO_AGUA_SOLO_FASE_03_PATH,
      x: 0,
      y: 0,
      depth: -16
    });
  }

  private applyPhase4CompletedVisualState(): void {
    this.setSceneBackground(BACKGROUND_RESTORED_FASE_04_KEY);
    this.setCascataOverlayImmediate(CASCATA_FASE_04_KEY);
    this.setPhaseElementTextureImmediate("flores_morta", GERADOR_CERTO_FASE_04_KEY, -10);
    this.setPhaseElementTextureImmediate("arvores_mortas", ARVORES_ROCHAS_FASE_04_KEY, -15);
    this.ensurePhaseSupportImmediate({
      id: "vaso_solo",
      textureKey: SOLO_BOMBA_FASE_04_KEY,
      path: SOLO_BOMBA_FASE_04_PATH,
      x: 0,
      y: 0,
      depth: -3
    });
    this.ensurePhaseSupportImmediate({
      id: "agua_flor",
      textureKey: FLUXO_AGUA_SENSOR_FASE_04_KEY,
      path: FLUXO_AGUA_SENSOR_FASE_04_PATH,
      x: 0,
      y: 0,
      depth: -2
    });
    this.ensurePhaseSupportImmediate({
      id: "agua_solo",
      textureKey: FLUXO_AGUA_SOLO_FASE_04_KEY,
      path: FLUXO_AGUA_SOLO_FASE_04_PATH,
      x: 0,
      y: 0,
      depth: -16
    });
  }

  private setSceneBackground(textureKey: string): void {
    this.fullscreenRestoredBackground?.setTexture(textureKey);
    this.fullscreenCorruptedBackground?.setAlpha(0);
    this.fullscreenRestoredBackground?.setAlpha(1);
  }

  private setCascataOverlayImmediate(textureKey: string): void {
    if (!this.cascataOverlay) {
      const overlay = this.add
        .image(0, 0, textureKey)
        .setOrigin(0, 0)
        .setDepth(this.getCascataOverlayDepth(textureKey))
        .setAlpha(1);
      this.cascataOverlay = overlay;
      this.phaseBackgroundLayers.push(overlay);
      return;
    }

    this.tweens.killTweensOf(this.cascataOverlay);
    this.cascataOverlay
      .setTexture(textureKey)
      .setPosition(0, 0)
      .setOrigin(0, 0)
      .setScale(1)
      .setDepth(this.getCascataOverlayDepth(textureKey))
      .setAlpha(1)
      .clearTint();
  }

  private setPhaseElementTextureImmediate(elementId: string, textureKey: string, depth: number): void {
    const view = this.phaseElements.get(elementId);
    if (!view) {
      return;
    }

    this.tweens.killTweensOf(view.image);
    view.image
      .setTexture(textureKey)
      .setPosition(0, 0)
      .setOrigin(0, 0)
      .setScale(1)
      .setAngle(0)
      .setDepth(depth)
      .setAlpha(1)
      .clearTint();
  }

  private ensurePhaseSupportImmediate(config: PhaseElementConfig): void {
    const existingSupport = this.phaseElements.get(config.id);
    if (!existingSupport) {
      this.createPhaseElementFromConfig(config);
      return;
    }

    this.tweens.killTweensOf(existingSupport.image);
    existingSupport.image
      .setTexture(config.textureKey)
      .setPosition(config.x, config.y)
      .setOrigin(0, 0)
      .setScale(1)
      .setAngle(config.angle ?? 0)
      .setDepth(config.depth ?? existingSupport.image.depth)
      .setAlpha(1)
      .clearTint();
  }

  private applyPhaseEntryAssets(): void {
    if (this.currentSubLevel !== 4) {
      return;
    }

    const floresView = this.phaseElements.get("flores_morta");
    floresView?.image
      .setTexture(GERADOR_FASE_04_KEY)
      .setPosition(0, 0)
      .setOrigin(0, 0)
      .setScale(1)
      .setAngle(0)
      .setDepth(-10)
      .setAlpha(1)
      .clearTint();

    const arvoresView = this.phaseElements.get("arvores_mortas");
    arvoresView?.image
      .setTexture(ARVORES_ROCHAS_FASE_04_KEY)
      .setPosition(0, 0)
      .setOrigin(0, 0)
      .setScale(1)
      .setAngle(0)
      .setDepth(-15)
      .setAlpha(1)
      .clearTint();

    const soloView = this.phaseElements.get("vaso_solo");
    soloView?.image
      .setTexture(SOLO_BOMBA_FASE_04_KEY)
      .setPosition(0, 0)
      .setOrigin(0, 0)
      .setScale(1)
      .setAngle(0)
      .setDepth(-3)
      .setAlpha(1)
      .clearTint();
  }

  private applyPhaseVisualTheme(): void {
    if (this.currentSubLevel >= 6) {
      this.phaseElements.forEach((element) => {
        element.image.clearTint().setAlpha(1);
      });
      return;
    }

    if (this.currentSubLevel === 5) {
      this.phaseElements.forEach((element) => {
        element.image.setTint(0xb8fbff);
      });
      return;
    }

    if (this.currentSubLevel !== 4) {
      return;
    }
  }

  private restoreTopic(output: string): void {
    if (this.restoredTopics.has(output)) {
      return;
    }

    this.restoredTopics.add(output);
    this.activateComputationalFlowForOutput(output);
    this.activateEnergySync(output);

    if (this.currentSubLevel === 6 && output === "Flores") {
      this.setCascataOverlayTexture(CASCATA_FASE_06_KEY);
      this.ensurePhaseSupportImmediate({
        id: "agua_flor",
        textureKey: this.textures.exists(FLUXO_AGUA_SENSOR_FASE_06_KEY)
          ? FLUXO_AGUA_SENSOR_FASE_06_KEY
          : FLUXO_AGUA_SENSOR_FASE_04_KEY,
        path: this.textures.exists(FLUXO_AGUA_SENSOR_FASE_06_KEY)
          ? FLUXO_AGUA_SENSOR_FASE_06_PATH
          : FLUXO_AGUA_SENSOR_FASE_04_PATH,
        x: 0,
        y: 0,
        depth: -2
      });
    }

    if (!this.firstRestoreDecorationShown && (this.currentSubLevel !== 6 || output === "Flores")) {
      const firstCascataTexture =
        this.currentSubLevel === 6 && output === "Flores"
          ? CASCATA_FASE_06_KEY
          : this.currentSubLevel === 4 && output === "Solo"
            ? CASCATA_FASE_04_KEY
            : this.getCurrentCascataTextureKey();
      this.time.addEvent({
        delay: 400,
        callback: () => {
          this.showCascataOverlay(firstCascataTexture);
        }
      });
      this.firstRestoreDecorationShown = true;
    }

    if (output === "Solo" && this.currentSubLevel !== 2 && this.currentSubLevel !== 4 && this.currentSubLevel < 6) {
      this.tweens.add({
        targets: this.fullscreenCorruptedBackground,
        alpha: 0,
        duration: 900,
        ease: "Sine.Out"
      });
      this.tweens.add({
        targets: this.fullscreenRestoredBackground,
        alpha: 1,
        duration: 900,
        ease: "Sine.Out"
      });
    }

    if (this.currentSubLevel === 2 && this.areAllCurrentMetasComplete()) {
      this.fullscreenRestoredBackground?.setTexture(BACKGROUND_RESTORED_FASE_02_KEY);
      this.tweens.add({
        targets: this.fullscreenCorruptedBackground,
        alpha: 0,
        duration: 900,
        ease: "Sine.Out"
      });
      this.tweens.add({
        targets: this.fullscreenRestoredBackground,
        alpha: 1,
        duration: 900,
        ease: "Sine.Out"
      });
    }

    if (this.currentSubLevel === 4 && output === "Solo") {
      this.setCascataOverlayTexture(CASCATA_FASE_04_KEY);
    }

    if (this.currentSubLevel === 4 && this.areAllCurrentMetasComplete()) {
      this.fullscreenRestoredBackground?.setTexture(BACKGROUND_RESTORED_FASE_04_KEY);
      this.tweens.add({
        targets: this.fullscreenCorruptedBackground,
        alpha: 0,
        duration: 900,
        ease: "Sine.Out"
      });
      this.tweens.add({
        targets: this.fullscreenRestoredBackground,
        alpha: 1,
        duration: 900,
        ease: "Sine.Out"
      });
    }

    if (this.currentSubLevel === 6 && this.areAllCurrentMetasComplete()) {
      this.fullscreenRestoredBackground?.setTexture(BACKGROUND_RESTORED_FASE_06_KEY);
      this.tweens.add({
        targets: this.fullscreenCorruptedBackground,
        alpha: 0,
        duration: 900,
        ease: "Sine.Out"
      });
      this.tweens.add({
        targets: this.fullscreenRestoredBackground,
        alpha: 1,
        duration: 900,
        ease: "Sine.Out"
      });
    }

    this.applyPhase3RestoreAssets(output);

    const deadSprites = this.currentSubLevel === 6
      ? []
      : [...this.phaseElements.values()]
      .filter((element) => {
        if (this.currentSubLevel === 3 && (output === "Flores" || output === "Arvores")) {
          return false;
        }

        if (this.currentSubLevel === 4 && output === "Arvores") {
          return false;
        }

        return element.image.getData("output") === output && element.image.getData("restoreTextureKey");
      })
      .map((element) => element.image);

    deadSprites.forEach((deadSprite, index) => {
      this.time.addEvent({
        delay: (index + 1) * 400,
        callback: () => {
          if (!deadSprite.scene) {
            return;
          }

          this.restoreElement(deadSprite);
        }
      });
    });

    const supportConfigs = this.getRestoreSupportConfigs(output);

    supportConfigs.forEach((config, index) => {
      this.time.addEvent({
        delay: (deadSprites.length + index + 1) * 400,
        callback: () => {
          const existingSupport = this.phaseElements.get(config.id);
          if (existingSupport) {
            if (this.currentSubLevel === 2 || this.currentSubLevel === 3 || this.currentSubLevel === 4) {
              this.transitionImageTexture(
                existingSupport.image,
                config.textureKey,
                () => {
                  existingSupport.image
                    .setPosition(0, 0)
                    .setOrigin(0, 0)
                    .setScale(1)
                    .setAngle(config.angle ?? 0)
                    .setDepth(config.depth ?? existingSupport.image.depth)
                    .clearTint();
                },
                760
              );
            }
            return;
          }

          const image = this.createPhaseElementFromConfig(config, 0);
          this.fadeImageIn(image, 760);
        }
      });
    });
  }

  private areAllCurrentMetasComplete(): boolean {
    const metas = biomaStoreApi.getState().metas;
    return metas.length > 0 && metas.every((meta) => meta.current === meta.goal);
  }

  private applyPhase3RestoreAssets(output: string): void {
    if (this.currentSubLevel !== 3 || output !== "Solo") {
      return;
    }

    const arvoresView = this.phaseElements.get("arvores_mortas");
    if (!arvoresView) {
      return;
    }

    this.transitionImageTexture(
      arvoresView.image,
      ARVORES_RAIZES_FASE_03_KEY,
      () => {
        arvoresView.image
          .setPosition(0, 0)
          .setOrigin(0, 0)
          .setScale(1)
          .setAngle(0)
          .setDepth(-3)
          .clearTint();
      },
      760
    );
  }

  private getRestoreSupportConfigs(output: string): PhaseElementConfig[] {
    if (this.currentSubLevel === 4) {
      if (output === "Arvores") {
        return [
          {
            id: "agua_flor",
            textureKey: FLUXO_AGUA_SENSOR_FASE_04_KEY,
            path: FLUXO_AGUA_SENSOR_FASE_04_PATH,
            x: 0,
            y: 0,
            depth: -2
          },
          {
            id: "agua_solo",
            textureKey: FLUXO_AGUA_SOLO_FASE_04_KEY,
            path: FLUXO_AGUA_SOLO_FASE_04_PATH,
            x: 0,
            y: 0,
            depth: -16
          }
        ];
      }

      return [];
    }

    if (this.currentSubLevel === 3) {
      if (output === "Flores") {
        return [
          {
            id: "agua_flor",
            textureKey: FLUXO_AGUA_SENSOR_FASE_03_KEY,
            path: FLUXO_AGUA_SENSOR_FASE_03_PATH,
            x: 0,
            y: 0,
            depth: -2
          }
        ];
      }

      if (output === "Arvores") {
        return [
          {
            id: "agua_solo",
            textureKey: FLUXO_AGUA_SOLO_FASE_03_KEY,
            path: FLUXO_AGUA_SOLO_FASE_03_PATH,
            x: 0,
            y: 0,
            depth: -16
          }
        ];
      }

      return [];
    }

    if (this.currentSubLevel === 6) {
      if (output === "Flores") {
        return [
          {
            id: "agua_flor",
            textureKey: this.textures.exists(FLUXO_AGUA_SENSOR_FASE_06_KEY)
              ? FLUXO_AGUA_SENSOR_FASE_06_KEY
              : FLUXO_AGUA_SENSOR_FASE_04_KEY,
            path: this.textures.exists(FLUXO_AGUA_SENSOR_FASE_06_KEY)
              ? FLUXO_AGUA_SENSOR_FASE_06_PATH
              : FLUXO_AGUA_SENSOR_FASE_04_PATH,
            x: 0,
            y: 0,
            depth: -2
          }
        ];
      }

      return [];
    }

    if (this.currentSubLevel !== 2) {
      return RESTORE_SUPPORT_CONFIGS[output] ?? [];
    }

    if (output === "Flores") {
      return [
        {
          id: "agua_flor",
          textureKey: FLUXO_AGUA_SENSOR_FASE_02_KEY,
          path: FLUXO_AGUA_SENSOR_FASE_02_PATH,
          x: 0,
          y: 0,
          depth: -2
        }
      ];
    }

    if (output === "Solo") {
      return [
        {
          id: "vaso_solo",
          textureKey: SOLO_RESERVATORIO_FASE_02_KEY,
          path: SOLO_RESERVATORIO_FASE_02_PATH,
          x: 0,
          y: 0,
          depth: -3
        },
        {
          id: "agua_solo",
          textureKey: FLUXO_AGUA_SOLO_FASE_02_KEY,
          path: FLUXO_AGUA_SOLO_FASE_02_PATH,
          x: 0,
          y: 0,
          depth: -16
        }
      ];
    }

    return RESTORE_SUPPORT_CONFIGS[output] ?? [];
  }

  private getRestoreTextureKey(output: string | undefined, defaultTextureKey: string): string {
    if (this.currentSubLevel === 4 && output === "Flores") {
      return GERADOR_CERTO_FASE_04_KEY;
    }

    if (this.currentSubLevel === 3 && output === "Arvores") {
      return ARVORES_RAIZES_FASE_03_KEY;
    }

    if (this.currentSubLevel !== 2) {
      return defaultTextureKey;
    }

    if (output === "Flores") {
      return FLOR_SENSOR_FASE_02_KEY;
    }

    if (output === "Arvores") {
      return ARVORES_TURBINA_FASE_02_KEY;
    }

    return defaultTextureKey;
  }

  private restoreElement(deadSprite: Phaser.GameObjects.Image): void {
    const restoreTextureKey = deadSprite.getData("restoreTextureKey") as string | undefined;
    const elementId = deadSprite.getData("elementId") as string | undefined;
    if (!restoreTextureKey || !elementId) {
      return;
    }

    const currentView = this.phaseElements.get(elementId);
    if (!currentView) {
      return;
    }

    const output = deadSprite.getData("output") as string | undefined;
    const restoredTextureKey = this.getRestoreTextureKey(output, restoreTextureKey);
    deadSprite.setTexture(restoredTextureKey);
    deadSprite.setPosition(0, 0);
    deadSprite.setOrigin(0, 0);
    deadSprite.setScale(1);
    deadSprite.setAlpha(0);

    if (deadSprite.getData("output") === "Arvores") {
      deadSprite.setDepth(-3);
    }

    if (this.currentSubLevel === 3) {
      deadSprite.setTint(0xb8fbff);
    }

    if (this.currentSubLevel === 4) {
      const output = deadSprite.getData("output") as string | undefined;
      if (output === "Arvores") {
        this.time.addEvent({
          delay: 420,
          loop: true,
          callback: () => {
            if (this.currentSubLevel !== 4 || !deadSprite.scene) {
              return;
            }
            this.createElectricParticlesAt(this.scale.width * 0.42, this.scale.height * 0.38, 2);
          }
        });
      }
    }

    this.tweens.add({
      targets: deadSprite,
      alpha: 1,
      duration: 760,
      ease: "Sine.Out"
    });
  }

  private handleReset(): void {
    this.time.removeAllEvents();
    this.setupLevel(this.currentSubLevel);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.layoutScene(gameSize.width, gameSize.height);
  }

  private layoutScene(width: number, height: number): void {
    this.playfieldBounds = this.computePlayfieldBounds(width, height);
    this.layoutFullscreenBackground();
    this.topHudContainer.setPosition(SIDE_PADDING, TOP_PADDING);
    this.missionPanelContainer?.setPosition(SIDE_PADDING, TOP_PADDING + 94);
    this.updateAuxiliaryTextVisibility();

    this.redrawRobotPanel();
    const robotPanelWidth = this.getRobotPanelWidth();
    const panelX = Phaser.Math.Clamp(
      width - SIDE_PADDING - robotPanelWidth,
      SIDE_PADDING,
      Math.max(SIDE_PADDING, this.playfieldBounds.right - robotPanelWidth)
    );
    const panelY = height - BOTTOM_PADDING - ROBOT_PANEL_HEIGHT;
    this.panelContainer.setPosition(panelX, panelY);

    if (this.resultText) {
      this.resultText.setPosition(SIDE_PADDING, TOP_PADDING + (this.currentSubLevel === 1 ? 294 : 70));
    }

    this.nextButton?.setPosition(width - SIDE_PADDING - 36, height - BOTTOM_PADDING - 36);
    this.homeButton?.setPosition(SIDE_PADDING + 36, height - BOTTOM_PADDING - 36);

    this.layoutPhaseElements();
    this.layoutSlotZones();
    this.layoutComputationalFlowVisuals();
    this.layoutPhase6EnergyNetwork();
    this.redrawEcosystemHealthBar(this.getCurrentEcosystemHealth());
    this.layoutEnergyPanel();
  }

  private layoutPhaseElements(): void {
    this.phaseElements.forEach((element) => {
      element.image.setPosition(0, 0);
      element.image.setOrigin(0, 0);
      element.image.setScale(1);
    });
  }

  private layoutSlotZones(): void {
    this.slotViews.forEach((slotView) => {
      const slotX = this.scale.width * slotView.anchorX;
      const slotY = this.scale.height * slotView.anchorY;
      slotView.slot.x = slotX;
      slotView.slot.y = slotY;

      slotView.zone.setSize(SLOT_ZONE_WIDTH, SLOT_ZONE_HEIGHT);
      slotView.zone.setRectangleDropZone(SLOT_ZONE_WIDTH, SLOT_ZONE_HEIGHT);
      slotView.zone.setPosition(slotX, slotY);
      slotView.plaque.setPosition(slotX, slotY);
      slotView.labelText.setPosition(slotX, slotY + SLOT_LABEL_OFFSET_Y);
      slotView.progressText.setPosition(slotX, slotY + SLOT_PROGRESS_OFFSET_Y);
      slotView.progressText.setFontSize(20);
      slotView.meterBackground.setPosition(slotX, slotY + SLOT_METER_OFFSET_Y);
      slotView.meterBackground.setDisplaySize(SLOT_METER_WIDTH, SLOT_METER_HEIGHT);
      slotView.meterFill.setPosition(slotX - SLOT_METER_FILL_WIDTH / 2, slotY + SLOT_METER_OFFSET_Y);
      slotView.meterFill.height = SLOT_METER_FILL_HEIGHT;
      slotView.valueText.setPosition(slotX, slotY + SLOT_VALUE_OFFSET_Y);
      slotView.valueText.setFontSize(36);
      slotView.labelText.setFontSize(20);
    });
  }

  private getCurrentLevelProgressId(): string {
    return `${this.biomeId}-fase-${this.currentSubLevel}`;
  }

  private getCurrentEcosystemHealth(): number {
    return biomaStoreApi.getState().saudeGlobalDoEcossistema;
  }

  private layoutEnergyPanel(): void {
    if (!this.energyPanelContainer || !this.energyPanelFrame) {
      return;
    }

    const healthCenterX = this.scale.width - SIDE_PADDING - HEALTH_RING_RADIUS - 22;
    const x = healthCenterX - ENERGY_PANEL_WIDTH / 2;
    const y = TOP_PADDING + (HEALTH_RING_RADIUS + 16) * 2 + 26;
    this.energyPanelContainer.setPosition(x, y);
    this.redrawEnergyPanel();
  }

  private redrawEnergyPanel(): void {
    if (!this.energyPanelFrame || !this.energyPercentText || !this.energyPanelContainer) {
      return;
    }

    const isActive = this.currentSubLevel >= 3 && Boolean(this.maxMoves);
    this.energyPanelContainer.setVisible(isActive);

    this.energyPanelFrame.clear();
    if (!isActive) {
      return;
    }

    this.energyPanelFrame.fillStyle(0x050403, 0.35);
    this.energyPanelFrame.fillRoundedRect(-7, -7, ENERGY_PANEL_WIDTH + 14, ENERGY_PANEL_HEIGHT + 14, 8);
    this.energyPanelFrame.fillStyle(0x17120e, 0.98);
    this.energyPanelFrame.fillRoundedRect(0, 0, ENERGY_PANEL_WIDTH, ENERGY_PANEL_HEIGHT, 8);
    this.energyPanelFrame.lineStyle(8, 0x3a2a19, 1);
    this.energyPanelFrame.strokeRoundedRect(4, 4, ENERGY_PANEL_WIDTH - 8, ENERGY_PANEL_HEIGHT - 8, 7);
    this.energyPanelFrame.lineStyle(3, 0x9d7834, 1);
    this.energyPanelFrame.strokeRoundedRect(10, 10, ENERGY_PANEL_WIDTH - 20, ENERGY_PANEL_HEIGHT - 20, 5);

    this.energyPanelFrame.fillStyle(0x2a2117, 0.96);
    this.energyPanelFrame.fillRoundedRect(17, 13, ENERGY_PANEL_WIDTH - 34, 28, 4);
    this.energyPanelFrame.lineStyle(1, 0xdfb85a, 0.85);
    this.energyPanelFrame.strokeRoundedRect(18, 14, ENERGY_PANEL_WIDTH - 36, 26, 3);

    this.energyPanelFrame.fillStyle(0x080b0a, 0.98);
    this.energyPanelFrame.fillCircle(ENERGY_PANEL_WIDTH / 2, 86, 39);
    this.energyPanelFrame.lineStyle(6, 0x302a24, 1);
    this.energyPanelFrame.strokeCircle(ENERGY_PANEL_WIDTH / 2, 86, 41);
    this.energyPanelFrame.lineStyle(2, 0xc09b4f, 0.95);
    this.energyPanelFrame.strokeCircle(ENERGY_PANEL_WIDTH / 2, 86, 34);
    this.energyPanelFrame.lineStyle(3, 0x5dff8d, 0.2);
    this.energyPanelFrame.strokeCircle(ENERGY_PANEL_WIDTH / 2, 86, 29);

    this.energyPanelFrame.fillStyle(0x211b14, 0.72);
    this.energyPanelFrame.fillRoundedRect(14, 158, ENERGY_PANEL_WIDTH - 28, 34, 5);

    const remainingClicks = Math.max(0, (this.maxMoves ?? 0) - this.currentMoves);
    const totalClicks = Math.max(0, this.maxMoves ?? 0);
    const energyPercent = totalClicks > 0 ? Math.round((remainingClicks / totalClicks) * 100) : 0;
    this.energyPercentText.setText(`${energyPercent}%`);

    this.energyClickBars.forEach((bar, index) => {
      const existsInPhase = index < totalClicks;
      const isAvailable = index < remainingClicks;
      bar.setVisible(existsInPhase);
      if (!existsInPhase) {
        this.tweens.killTweensOf(bar);
        bar.setData("glowing", false);
        bar.setScale(1);
        return;
      }

      bar.setFillStyle(isAvailable ? 0x57ff84 : 0x1b241c, isAvailable ? 0.95 : 0.75);
      bar.setStrokeStyle(1, isAvailable ? 0xb4ffd0 : 0x394238, isAvailable ? 0.95 : 0.7);

      if (isAvailable) {
        if (!bar.getData("glowing")) {
          this.tweens.add({
            targets: bar,
            scaleX: 1.08,
            scaleY: 1.08,
            alpha: 0.78,
            duration: 820,
            yoyo: true,
            repeat: -1,
            ease: "Sine.InOut"
          });
        }
        bar.setData("glowing", true);
        return;
      }

      bar.setData("glowing", false);
      this.tweens.killTweensOf(bar);
      bar.setScale(1, 1);
      bar.setAlpha(1);
    });
  }

  private redrawEcosystemHealthBar(ecosystemHealth: number): void {
    if (!this.ecosystemHealthBackground || !this.ecosystemHealthFill || !this.ecosystemHealthText) {
      return;
    }

    const progress = Phaser.Math.Clamp(ecosystemHealth / 100, 0, 1);
    const x = this.scale.width - SIDE_PADDING - HEALTH_RING_RADIUS - 22;
    const y = TOP_PADDING + HEALTH_RING_RADIUS + 14;
    const startAngle = Phaser.Math.DegToRad(-90);
    const endAngle = startAngle + Phaser.Math.PI2 * progress;

    this.ecosystemHealthBackground.clear();
    this.ecosystemHealthBackground.fillStyle(0x050b10, 0.88);
    this.ecosystemHealthBackground.fillCircle(x, y, HEALTH_RING_RADIUS + 16);
    this.ecosystemHealthBackground.fillStyle(0x0a1d20, 0.96);
    this.ecosystemHealthBackground.fillCircle(x, y, HEALTH_RING_RADIUS + 4);
    this.ecosystemHealthBackground.lineStyle(HEALTH_RING_THICKNESS + 8, 0x7affc8, 0.1);
    this.ecosystemHealthBackground.strokeCircle(x, y, HEALTH_RING_RADIUS);
    this.ecosystemHealthBackground.lineStyle(HEALTH_RING_THICKNESS + 2, 0x142730, 0.92);
    this.ecosystemHealthBackground.strokeCircle(x, y, HEALTH_RING_RADIUS);

    this.ecosystemHealthFill.clear();
    if (progress > 0) {
      this.ecosystemHealthFill.lineStyle(HEALTH_RING_THICKNESS + 12, 0x54ffd1, 0.14);
      this.ecosystemHealthFill.beginPath();
      this.ecosystemHealthFill.arc(x, y, HEALTH_RING_RADIUS, startAngle, endAngle, false);
      this.ecosystemHealthFill.strokePath();

      this.ecosystemHealthFill.lineStyle(HEALTH_RING_THICKNESS + 6, 0x42ffd1, 0.22);
      this.ecosystemHealthFill.beginPath();
      this.ecosystemHealthFill.arc(x, y, HEALTH_RING_RADIUS, startAngle, endAngle, false);
      this.ecosystemHealthFill.strokePath();

      this.ecosystemHealthFill.lineStyle(HEALTH_RING_THICKNESS, 0x47ffd0, 0.98);
      this.ecosystemHealthFill.beginPath();
      this.ecosystemHealthFill.arc(x, y, HEALTH_RING_RADIUS, startAngle, endAngle, false);
      this.ecosystemHealthFill.strokePath();
    }

    this.ecosystemHealthText.setPosition(x, y);
    this.ecosystemHealthText.setText(`${ecosystemHealth}%`);
    this.ecosystemHealthBackground.setDepth(20);
    this.ecosystemHealthFill.setDepth(20);
    this.ecosystemHealthText.setDepth(20);
    this.redrawEnergyPanel();
  }

  private layoutFullscreenBackground(): void {
    if (!this.fullscreenCorruptedBackground || !this.fullscreenRestoredBackground) {
      return;
    }

    const layers: Phaser.GameObjects.Image[] = [
      this.fullscreenCorruptedBackground,
      this.fullscreenRestoredBackground,
      ...this.phaseBackgroundLayers
    ];

    if (this.cascataOverlay) {
      layers.push(this.cascataOverlay);
    }

    layers.forEach((layer) => {
      const source = layer.texture.getSourceImage() as { width?: number; height?: number };
      const sourceWidth = source.width ?? BASE_WIDTH;
      const sourceHeight = source.height ?? BASE_HEIGHT;

      layer.setPosition(0, 0);
      layer.setOrigin(0, 0);
      layer.setScale(1);
      layer.setSize(sourceWidth, sourceHeight);
    });
  }

  private computePlayfieldBounds(width: number, height: number): Phaser.Geom.Rectangle {
    const availableWidth = Math.max(280, width - PLAYFIELD_SIDE_MARGIN * 2);
    const availableHeight = Math.max(240, height - PLAYFIELD_TOP_OFFSET - BOTTOM_PADDING);
    const scale = Math.min(availableWidth / BASE_WIDTH, availableHeight / BASE_HEIGHT);
    const playfieldWidth = BASE_WIDTH * scale;
    const playfieldHeight = BASE_HEIGHT * scale;
    const x = (width - playfieldWidth) / 2;
    const y = PLAYFIELD_TOP_OFFSET + (availableHeight - playfieldHeight) / 2;

    return new Phaser.Geom.Rectangle(x, y, playfieldWidth, playfieldHeight);
  }

  private clearDynamicLevelObjects(): void {
    this.clearRobotIntroduction();
    this.closeDebugPopup();
    this.clearPredictionPreview();
    this.slotObjects.forEach((object) => object.destroy());
    this.slotObjects = [];
    this.slotViews.clear();
    this.clearDraggedRobotPreview();

    this.panelDynamicObjects.forEach((object) => object.destroy());
    this.panelDynamicObjects = [];
    this.robotButtons.clear();
    this.moveCounterText = undefined;
    this.clearComputationalFlowVisuals();
  }

  private getPendingRestoreDuration(): number {
    let pendingDuration = 0;
    const metas = biomaStoreApi.getState().metas;

    if (!this.firstRestoreDecorationShown) {
      pendingDuration = Math.max(pendingDuration, 700);
    }

    metas.forEach((meta: MetaDeBioma) => {
      if (meta.current !== meta.goal) {
        return;
      }

      const deadSpritesCount = [...this.phaseElements.values()].filter(
        (element) => element.image.getData("output") === meta.output && element.image.getData("restoreTextureKey")
      ).length;
      const missingSupportCount = (RESTORE_SUPPORT_CONFIGS[meta.output] ?? []).filter(
        (config) => !this.phaseElements.has(config.id)
      ).length;
      const totalSteps = deadSpritesCount + missingSupportCount;

      if (totalSteps > 0) {
        pendingDuration = Math.max(pendingDuration, totalSteps * 400 + 300);
      }
    });

    return pendingDuration;
  }

  private scheduleNextSubLevel(nextLevel: number, delayMs: number): void {
    if (this.autoReturnScheduled) {
      return;
    }

    this.autoReturnScheduled = true;
    this.nextButton?.setVisible(false).disableInteractive();
    this.homeButton?.disableInteractive();

    this.autoReturnTimeoutId = window.setTimeout(() => {
      this.autoReturnTimeoutId = undefined;
      this.homeButton?.setInteractive({ useHandCursor: true });
      this.setupLevel(nextLevel, { preservePhaseVisuals: true });
      this.autoReturnScheduled = false;
    }, delayMs);
  }

  private scheduleReturnToWorldMap(delayMs: number): void {
    if (this.autoReturnScheduled) {
      return;
    }

    this.autoReturnScheduled = true;
    this.nextButton?.setVisible(false).disableInteractive();
    this.homeButton?.disableInteractive();

    this.autoReturnTimeoutId = window.setTimeout(() => {
      this.autoReturnTimeoutId = undefined;
      this.cameras.main.fadeOut(650, 8, 14, 22);
      this.time.delayedCall(700, () => {
        this.autoReturnScheduled = false;
        this.scene.start("WorldMapScene");
      });
    }, delayMs);
  }

}

