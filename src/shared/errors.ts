export function notFound(message: string, code: string) {
  return {
    error: { code, message },
  };
}

export function badRequest(message: string, code: string) {
  return {
    error: { code, message },
  };
}

export function conflict(message: string, code: string) {
  return {
    error: { code, message },
  };
}

export function internalError(message = "Erro interno do servidor.") {
  return {
    error: { code: "INTERNAL_ERROR", message },
  };
}
