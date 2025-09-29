import { promises as fs } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { EventEmitter } from 'events'

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  fontSize: number
  fontFamily: string
  terminal: {
    cursorBlink: boolean
    cursorStyle: 'block' | 'underline' | 'bar'
    scrollback: number
    bellStyle: 'none' | 'visual' | 'sound' | 'both'
  }
  security: {
    autoLock: boolean
    lockTimeout: number
    requirePassword: boolean
    savePasswords: boolean
  }
  connection: {
    defaultPort: number
    connectionTimeout: number
    keepAliveInterval: number
    autoReconnect: boolean
    maxReconnectAttempts: number
  }
  ui: {
    showSidebar: boolean
    sidebarWidth: number
    showStatusBar: boolean
    animations: boolean
  }
  advanced: {
    logLevel: 'error' | 'warn' | 'info' | 'debug'
    enableTelemetry: boolean
    autoUpdate: boolean
  }
}

export class SettingsManager extends EventEmitter {
  private settings: Partial<AppSettings> = {}
  private settingsPath: string
  private defaultSettings: AppSettings

  constructor() {
    super()
    this.settingsPath = join(homedir(), '.ssh-live', 'settings.json')
    this.defaultSettings = this.getDefaultSettings()
  }

  public async initialize(): Promise<void> {
    try {
      // Create settings directory if it doesn't exist
      const settingsDir = join(homedir(), '.ssh-live')
      await fs.mkdir(settingsDir, { recursive: true })
      
      // Load existing settings
      await this.loadSettings()
      
      this.emit('initialized')
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  private getDefaultSettings(): AppSettings {
    return {
      theme: 'dark',
      fontSize: 14,
      fontFamily: 'JetBrains Mono',
      terminal: {
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 1000,
        bellStyle: 'visual',
      },
      security: {
        autoLock: true,
        lockTimeout: 300000, // 5 minutes
        requirePassword: false,
        savePasswords: false,
      },
      connection: {
        defaultPort: 22,
        connectionTimeout: 20000,
        keepAliveInterval: 30000,
        autoReconnect: true,
        maxReconnectAttempts: 3,
      },
      ui: {
        showSidebar: true,
        sidebarWidth: 250,
        showStatusBar: true,
        animations: true,
      },
      advanced: {
        logLevel: 'info',
        enableTelemetry: false,
        autoUpdate: true,
      },
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const settingsData = await fs.readFile(this.settingsPath, 'utf8')
      const loadedSettings = JSON.parse(settingsData)
      this.settings = { ...this.defaultSettings, ...loadedSettings }
    } catch (error) {
      // File doesn't exist or is invalid, use defaults
      this.settings = { ...this.defaultSettings }
      await this.saveSettings()
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      const settingsData = JSON.stringify(this.settings, null, 2)
      await fs.writeFile(this.settingsPath, settingsData, { mode: 0o600 })
      this.emit('settings:saved', this.settings)
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  public async get<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    return this.settings[key] || this.defaultSettings[key]
  }

  public async set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    try {
      this.settings[key] = value
      await this.saveSettings()
      this.emit('setting:changed', { key, value })
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  public async getAll(): Promise<AppSettings> {
    return { ...this.defaultSettings, ...this.settings }
  }

  public async reset(): Promise<void> {
    try {
      this.settings = { ...this.defaultSettings }
      await this.saveSettings()
      this.emit('settings:reset')
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  public async resetKey<K extends keyof AppSettings>(key: K): Promise<void> {
    try {
      delete this.settings[key]
      await this.saveSettings()
      this.emit('setting:reset', { key })
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  public async exportSettings(): Promise<string> {
    try {
      return JSON.stringify(this.settings, null, 2)
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  public async importSettings(settingsJson: string): Promise<void> {
    try {
      const importedSettings = JSON.parse(settingsJson)
      
      // Validate settings structure
      this.validateSettings(importedSettings)
      
      this.settings = { ...this.defaultSettings, ...importedSettings }
      await this.saveSettings()
      this.emit('settings:imported', this.settings)
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  private validateSettings(settings: any): void {
    // Basic validation - in production, use a proper schema validator
    const validKeys = Object.keys(this.defaultSettings)
    const invalidKeys = Object.keys(settings).filter(key => !validKeys.includes(key))
    
    if (invalidKeys.length > 0) {
      throw new Error(`Invalid settings keys: ${invalidKeys.join(', ')}`)
    }
  }

  public async cleanup(): Promise<void> {
    // Cleanup resources if needed
  }

  // Convenience methods for common settings
  public async getTheme(): Promise<'light' | 'dark' | 'auto'> {
    return this.get('theme')
  }

  public async setTheme(theme: 'light' | 'dark' | 'auto'): Promise<void> {
    return this.set('theme', theme)
  }

  public async getFontSize(): Promise<number> {
    return this.get('fontSize')
  }

  public async setFontSize(fontSize: number): Promise<void> {
    if (fontSize < 8 || fontSize > 72) {
      throw new Error('Font size must be between 8 and 72')
    }
    return this.set('fontSize', fontSize)
  }

  public async getSecuritySettings() {
    return this.get('security')
  }

  public async updateSecuritySettings(updates: Partial<AppSettings['security']>): Promise<void> {
    const current = await this.get('security')
    return this.set('security', { ...current, ...updates })
  }

  public async getConnectionSettings() {
    return this.get('connection')
  }

  public async updateConnectionSettings(updates: Partial<AppSettings['connection']>): Promise<void> {
    const current = await this.get('connection')
    return this.set('connection', { ...current, ...updates })
  }
}

