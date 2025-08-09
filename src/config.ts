export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080'
} as const

// Authentication types
export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface SignInRequest {
  email: string
  password: string
}

export interface SignUpRequest {
  email: string
  password: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface UserDetails {
  id: string
  email: string
  created_at: number
  // Add other user fields as needed based on your API response
}

// Token management
let ACCESS_TOKEN = ''
let REFRESH_TOKEN = ''

export function setTokens(tokens: AuthTokens) {
  ACCESS_TOKEN = tokens.access_token
  REFRESH_TOKEN = tokens.refresh_token
  // Store in localStorage for persistence
  localStorage.setItem('access_token', tokens.access_token)
  localStorage.setItem('refresh_token', tokens.refresh_token)
}

export function getAccessToken(): string {
  if (!ACCESS_TOKEN) {
    ACCESS_TOKEN = localStorage.getItem('access_token') || ''
  }
  return ACCESS_TOKEN
}

export function getRefreshToken(): string {
  if (!REFRESH_TOKEN) {
    REFRESH_TOKEN = localStorage.getItem('refresh_token') || ''
  }
  return REFRESH_TOKEN
}

export function clearTokens() {
  ACCESS_TOKEN = ''
  REFRESH_TOKEN = ''
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}