export class RepositoryError extends Error {
  constructor(public readonly code: 'VALIDATION' | 'DUPLICATE' | 'NOT_FOUND' | 'CONFLICT' | 'REFERENCE' | 'IMMUTABLE' | 'OPERATION_REUSED', message: string) {
    super(message);
    this.name = 'RepositoryError';
  }
}
