/**
 * 8xM Minting Client
 *
 * Connects 8xm.fun (Cloudflare) to minting backends (Replit).
 * Automatic failover between endpoints.
 */

export interface LaunchTokenParams {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  totalSupply: number;
  creatorWallet: string;
  decimals?: number;
  royaltyPercent?: number;
  nationName?: string;
  tek8Guild?: string;
  roadId?: string;
  metadataUri?: string;
}

export interface LaunchTokenResult {
  success: boolean;
  transaction?: string;
  mintKeypair?: string;
  mintAddress?: string;
  error?: string;
  endpoint?: string;
}

// Minting backend endpoints (Replit projects)
const MINTING_ENDPOINTS = [
  'https://quillverse.org/api/8xm',
  'https://paladinking.com/api/8xm',
  'https://ximura.org/api/8xm',
];

/**
 * Request minting from available backends with failover
 */
async function requestMinting<T>(
  path: string,
  body?: any
): Promise<T & { endpoint: string }> {
  const errors: string[] = [];

  for (const endpoint of MINTING_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const error = await response.text();
        errors.push(`${endpoint}: ${response.status} - ${error}`);
        continue;
      }

      const data = await response.json();
      return { ...data, endpoint };

    } catch (error: any) {
      errors.push(`${endpoint}: ${error.message}`);
      continue;
    }
  }

  throw new Error(`All minting endpoints unavailable: ${errors.join('; ')}`);
}

/**
 * Build a token launch transaction via minting backend
 */
export async function buildLaunchTransaction(
  params: LaunchTokenParams
): Promise<LaunchTokenResult> {
  try {
    return await requestMinting<LaunchTokenResult>('/launch', params);
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify a transaction was confirmed
 */
export async function verifyTransaction(signature: string): Promise<boolean> {
  try {
    const result = await requestMinting<{ verified: boolean }>('/verify', { signature });
    return result.verified;
  } catch {
    return false;
  }
}

/**
 * Check health of minting backends
 */
export async function checkMintingHealth(): Promise<{
  healthy: boolean;
  endpoint?: string;
  errors?: string[];
}> {
  const errors: string[] = [];

  for (const endpoint of MINTING_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        return { healthy: true, endpoint };
      }
      errors.push(`${endpoint}: ${response.status}`);
    } catch (error: any) {
      errors.push(`${endpoint}: ${error.message}`);
    }
  }

  return { healthy: false, errors };
}
