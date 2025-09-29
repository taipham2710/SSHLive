import { useState, useEffect } from 'react'

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

export function useSettings() {
  const [settings, setSettings] = useState<Partial<AppSettings>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (window.electronAPI) {
          const allSettings = await window.electronAPI.settingsGetAll()
          setSettings(allSettings)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.settingsSet(key, value)
        setSettings(prev => ({ ...prev, [key]: value }))
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      throw error
    }
  }

  const updateNestedSetting = async <
    K extends keyof AppSettings,
    N extends keyof AppSettings[K]
  >(
    key: K,
    nestedKey: N,
    value: AppSettings[K][N]
  ) => {
    try {
      if (window.electronAPI) {
        const currentValue = settings[key] || {}
        const updatedValue = { ...currentValue, [nestedKey]: value }
        await window.electronAPI.settingsSet(key, updatedValue)
        setSettings(prev => ({ ...prev, [key]: updatedValue }))
      }
    } catch (error) {
      console.error('Error updating nested setting:', error)
      throw error
    }
  }

  const resetSettings = async () => {
    try {
      if (window.electronAPI) {
        // This would need to be implemented in the backend
        // For now, we'll just reload the settings
        const allSettings = await window.electronAPI.settingsGetAll()
        setSettings(allSettings)
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      throw error
    }
  }

  return {
    settings,
    loading,
    updateSetting,
    updateNestedSetting,
    resetSettings,
  }
}

