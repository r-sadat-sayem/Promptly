export interface SerializableAppError {
  code: string;
  userMessage: string;
  technicalMessage?: string;
  canAutoFix?: boolean;
  suggestedAction?: string;
}

export class AppError extends Error {
  code: string;
  userMessage: string;
  technicalMessage?: string;
  canAutoFix: boolean;
  suggestedAction?: string;

  constructor(input: SerializableAppError) {
    super(input.userMessage);
    this.name = 'AppError';
    this.code = input.code;
    this.userMessage = input.userMessage;
    this.technicalMessage = input.technicalMessage;
    this.canAutoFix = Boolean(input.canAutoFix);
    this.suggestedAction = input.suggestedAction;
  }
}

export function toSerializableError(error: unknown): SerializableAppError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      userMessage: error.userMessage,
      technicalMessage: error.technicalMessage,
      canAutoFix: error.canAutoFix,
      suggestedAction: error.suggestedAction,
    };
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  return {
    code: 'UNEXPECTED_ERROR',
    userMessage: 'Promptly hit an unexpected error while processing your request. Please try again.',
    technicalMessage: message,
    canAutoFix: false,
    suggestedAction: 'Retry the operation.',
  };
}
