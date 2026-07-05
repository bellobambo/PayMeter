import { env } from '../config/env.js';

type NombaTokenPayload = {
  access_token: string;
  refresh_token?: string;
  expiresAt: string;
};

type NombaTokenResponse = {
  code?: string;
  description?: string;
  data?: NombaTokenPayload;
};

export class NombaAuthService {
    #cachedToken: string | null = null;
    #refreshToken: string | null = null;
    #expiresAt = 0;

    async getAccessToken(): Promise<string> {
        const now = Date.now();
        const refreshBufferMs = 5 * 60 * 1000;

        if (this.#cachedToken && this.#expiresAt - refreshBufferMs > now) {
            return this.#cachedToken;
        }

        if (this.#cachedToken && this.#refreshToken) {
            try {
                await this.#refreshAccessToken();
                return this.#cachedToken as string;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                console.warn(`Nomba token refresh failed, issuing a new token: ${message}`);
            }
        }

        await this.#issueAccessToken();
        return this.#cachedToken as string;
    }

    async #issueAccessToken(): Promise<void> {
        const response = await fetch(`${env.nomba.baseUrl}/v1/auth/token/issue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                accountId: env.nomba.parentAccountId,
            },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: env.nomba.clientId,
                client_secret: env.nomba.clientSecret,
            }),
        });

        const payload = await response.json().catch(() => null) as NombaTokenResponse | null;

        if (!response.ok || payload?.code !== '00' || !payload?.data?.access_token) {
            throw new Error(payload?.description ?? 'Unable to authenticate with Nomba');
        }

        this.#cacheTokenPayload(payload.data);
    }

    async #refreshAccessToken(): Promise<void> {
        const response = await fetch(`${env.nomba.baseUrl}/v1/auth/token/refresh`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.#cachedToken}`,
                'Content-Type': 'application/json',
                accountId: env.nomba.parentAccountId,
            },
            body: JSON.stringify({
                grant_type: 'refresh_token',
                refresh_token: this.#refreshToken,
            }),
        });

        const payload = await response.json().catch(() => null) as NombaTokenResponse | null;

        if (!response.ok || payload?.code !== '00' || !payload?.data?.access_token) {
            throw new Error(payload?.description ?? 'Unable to refresh Nomba access token');
        }

        this.#cacheTokenPayload(payload.data);
    }

    #cacheTokenPayload(data: NombaTokenPayload): void {
        this.#cachedToken = data.access_token;
        this.#refreshToken = data.refresh_token ?? null;
        this.#expiresAt = Date.parse(data.expiresAt);
    }
}
