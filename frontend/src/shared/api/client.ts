export type ApiClientOptions = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokenRefreshed: (accessToken: string, refreshToken?: string | null) => void;
  onSessionExpired: () => void;
};

const parseErrorMessage = (data: unknown) => {
  if (typeof data === 'object' && data && 'message' in data && typeof data.message === 'string') {
    return data.message;
  }

  if (
    typeof data === 'object' &&
    data &&
    'error' in data &&
    typeof data.error === 'object' &&
    data.error &&
    'message' in data.error &&
    typeof data.error.message === 'string'
  ) {
    return data.error.message;
  }

  return 'Request failed';
};

export const createApiClient = ({
  getAccessToken,
  getRefreshToken,
  onTokenRefreshed,
  onSessionExpired,
}: ApiClientOptions) => {
  const request = async (input: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const tokenToUse = getAccessToken();

    if (tokenToUse) {
      headers.set('Authorization', 'Bearer ' + tokenToUse);
    }

    let response = await fetch(input, { ...init, headers });

    if (response.status === 401) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          const refreshData = await refreshResponse.json().catch(() => ({}));

          if (refreshResponse.ok && typeof refreshData.accessToken === 'string') {
            onTokenRefreshed(refreshData.accessToken, refreshToken);
            headers.set('Authorization', 'Bearer ' + refreshData.accessToken);
            response = await fetch(input, { ...init, headers });
          } else {
            throw new Error(parseErrorMessage(refreshData));
          }
        } catch {
          onSessionExpired();
          throw new Error('Session expired. Please sign in again.');
        }
      }
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(parseErrorMessage(data));
    }

    return data;
  };

  return { request };
};
