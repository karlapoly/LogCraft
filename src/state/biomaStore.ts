import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { EstadoDoBioma } from './EstadoDoBioma';

export interface MetaDeBioma {
  output: string;
  initial: number;
  goal: number;
  current: number;
}

export interface BiomaState {
  // Estado
  saudeGlobalDoEcossistema: number;
  ganhoGlobalPendente: number;
  biomasConcluidos: string[];
  metasConcluidasPorNivel: Record<string, number>;
  metas: MetaDeBioma[];
  estadoDoBioma: EstadoDoBioma;
  score: number;

  // Ações para o Phaser (Imperativo) e React (Hooks)
  inicializarNivel: (levelId: string, metasIniciais: MetaDeBioma[]) => void;
  atualizarProgresso: (outputs: Record<string, number>) => void;
  registrarMetasConcluidas: (levelId: string, completedTargets: number, totalWorldTargets: number) => void;
  iniciarRestauracao: () => void;
  concluirRestauracao: (levelId: string) => void;
  consumirGanhoGlobalPendente: () => void;
  resetarFluxo: () => void;
  addScore: (pontos: number) => void;
}

function clampMetaProgress(meta: MetaDeBioma, nextCurrent: number): number {
  const numericCurrent = Math.max(0, nextCurrent);

  if (meta.current === meta.goal) {
    return meta.goal;
  }

  if (meta.initial <= meta.goal) {
    return Math.min(numericCurrent, meta.goal);
  }

  return Math.max(numericCurrent, meta.goal);
}

export const useBiomaStore = create<BiomaState>()(
  subscribeWithSelector((set) => ({
    saudeGlobalDoEcossistema: 0,
    ganhoGlobalPendente: 0,
    biomasConcluidos: [],
    metasConcluidasPorNivel: {},
    metas: [],
    estadoDoBioma: EstadoDoBioma.CORROMPIDO,
    score: 0,

    inicializarNivel: (_levelId: string, metasIniciais: MetaDeBioma[]) => set({
      metas: metasIniciais.map(m => ({ ...m, current: m.initial })),
      estadoDoBioma: EstadoDoBioma.CORROMPIDO
    }),

    atualizarProgresso: (outputs: Record<string, number>) => set((state: BiomaState) => ({
      metas: state.metas.map(meta => {
        const newCurrent = outputs[meta.output] ?? meta.current;
        const numericCurrent = typeof newCurrent === 'number' ? newCurrent : meta.current;
        return {
          ...meta,
          current: clampMetaProgress(meta, numericCurrent)
        };
      })
    })),

    registrarMetasConcluidas: (levelId: string, completedTargets: number, totalWorldTargets: number) => set((state: BiomaState) => {
      const nextCompletedTargetsByLevel = {
        ...state.metasConcluidasPorNivel,
        [levelId]: Math.max(0, completedTargets)
      };
      const globalCompletedTargets = Object.values(nextCompletedTargetsByLevel).reduce((total, count) => total + count, 0);
      const nextHealth = totalWorldTargets > 0
        ? Math.min(100, Math.floor((globalCompletedTargets / totalWorldTargets) * 100))
        : 0;

      return {
        metasConcluidasPorNivel: nextCompletedTargetsByLevel,
        saudeGlobalDoEcossistema: nextHealth
      };
    }),

    iniciarRestauracao: () => set({ estadoDoBioma: EstadoDoBioma.RESTAURANDO }),

    concluirRestauracao: (levelId) => set((state) => {
      // Lógica para incrementar saúde global ao concluir um bioma
      const novosConcluidos = state.biomasConcluidos.includes(levelId)
        ? state.biomasConcluidos
        : [...state.biomasConcluidos, levelId];

      return {
        estadoDoBioma: EstadoDoBioma.RESTAURADO,
        ganhoGlobalPendente: 20,
        biomasConcluidos: novosConcluidos
      };
    }),

    consumirGanhoGlobalPendente: () => set({ ganhoGlobalPendente: 0 }),

    resetarFluxo: () => set((state) => ({
      metas: state.metas.map(m => ({ ...m, current: m.initial })),
      estadoDoBioma: EstadoDoBioma.CORROMPIDO
    })),

    addScore: (pontos) => set((state) => ({ score: state.score + pontos }))
  }))
);

/**
 * biomaStoreApi: A "Ponte" para o Phaser.
 * Permite acesso ao estado sem depender do ciclo de vida do React.
 */
export const biomaStoreApi = {
  getState: () => useBiomaStore.getState(),
  setState: (state: Partial<BiomaState>) => useBiomaStore.setState(state),
  subscribe: (
    callbackOrSelector: ((state: BiomaState, previousState: BiomaState) => void) | ((state: BiomaState) => any),
    maybeCallback?: (value: any, previousValue: any) => void
  ) => {
    // Se receber 2 argumentos, use o padrão selector + callback
    if (maybeCallback) {
      return useBiomaStore.subscribe(
        callbackOrSelector as (state: BiomaState) => any,
        maybeCallback
      );
    }
    // Se receber 1 argumento como callback (state, previousState), use como full state callback
    return useBiomaStore.subscribe(
      (state) => state,
      callbackOrSelector as (value: BiomaState, previousValue: BiomaState) => void
    );
  }
};
