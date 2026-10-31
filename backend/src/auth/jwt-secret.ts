const MIN_JWT_SECRET_LENGTH = 32;

export function assertJwtSecret(value: string | undefined): string {
  if (!value || value.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be set to a string of at least ${MIN_JWT_SECRET_LENGTH} characters.`,
    );
  }

  return value;
}
