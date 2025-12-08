
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): Response {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const errorMessage = error instanceof Error ? error.message : 'Internal server error';

  return new Response(
    JSON.stringify({ error: errorMessage, code: 'INTERNAL_ERROR' }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
