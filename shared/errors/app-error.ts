export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class ExternalApiError extends AppError {
  constructor(service: string, statusCode: number, detail: string) {
    super(`${service} API 오류: ${detail}`, 502, "EXTERNAL_API_ERROR");
    this.name = "ExternalApiError";
  }
}

export class ConfigError extends AppError {
  constructor(message: string) {
    super(message, 503, "CONFIG_ERROR");
    this.name = "ConfigError";
  }
}
