/**
 * @8xm/sdk - Client Module
 *
 * Lightweight client for frontends to interact with 8xM minting backends.
 * Works on Cloudflare, Vercel, browsers, anywhere.
 *
 * Usage:
 *   import { Client8xM } from '@8xm/sdk/client';
 *
 *   const client = new Client8xM({
 *     endpoints: [
 *       'https://quillverse.org/api/8xm',
 *       'https://paladinking.com/api/8xm',
 *       'https://ximura.org/api/8xm',
 *     ]
 *   });
 *
 *   const result = await client.launchToken({ ... });
 */

export interface Client8xMConfig {
  /**
   * Minting backend endpoints (will try in order, failover to next)
   */
  endpoints: string[];

  /**
   * Optional API key for authenticated requests
   */
  apiKey?: string;

  /**
   * Request timeout in ms (default: 30000)
   */
  timeout?: number;
}

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
  endpoint?: string;  // Which backend handled the request
}

export interface VerifyResult {
  success: boolean;
  verified?: boolean;
  error?: string;
}

export class Client8xM {
  private config: Client8xMConfig;

  constructor(config: Client8xMConfig) {
    if (!config.endpoints || config.endpoints.length === 0) {
      throw new Error('At least one endpoint is required');
    }
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Make a request to the minting backend with automatic failover
   */
  private async request<T>(
    path: string,
    method: 'GET' | 'POST',
    body?: any
  ): Promise<T & { endpoint: string }> {
    const errors: string[] = [];

    for (const endpoint of this.config.endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (this.config.apiKey) {
          headers['X-API-Key'] = this.config.apiKey;
        }

        const response = await fetch(`${endpoint}${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

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

    // All endpoints failed
    throw new Error(`All endpoints failed: ${errors.join('; ')}`);
  }

  /**
   * Build a token launch transaction
   *
   * Returns a partially-signed transaction that the user's wallet needs to sign.
   */
  async launchToken(params: LaunchTokenParams): Promise<LaunchTokenResult> {
    try {
      const result = await this.request<LaunchTokenResult>('/launch', 'POST', params);
      return result;
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
  async verifyTransaction(signature: string): Promise<VerifyResult> {
    try {
      const result = await this.request<VerifyResult>('/verify', 'POST', { signature });
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Health check - returns the first healthy endpoint
   */
  async healthCheck(): Promise<{ healthy: boolean; endpoint?: string; errors?: string[] }> {
    const errors: string[] = [];

    for (const endpoint of this.config.endpoints) {
      try {
        const response = await fetch(`${endpoint}/health`, {
          method: 'GET',
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

  /**
   * Get the list of configured endpoints
   */
  getEndpoints(): string[] {
    return [...this.config.endpoints];
  }

  /**
   * Add an endpoint to the failover list
   */
  addEndpoint(endpoint: string): void {
    if (!this.config.endpoints.includes(endpoint)) {
      this.config.endpoints.push(endpoint);
    }
  }

  /**
   * Remove an endpoint from the failover list
   */
  removeEndpoint(endpoint: string): void {
    this.config.endpoints = this.config.endpoints.filter(e => e !== endpoint);
  }
}

// ============================================
// WALLET INTEGRATION HELPERS
// ============================================

/**
 * Sign and send a launch transaction using Solana wallet adapter
 *
 * Usage with @solana/wallet-adapter:
 *   const result = await client.launchToken(params);
 *   if (result.success) {
 *     const signature = await signAndSendLaunch(result, wallet, connection);
 *   }
 */
export async function signAndSendLaunch(
  launchResult: LaunchTokenResult,
  wallet: any, // WalletContextState from @solana/wallet-adapter-react
  connection: any // Connection from @solana/web3.js
): Promise<string> {
  if (!launchResult.success || !launchResult.transaction) {
    throw new Error(launchResult.error || 'Invalid launch result');
  }

  if (!wallet.signTransaction) {
    throw new Error('Wallet does not support signing');
  }

  // Deserialize the transaction
  const { Transaction } = await import('@solana/web3.js');
  const txBuffer = Buffer.from(launchResult.transaction, 'base64');
  const tx = Transaction.from(txBuffer);

  // Sign with wallet
  const signedTx = await wallet.signTransaction(tx);

  // Send to network
  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}

// ============================================
// REACT HOOK (optional)
// ============================================

/**
 * React hook for 8xM client
 *
 * Usage:
 *   const { client, launch, isLoading, error } = use8xM({
 *     endpoints: ['https://quillverse.org/api/8xm']
 *   });
 */
export function createUse8xMHook(React: any) {
  return function use8xM(config: Client8xMConfig) {
    const clientRef = React.useRef<Client8xM | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    if (!clientRef.current) {
      clientRef.current = new Client8xM(config);
    }

    const launch = React.useCallback(async (params: LaunchTokenParams) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await clientRef.current!.launchToken(params);
        if (!result.success) {
          setError(result.error || 'Launch failed');
        }
        return result;
      } catch (e: any) {
        setError(e.message);
        return { success: false, error: e.message };
      } finally {
        setIsLoading(false);
      }
    }, []);

    return {
      client: clientRef.current,
      launch,
      isLoading,
      error,
    };
  };
}
