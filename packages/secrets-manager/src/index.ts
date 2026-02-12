import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager'

export class SecretsManagerError extends Error {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'SecretsManagerError'
  }
}

/**
 * Fetches and parses a JSON secret from AWS Secrets Manager.
 * @param secretName The name or ARN of the secret.
 * @param region The AWS region (default: us-east-1).
 * @returns The parsed secret as type T.
 */
export async function getSecret<T>(
  secretName: string,
  region: string = 'us-east-1',
  clientOverride?: SecretsManagerClient
): Promise<T> {
  const client = clientOverride || new SecretsManagerClient({ region })

  try {
    const command = new GetSecretValueCommand({ SecretId: secretName })
    const response = await client.send(command)

    if (!response.SecretString) {
      throw new SecretsManagerError(`Secret ${secretName} has no SecretString`)
    }

    try {
      return JSON.parse(response.SecretString) as T
    } catch (error) {
      throw new SecretsManagerError(
        `Failed to parse secret ${secretName} as JSON`,
        error
      )
    }
  } catch (error) {
    if (error instanceof SecretsManagerError) {
      throw error
    }
    throw new SecretsManagerError(
      `Failed to fetch secret ${secretName}: ${(error as Error).message}`,
      error
    )
  }
}

export function formatAsPem(
  key: string,
  keyType: string = 'PUBLIC KEY'
): string {
  const BEGIN = `-----BEGIN ${keyType}-----`
  const END = `-----END ${keyType}-----`

  // Strip ANY existing PEM headers, footers and all whitespace
  const body = key
    .replaceAll(/-----BEGIN [^-]+-----/g, '')
    .replaceAll(/-----END [^-]+-----/g, '')
    .replaceAll(/\s+/g, '')

  return `${BEGIN}\n${body}\n${END}`
}

export { SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
