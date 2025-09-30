import React, { useState, useEffect } from 'react'
import { Settings, Monitor, Shield, Network, Palette, Code, Save, RotateCcw } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'

export function SettingsPanel() {
  const { settings, updateSetting, updateNestedSetting, resetSettings } = useSettings()
  const [activeTab, setActiveTab] = useState<'appearance' | 'security' | 'connection' | 'terminal' | 'advanced'>('appearance')
  const [hasChanges, setHasChanges] = useState(false)
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark' | 'auto' | undefined>(undefined)
  const [previewFontSize, setPreviewFontSize] = useState<number | undefined>(undefined)

  const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement
    // Add a short-lived class to animate color-related properties
    root.classList.add('theme-anim')
    const shouldUseDark = theme === 'dark' || (theme === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', shouldUseDark)
    root.classList.toggle('theme-light', !shouldUseDark)
    window.clearTimeout((root as any)._themeAnimTid)
    ;(root as any)._themeAnimTid = window.setTimeout(() => {
      root.classList.remove('theme-anim')
    }, 240)
  }

  // Apply theme preview to the document root without persisting
  useEffect(() => {
    const effectiveTheme = previewTheme ?? settings.theme
    if (!effectiveTheme) return
    applyTheme(effectiveTheme)
  }, [previewTheme, settings.theme])

  // Revert preview when leaving Settings panel (unmount)
  useEffect(() => {
    return () => {
      if (previewTheme) {
        const fallback = (settings.theme || 'auto') as 'light' | 'dark' | 'auto'
        applyTheme(fallback)
      }
      if (previewFontSize !== undefined) {
        document.documentElement.style.setProperty('--app-font-size', `${settings.fontSize || 14}px`)
      }
    }
  }, [previewTheme, previewFontSize, settings.theme, settings.fontSize])

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'connection', label: 'Connection', icon: Network },
    { id: 'terminal', label: 'Terminal', icon: Monitor },
    { id: 'advanced', label: 'Advanced', icon: Code },
  ] as const

  const handleSettingChange = async (key: string, value: any) => {
    try {
      // Theme is special: only preview until user clicks Save
      if (key === 'theme') {
        setPreviewTheme(value)
        setHasChanges(true)
        return
      }
      // Font size preview only (no save yet)
      if (key === 'fontSize') {
        setPreviewFontSize(value)
        document.documentElement.classList.add('theme-anim')
        document.documentElement.style.setProperty('--app-font-size', `${value}px`)
        window.clearTimeout((document.documentElement as any)._themeAnimTid)
        ;(document.documentElement as any)._themeAnimTid = window.setTimeout(() => {
          document.documentElement.classList.remove('theme-anim')
        }, 200)
        setHasChanges(true)
        return
      }
      await updateSetting(key as any, value)
      setHasChanges(true)
    } catch (error) {
      console.error('Error updating setting:', error)
    }
  }

  const handleNestedSettingChange = async (key: string, nestedKey: string, value: any) => {
    try {
      await updateNestedSetting(key as any, nestedKey as any, value)
      setHasChanges(true)
    } catch (error) {
      console.error('Error updating nested setting:', error)
    }
  }

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      try {
        await resetSettings()
        setHasChanges(false)
      } catch (error) {
        console.error('Error resetting settings:', error)
      }
    }
  }

  const renderAppearanceSettings = () => (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <label className="block text-lg font-semibold text-white mb-4 theme-light:text-blue-900">Theme</label>
        <div className="grid grid-cols-3 gap-4">
          {(['light', 'dark', 'auto'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => handleSettingChange('theme', theme)}
              className={`p-5 rounded-xl border transition-all duration-200 text-center select-none ${
                (previewTheme ?? settings.theme) === theme
                  ? 'nav-item-active text-white'
                  : 'border-dark-600 hover:border-primary-400/50 hover:shadow-glow text-gray-300 theme-light:text-blue-700 theme-light:hover:text-blue-800'
              }`}
            >
              <div className="text-center">
                <div className={`w-10 h-10 rounded-lg mx-auto mb-2 ${
                  theme === 'light' ? 'bg-white shadow-glow' : theme === 'dark' ? 'bg-dark-700' : 'bg-gradient-to-r from-white to-dark-700'
                }`} />
                <span className="text-base font-semibold capitalize theme-light:text-blue-800">{theme}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-semibold text-white mb-3 theme-light:text-blue-900">Font Size</label>
        <input
          type="range"
          min="10"
          max="24"
          value={previewFontSize ?? settings.fontSize ?? 14}
          onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
          className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer theme-light:bg-blue-100"
        />
        <div className="flex justify-between text-sm text-gray-400 mt-2 theme-light:text-blue-700">
          <span>10px</span>
          <span className="font-semibold">{previewFontSize ?? settings.fontSize ?? 14}px</span>
          <span>24px</span>
        </div>
      </div>

      <div>
        <label className="block text-lg font-semibold text-white mb-3 theme-light:text-blue-900">Font Family</label>
        <select
          value={settings.fontFamily || 'JetBrains Mono'}
          onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
          className="input-primary w-full"
        >
          <option value="JetBrains Mono">JetBrains Mono</option>
          <option value="Fira Code">Fira Code</option>
          <option value="Monaco">Monaco</option>
          <option value="Consolas">Consolas</option>
          <option value="Courier New">Courier New</option>
        </select>
      </div>

      <div className="space-y-4">
        <label className="block text-lg font-semibold text-white theme-light:text-blue-900">UI Preferences</label>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-300 theme-light:text-blue-800 font-medium">Show Sidebar</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.ui?.showSidebar !== false}
              onChange={(e) => handleNestedSettingChange('ui', 'showSidebar', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 theme-light:bg-blue-200" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300 theme-light:text-blue-800 font-medium">Show Status Bar</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.ui?.showStatusBar !== false}
              onChange={(e) => handleNestedSettingChange('ui', 'showStatusBar', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 theme-light:bg-blue-200" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300 theme-light:text-blue-800 font-medium">Enable Animations</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.ui?.animations !== false}
              onChange={(e) => handleNestedSettingChange('ui', 'animations', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 theme-light:bg-blue-200" />
          </label>
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white text-xl font-semibold theme-light:text-blue-700">Auto Lock</span>
            <p className="text-sm text-gray-500 theme-light:text-blue-600">Automatically lock the application after inactivity</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.security?.autoLock !== false}
              onChange={(e) => handleNestedSettingChange('security', 'autoLock', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-white text-xl font-semibold theme-light:text-blue-700">Save Passwords</span>
            <p className="text-sm text-gray-500 theme-light:text-blue-600">Remember passwords for connections (encrypted)</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.security?.savePasswords !== false}
              onChange={(e) => handleNestedSettingChange('security', 'savePasswords', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
          </label>
        </div>

        <div>
          <label className="block text-lg font-semibold text-white mb-3 theme-light:text-blue-900">
            Lock Timeout (minutes)
          </label>
          <input
            type="range"
            min="1"
            max="60"
            value={settings.security?.lockTimeout ? settings.security.lockTimeout / 60000 : 5}
            onChange={(e) => handleNestedSettingChange('security', 'lockTimeout', parseInt(e.target.value) * 60000)}
            className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-400 mt-2 theme-light:text-blue-700">
            <span>1 min</span>
            <span className="font-semibold">{settings.security?.lockTimeout ? settings.security.lockTimeout / 60000 : 5} min</span>
            <span>60 min</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderConnectionSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-lg font-semibold text-white mb-3 theme-light:text-blue-900">Default Port</label>
        <input
          type="number"
          value={settings.connection?.defaultPort || 22}
          onChange={(e) => handleNestedSettingChange('connection', 'defaultPort', parseInt(e.target.value))}
          className="input-primary w-full"
          min="1"
          max="65535"
        />
      </div>

      <div>
        <label className="block text-lg font-semibold text-white mb-3 theme-light:text-blue-900">
          Connection Timeout (seconds)
        </label>
        <input
          type="range"
          min="5"
          max="60"
          value={settings.connection?.connectionTimeout ? settings.connection.connectionTimeout / 1000 : 20}
          onChange={(e) => handleNestedSettingChange('connection', 'connectionTimeout', parseInt(e.target.value) * 1000)}
          className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>5s</span>
          <span className="font-medium">{settings.connection?.connectionTimeout ? settings.connection.connectionTimeout / 1000 : 20}s</span>
          <span>60s</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white text-xl font-semibold theme-light:text-blue-700">Auto Reconnect</span>
            <p className="text-sm text-gray-500 theme-light:text-blue-600">Automatically reconnect on connection loss</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.connection?.autoReconnect !== false}
              onChange={(e) => handleNestedSettingChange('connection', 'autoReconnect', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
          </label>
        </div>

        <div>
          <label className="block text-lg font-semibold text-white mb-3 theme-light:text-blue-900">
            Max Reconnect Attempts
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={settings.connection?.maxReconnectAttempts || 3}
            onChange={(e) => handleNestedSettingChange('connection', 'maxReconnectAttempts', parseInt(e.target.value))}
            className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-400 mt-2 theme-light:text-blue-700">
            <span>1</span>
            <span className="font-semibold">{settings.connection?.maxReconnectAttempts || 3}</span>
            <span>10</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTerminalSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white text-xl font-semibold theme-light:text-blue-700">Cursor Blink</span>
            <p className="text-sm text-gray-500 theme-light:text-blue-600">Make the cursor blink in the terminal</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.terminal?.cursorBlink !== false}
              onChange={(e) => handleNestedSettingChange('terminal', 'cursorBlink', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
          </label>
        </div>

        <div>
          <label className="block text-lg font-semibold text-white mb-3 theme-light:text-blue-900">Cursor Style</label>
          <select
            value={settings.terminal?.cursorStyle || 'block'}
            onChange={(e) => handleNestedSettingChange('terminal', 'cursorStyle', e.target.value)}
            className="input-primary w-full"
          >
            <option value="block">Block</option>
            <option value="underline">Underline</option>
            <option value="bar">Bar</option>
          </select>
        </div>

        <div>
          <label className="block text-lg font-semibold text-white mb-3 theme-light:text-blue-900">
            Scrollback Lines
          </label>
          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={settings.terminal?.scrollback || 1000}
            onChange={(e) => handleNestedSettingChange('terminal', 'scrollback', parseInt(e.target.value))}
            className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-400 mt-2 theme-light:text-blue-700">
            <span>100</span>
            <span className="font-semibold">{settings.terminal?.scrollback || 1000}</span>
            <span>10,000</span>
          </div>
        </div>

        <div>
          <label className="block text-lg font-semibold text-white mb-3 theme-light:text-blue-900">Bell Style</label>
          <select
            value={settings.terminal?.bellStyle || 'visual'}
            onChange={(e) => handleNestedSettingChange('terminal', 'bellStyle', e.target.value)}
            className="input-primary w-full"
          >
            <option value="none">None</option>
            <option value="visual">Visual</option>
            <option value="sound">Sound</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-xl font-semibold text-white mb-3 theme-light:text-blue-900">Log Level</label>
        <select
          value={settings.advanced?.logLevel || 'info'}
          onChange={(e) => handleNestedSettingChange('advanced', 'logLevel', e.target.value)}
          className="input-primary w-full"
        >
          <option value="error">Error</option>
          <option value="warn">Warning</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
      </div>

      <div className="space-y-4">
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white text-xl font-semibold theme-light:text-blue-700">Enable Telemetry</span>
            <p className="text-sm text-gray-500 theme-light:text-blue-600">Send anonymous usage data to help improve the app</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.advanced?.enableTelemetry === true}
              onChange={(e) => handleNestedSettingChange('advanced', 'enableTelemetry', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-white text-xl font-semibold theme-light:text-blue-700">Auto Update</span>
            <p className="text-sm text-gray-500 theme-light:text-blue-600">Automatically check for and install updates</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.advanced?.autoUpdate !== false}
              onChange={(e) => handleNestedSettingChange('advanced', 'autoUpdate', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
          </label>
        </div>
      </div>

      <div className="pt-6 border-t border-dark-700/70 separator-line">
        <button
          onClick={handleReset}
          className="btn-danger flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Defaults</span>
        </button>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return renderAppearanceSettings()
      case 'security':
        return renderSecuritySettings()
      case 'connection':
        return renderConnectionSettings()
      case 'terminal':
        return renderTerminalSettings()
      case 'advanced':
        return renderAdvancedSettings()
      default:
        return renderAppearanceSettings()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-dark-700/70 separator-line">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <p className="text-gray-400 mt-1 theme-light:text-slate-600 text-base">Customize your SSH Live experience</p>
          </div>
          {hasChanges && (
            <button
              className="btn-success flex items-center space-x-2"
              onClick={async () => {
                if (previewTheme) {
                  await updateSetting('theme' as any, previewTheme)
                  setPreviewTheme(undefined)
                }
                if (previewFontSize !== undefined) {
                  await updateSetting('fontSize' as any, previewFontSize)
                }
                setHasChanges(false)
              }}
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 sidebar p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-item ${activeTab === tab.id ? 'nav-item-active' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

