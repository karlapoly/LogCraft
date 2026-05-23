export type TipoDeOperacaoDaCascata =
  | "adicao"
  | "addition"
  | "divisao"
  | "division"
  | "subtraction"
  | "multiply"
  | "multiplication";

export function isCascataDivisionOperation(operation: TipoDeOperacaoDaCascata): boolean {
  return operation === "divisao" || operation === "division";
}

export function isCascataMultiplicationOperation(operation: TipoDeOperacaoDaCascata): boolean {
  return operation === "multiply" || operation === "multiplication";
}

export function getDefaultCascataOperationValue(operation: TipoDeOperacaoDaCascata): number {
  if (operation === "subtraction") {
    return -10;
  }

  if (isCascataDivisionOperation(operation) || isCascataMultiplicationOperation(operation)) {
    return 2;
  }

  return 10;
}

export function applyCascataOperation(
  value: number,
  operation: TipoDeOperacaoDaCascata,
  operationValue?: number
): number {
  const numericValue = operationValue ?? getDefaultCascataOperationValue(operation);
  if (operation === "adicao" || operation === "addition" || operation === "subtraction") {
    return Math.max(0, value + numericValue);
  }

  if (isCascataMultiplicationOperation(operation)) {
    return Math.max(0, value * Math.max(1, numericValue));
  }

  if (isCascataDivisionOperation(operation)) {
    return value / Math.max(1, numericValue);
  }

  return value;
}
