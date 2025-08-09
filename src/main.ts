import './style.css'
import { api } from './api'
import { config, isAuthenticated, setTokens, clearTokens } from './config'
import type { SignInRequest, SignUpRequest } from './config'
import { APP_VERSION } from './version'

console.log("API URL is", config.apiUrl)

type AuthMode = 'signin' | 'signup'
let currentMode: AuthMode = 'signin'
let isLoading = false

function showError(message: string) {
  const errorDiv = document.getElementById('error')
  if (errorDiv) {
    errorDiv.textContent = message
    errorDiv.style.display = 'block'
    setTimeout(() => {
      errorDiv.style.display = 'none'
    }, 5000)
  }
}

function showSuccess(message: string) {
  const successDiv = document.getElementById('success')
  if (successDiv) {
    successDiv.textContent = message
    successDiv.style.display = 'block'
    setTimeout(() => {
      successDiv.style.display = 'none'
    }, 3000)
  }
}

function setLoadingState(loading: boolean) {
  isLoading = loading
  const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement
  const emailInput = document.getElementById('email') as HTMLInputElement
  const passwordInput = document.getElementById('password') as HTMLInputElement
  
  if (submitBtn) {
    submitBtn.disabled = loading
    submitBtn.textContent = loading 
      ? (currentMode === 'signin' ? 'Signing in...' : 'Signing up...') 
      : (currentMode === 'signin' ? 'Sign In' : 'Sign Up')
  }
  
  if (emailInput) emailInput.disabled = loading
  if (passwordInput) passwordInput.disabled = loading
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return passwordRegex.test(password)
}

async function handleSubmit(event: Event) {
  event.preventDefault()
  
  if (isLoading) return
  
  const emailInput = document.getElementById('email') as HTMLInputElement
  const passwordInput = document.getElementById('password') as HTMLInputElement
  
  const email = emailInput.value.trim()
  const password = passwordInput.value
  
  // Validation
  if (!email || !password) {
    showError('Please fill in all fields')
    return
  }
  
  if (!validateEmail(email)) {
    showError('Please enter a valid email address')
    return
  }
  
  if (!validatePassword(password)) {
    showError('Password must be at least 8 characters with uppercase, lowercase, and number')
    return
  }
  
  setLoadingState(true)
  
  try {
    const credentials: SignInRequest | SignUpRequest = { email, password }
    let tokens
    
    if (currentMode === 'signin') {
      tokens = await api.signIn(credentials)
    } else {
      tokens = await api.signUp(credentials)
    }
    
    setTokens(tokens)
    showSuccess(`Successfully ${currentMode === 'signin' ? 'signed in' : 'signed up'}!`)
    
    // Clear form
    emailInput.value = ''
    passwordInput.value = ''
    
    // In a real app, you would redirect to the main app here
    setTimeout(() => {
      renderSuccessScreen()
    }, 1000)
    
  } catch (error: any) {
    console.error(`${currentMode} failed:`, error)
    showError(error.message || `${currentMode === 'signin' ? 'Sign in' : 'Sign up'} failed`)
  } finally {
    setLoadingState(false)
  }
}

function switchMode(mode: AuthMode) {
  currentMode = mode
  renderAuthForm()
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

async function renderSuccessScreen() {
  const app = document.querySelector<HTMLDivElement>('#app')!
  
  // Show loading state first
  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="success-screen">
          <div class="loading-spinner">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
          </div>
          <h1>Loading...</h1>
          <p class="loading-message">Fetching your details...</p>
        </div>
      </div>
    </div>
    <div class="version-display">v${APP_VERSION}</div>
  `
  
  try {
    const userDetails = await api.getUserDetails()
    
    // Show success screen with user details
    app.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="success-screen">
            <div class="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22,4 12,14.01 9,11.01"></polyline>
              </svg>
            </div>
            <h1>Welcome!</h1>
            <p class="success-message">You're successfully authenticated.</p>
            
            <div class="user-details">
              <h2>Your Details</h2>
              <div class="user-info">
                <div class="info-item">
                  <span class="info-label">User ID:</span>
                  <span class="info-value">${userDetails.id}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${userDetails.email}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Member since:</span>
                  <span class="info-value">${formatDate(userDetails.created_at)}</span>
                </div>
              </div>
            </div>
            
            <button id="signOutBtn" class="auth-btn secondary">Sign Out</button>
          </div>
        </div>
      </div>
      <div class="version-display">v${APP_VERSION}</div>
    `
    
  } catch (error: any) {
    console.error('Failed to fetch user details:', error)
    
    // Show error state
    app.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="success-screen">
            <div class="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h1>Authentication Error</h1>
            <p class="error-message">Failed to fetch user details. You may need to sign in again.</p>
            <button id="signOutBtn" class="auth-btn secondary">Sign Out</button>
          </div>
        </div>
      </div>
      <div class="version-display">v${APP_VERSION}</div>
    `
  }
  
  document.getElementById('signOutBtn')?.addEventListener('click', () => {
    clearTokens()
    currentMode = 'signin'
    renderAuthForm()
  })
}

function renderAuthForm() {
  const app = document.querySelector<HTMLDivElement>('#app')!
  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>${currentMode === 'signin' ? 'Welcome back' : 'Create account'}</h1>
          <p class="auth-subtitle">
            ${currentMode === 'signin' 
              ? 'Sign in to your account to continue' 
              : 'Sign up to get started with your account'}
          </p>
        </div>
        
        <form id="authForm" class="auth-form">
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              class="form-input"
              placeholder="Enter your email"
              required
              autocomplete="email"
            />
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password"
              class="form-input"
              placeholder="Enter your password"
              required
              autocomplete="${currentMode === 'signin' ? 'current-password' : 'new-password'}"
            />
            ${currentMode === 'signup' ? `
              <div class="password-hint">
                Password must be at least 8 characters with uppercase, lowercase, and number
              </div>
            ` : ''}
          </div>
          
          <div id="error" class="error-message"></div>
          <div id="success" class="success-message"></div>
          
          <button type="submit" id="submitBtn" class="auth-btn primary">
            ${currentMode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <div class="auth-switch">
          <p>
            ${currentMode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            <button 
              type="button" 
              id="switchModeBtn" 
              class="switch-link"
            >
              ${currentMode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
    <div class="version-display">v${APP_VERSION}</div>
  `
  
  // Add event listeners
  document.getElementById('authForm')?.addEventListener('submit', handleSubmit)
  document.getElementById('switchModeBtn')?.addEventListener('click', () => {
    switchMode(currentMode === 'signin' ? 'signup' : 'signin')
  })
  
  // Focus on email input
  setTimeout(() => {
    document.getElementById('email')?.focus()
  }, 100)
}

// Check if user is already authenticated
if (isAuthenticated()) {
  renderSuccessScreen()
} else {
  renderAuthForm()
}
