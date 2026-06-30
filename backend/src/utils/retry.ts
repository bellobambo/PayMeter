type RetryOptions = {
  retries: number;
  delayMs: number;
};

export async function retry<T>(operation: () => Promise<T>, { retries, delayMs }: RetryOptions): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await wait(delayMs);
      }
    }
  }

  throw lastError;
}

function wait(delayMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}
