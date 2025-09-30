import React, { useState, useEffect } from 'react'
import { Terminal, Settings, Key, Server, Plus, Menu, X, Folder } from 'lucide-react'
import { ConnectionManager } from './components/ConnectionManager'
import { TerminalView } from './components/TerminalView'
import { KeyManager } from './components/KeyManager'
import { SettingsPanel } from './components/SettingsPanel'
import { FileTransfer as FileTransferView } from './components/FileTransfer'
import { StatusBar } from './components/StatusBar'
import { useTheme } from './hooks/useTheme'
import { useSettings } from './hooks/useSettings'

type View = 'connections' | 'terminal' | 'keys' | 'settings' | 'files'

interface AppState {
  currentView: View
  sidebarOpen: boolean
  activeConnection: string | null
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    currentView: 'connections',
    sidebarOpen: true,
    activeConnection: null,
  })

  const { theme, toggleTheme } = useTheme()
  const { settings } = useSettings()

  useEffect(() => {
    // Apply theme classes to document
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('theme-light', theme === 'light')
  }, [theme])

  const handleViewChange = (view: View) => {
    setAppState(prev => ({ ...prev, currentView: view }))
  }

  const handleSidebarToggle = () => {
    setAppState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }))
  }

  const handleConnectionSelect = (connectionId: string) => {
    setAppState(prev => ({ 
      ...prev, 
      activeConnection: connectionId,
      currentView: 'terminal'
    }))
  }

  const renderCurrentView = () => {
    switch (appState.currentView) {
      case 'connections':
        return <ConnectionManager onConnectionSelect={handleConnectionSelect} />
      case 'terminal':
        return (
          <TerminalView 
            connectionId={appState.activeConnection}
            onConnectionClose={() => setAppState(prev => ({ 
              ...prev, 
              activeConnection: null,
              currentView: 'connections'
            }))}
          />
        )
      case 'keys':
        return <KeyManager />
      case 'settings':
        return <SettingsPanel />
      case 'files':
        return <FileTransferView connectionId={appState.activeConnection} />
      default:
        return <ConnectionManager onConnectionSelect={handleConnectionSelect} />
    }
  }

  return (
    <div className="h-screen bg-dark-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="app-header px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSidebarToggle}
            className="p-2 hover:bg-dark-700/70 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <Terminal className="w-6 h-6 text-primary-500" />
            <h1 className="text-xl font-bold">SSH Live</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-dark-700/70 rounded-lg transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>
      <div className="app-accent-bar" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {appState.sidebarOpen && (
          <aside className="w-64 sidebar flex flex-col">
            <nav className="flex-1 p-4 space-y-2">
              <button
                onClick={() => handleViewChange('connections')}
                className={`nav-item ${
                  appState.currentView === 'connections' ? 'nav-item-active' : ''
                }`}
              >
                <Server className="w-5 h-5" />
                <span>Connections</span>
              </button>

              <button
                onClick={() => handleViewChange('terminal')}
                className={`nav-item ${
                  appState.currentView === 'terminal' ? 'nav-item-active' : ''
                }`}
                disabled={!appState.activeConnection}
              >
                <Terminal className="w-5 h-5" />
                <span>Terminal</span>
              </button>

              <button
                onClick={() => handleViewChange('files')}
                className={`nav-item ${
                  appState.currentView === 'files' ? 'nav-item-active' : ''
                }`}
                disabled={!appState.activeConnection}
              >
                <Folder className="w-5 h-5" />
                <span>File Transfer</span>
              </button>

              <div className="border-t border-dark-700 my-4 separator-line"></div>

              <button
                onClick={() => handleViewChange('keys')}
                className={`nav-item ${
                  appState.currentView === 'keys' ? 'nav-item-active' : ''
                }`}
              >
                <Key className="w-5 h-5" />
                <span>SSH Keys</span>
              </button>

              <button
                onClick={() => handleViewChange('settings')}
                className={`nav-item ${
                  appState.currentView === 'settings' ? 'nav-item-active' : ''
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </nav>

            {/* Connection Status */}
            <div className="p-4 border-t border-dark-700/70 separator-line">
              <div className="text-sm text-gray-400 mb-2">Active Connections</div>
              <div className="space-y-2">
                {appState.activeConnection ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-xs">No active connection</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden content-surface">
          <div className="flex-1 overflow-hidden">
            {renderCurrentView()}
          </div>
          
          {/* Status Bar */}
          {settings.ui?.showStatusBar && (
            <StatusBar 
              activeConnection={appState.activeConnection}
              currentView={appState.currentView}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App

