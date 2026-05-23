import type { LevelConfig } from "../levels/types";

export type TipoDeOperacao = "adicao" | "divisao";

export type ComandoDeFluxo = {
  slotId: string;
  output: string;
  operation: TipoDeOperacao;
};

export type TentativaFalhaLog = {
  input: number[];
  calculoObtido: number[];
  meta: number[];
  createdAt: string;
};

export type FlowValidationResult = {
  success: boolean;
  outputs: Record<string, number>;
  expected: Record<string, number>;
};

export class FlowEngine {
  private readonly tentativasFalhas: TentativaFalhaLog[] = [];

  public validarFluxo(levelConfig: LevelConfig, comandos: ComandoDeFluxo[]): FlowValidationResult {
    const outputs = this.calcularSaidas(levelConfig, comandos);
    const expected = this.construirMeta(levelConfig);
    const success = Object.entries(expected).every(([output, goal]) => outputs[output] === goal);

    if (!success) {
      this.logTentativa(
        levelConfig.targets.map((target) => target.initial ?? 0),
        levelConfig.targets.map((target) => outputs[target.output] ?? 0),
        levelConfig.targets.map((target) => target.goal)
      );
    }

    return {
      success,
      outputs,
      expected
    };
  }

  public logTentativa(input: number[], calculoObtido: number[], meta: number[]): void {
    this.tentativasFalhas.push({
      input,
      calculoObtido,
      meta,
      createdAt: new Date().toISOString()
    });
  }

  public getTentativasFalhas(): TentativaFalhaLog[] {
    return [...this.tentativasFalhas];
  }

  public validarOutputs(
    levelConfig: LevelConfig,
    outputs: Record<string, number>
  ): FlowValidationResult {
    const expected = this.construirMeta(levelConfig);
    const success = Object.entries(expected).every(([output, goal]) => (outputs[output] ?? 0) === goal);

    if (!success) {
      this.logTentativa(
        levelConfig.targets.map((target) => target.initial ?? 0),
        levelConfig.targets.map((target) => outputs[target.output] ?? 0),
        levelConfig.targets.map((target) => target.goal)
      );
    }

    return {
      success,
      outputs,
      expected
    };
  }

  private calcularSaidas(levelConfig: LevelConfig, comandos: ComandoDeFluxo[]): Record<string, number> {
    const comandosPorSaida = comandos.reduce<Record<string, ComandoDeFluxo[]>>((acc, command) => {
      acc[command.output] = [...(acc[command.output] ?? []), command];
      return acc;
    }, {});

    return levelConfig.targets.reduce<Record<string, number>>((acc, target) => {
      const valorInicial = target.initial ?? 0;
      const comandosDoAlvo = comandosPorSaida[target.output] ?? [];

      acc[target.output] = comandosDoAlvo.reduce((valorAtual, command) => {
        return command.operation === "adicao" ? valorAtual + 10 : Math.floor(valorAtual / 2);
      }, valorInicial);

      return acc;
    }, {});
  }

  private construirMeta(levelConfig: LevelConfig): Record<string, number> {
    return levelConfig.targets.reduce<Record<string, number>>((acc, target) => {
      acc[target.output] = target.goal;
      return acc;
    }, {});
  }
}
