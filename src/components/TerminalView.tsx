import React, { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { X, Maximize2, Minimize2, RotateCcw, Download } from 'lucide-react'
import { useSSH } from '../hooks/useSSH'
import 'xterm/css/xterm.css'

interface TerminalViewProps {
  connectionId: string | null
  onConnectionClose: () => void
}

export function TerminalView({ connectionId, onConnectionClose }: TerminalViewProps) {
  const { getConnection, executeCommand, disconnect } = useSSH()
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const connection = connectionId ? getConnection(connectionId) : null

  useEffect(() => {
    if (!terminalRef.current || !connectionId) return

    // Initialize terminal
    const terminal = new XTerm({
      theme: {
        background: '#0f172a',
        foreground: '#22c55e',
        cursor: '#22c55e',
        selection: '#22c55e40',
        black: '#000000',
        red: '#dc2626',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#ffffff',
        brightBlack: '#64748b',
        brightRed: '#ef4444',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#f8fafc',
      },
      fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      bellStyle: 'visual',
      convertEol: true,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)

    terminal.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = terminal
    fitAddonRef.current = fitAddon

    // Handle terminal input
    terminal.onData((data) => {
      if (connectionId && isConnected) {
        // Send data to SSH connection
        executeCommand(connectionId, data).catch(console.error)
      }
    })

    // Handle terminal resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }

    window.addEventListener('resize', handleResize)

    // Initial connection check
    if (connection?.status === 'connected') {
      setIsConnected(true)
      terminal.writeln(`Connected to ${connection.username}@${connection.host}:${connection.port}`)
      terminal.writeln('')
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      terminal.dispose()
    }
  }, [connectionId])

  useEffect(() => {
    if (connection) {
      setIsConnected(connection.status === 'connected')
      
      if (xtermRef.current) {
        if (connection.status === 'connected') {
          xtermRef.current.writeln(`\x1b[32m✓ Connected to ${connection.username}@${connection.host}:${connection.port}\x1b[0m`)
        } else if (connection.status === 'error') {
          xtermRef.current.writeln(`\x1b[31m✗ Connection failed\x1b[0m`)
        } else if (connection.status === 'disconnected') {
          xtermRef.current.writeln(`\x1b[33m- Disconnected from ${connection.host}\x1b[0m`)
        }
      }
    }
  }, [connection])

  const handleDisconnect = async () => {
    if (connectionId) {
      try {
        await disconnect(connectionId)
        onConnectionClose()
      } catch (error) {
        console.error('Error disconnecting:', error)
      }
    }
  }

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear()
    }
  }

  const handleToggleMaximize = () => {
    setIsMaximized(!isMaximized)
    setTimeout(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }, 100)
  }

  const handleDownloadLog = () => {
    if (xtermRef.current) {
      const content = xtermRef.current.buffer.active.getLines(0, xtermRef.current.rows)
        ?.map(line => line.translateToString(true))
        .join('\n') || ''
      
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ssh-live-${connection?.host}-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  if (!connectionId || !connection) {
    return (
      <div className="h-full flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔌</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Active Connection</h3>
          <p className="text-gray-500">Select a connection from the sidebar to start</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col bg-dark-900 ${isMaximized ? 'fixed inset-0 z-50' : ''}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-4 bg-dark-800 border-b border-dark-700">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`} />
          <div>
            <h3 className="font-semibold text-white">
              {connection.username}@{connection.host}:{connection.port}
            </h3>
            <p className="text-sm text-gray-400">
              {connection.status} • {connection.connectedAt?.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleClear}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            title="Clear terminal"
          >
            <RotateCcw className="w-4 h-4 text-gray-400" />
          </button>
          
          <button
            onClick={handleDownloadLog}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            title="Download log"
          >
            <Download className="w-4 h-4 text-gray-400" />
          </button>
          
          <button
            onClick={handleToggleMaximize}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          
          <button
            onClick={handleDisconnect}
            className="p-2 hover:bg-red-600 rounded-lg transition-colors"
            title="Disconnect"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-4">
        <div 
          ref={terminalRef} 
          className="w-full h-full terminal-container rounded-lg border border-dark-700"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-dark-800 border-t border-dark-700 text-sm text-gray-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>SSH Terminal</span>
            <span>•</span>
            <span>{connection.status}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Ctrl+C to interrupt</span>
            <span>•</span>
            <span>Ctrl+D to exit</span>
          </div>
        </div>
      </div>
    </div>
  )
}

