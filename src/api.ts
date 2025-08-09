import { config, getAccessToken, getRefreshToken, setTokens } from './config'
import type { AuthTokens, SignInRequest, SignUpRequest, UserDetails } from './config'

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
    } catch {
      // Fallback to status message if response is not JSON
    }
    throw new ApiError(response.status, errorMessage)
  }
  return response.json()
}

export const api = {
  async signIn(credentials: SignInRequest): Promise<AuthTokens> {
    const response = await fetch(`${config.apiUrl}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    return handleResponse<AuthTokens>(response)
  },

  async signUp(credentials: SignUpRequest): Promise<AuthTokens> {
    const response = await fetch(`${config.apiUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    return handleResponse<AuthTokens>(response)
  },

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      throw new ApiError(401, 'No refresh token available')
    }

    const response = await fetch(`${config.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    
    const tokens = await handleResponse<AuthTokens>(response)
    setTokens(tokens) // Automatically update stored tokens
    return tokens
  },

  async getUserDetails(): Promise<UserDetails> {
    const accessToken = getAccessToken()
    if (!accessToken) {
      throw new ApiError(401, 'No access token available')
    }

    const response = await fetch(`${config.apiUrl}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    return handleResponse<UserDetails>(response)
  }
} 