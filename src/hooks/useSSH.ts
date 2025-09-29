import { useState, useEffect, useCallback } from 'react'

export interface SSHConnection {
  id: string
  host: string
  port: number
  username: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  connectedAt?: Date
  lastActivity?: Date
}

export interface SSHConnectionConfig {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
  passphrase?: string
  timeout?: number
}

export interface CommandResult {
  stdout: string
  stderr: string
  exitCode: number
  duration: number
}

export function useSSH() {
  const [connections, setConnections] = useState<SSHConnection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load connections on mount
  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    try {
      if (window.electronAPI) {
        const conns = await window.electronAPI.sshListConnections()
        setConnections(conns)
      }
    } catch (error) {
      console.error('Error loading connections:', error)
    }
  }

  const connect = useCallback(async (config: SSHConnectionConfig): Promise<SSHConnection> => {
    setLoading(true)
    setError(null)
    
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available')
      }

      const connection = await window.electronAPI.sshConnect(config)
      setConnections(prev => [...prev, connection])
      return connection
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const disconnect = useCallback(async (connectionId: string): Promise<void> => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available')
      }

      await window.electronAPI.sshDisconnect(connectionId)
      setConnections(prev => prev.filter(conn => conn.id !== connectionId))
    } catch (error) {
      console.error('Error disconnecting:', error)
      throw error
    }
  }, [])

  const executeCommand = useCallback(async (
    connectionId: string, 
    command: string
  ): Promise<CommandResult> => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available')
      }

      return await window.electronAPI.sshExecute(connectionId, command)
    } catch (error) {
      console.error('Error executing command:', error)
      throw error
    }
  }, [])

  const getConnection = useCallback((connectionId: string): SSHConnection | undefined => {
    return connections.find(conn => conn.id === connectionId)
  }, [connections])

  const getActiveConnections = useCallback((): SSHConnection[] => {
    return connections.filter(conn => conn.status === 'connected')
  }, [connections])

  return {
    connections,
    loading,
    error,
    connect,
    disconnect,
    executeCommand,
    getConnection,
    getActiveConnections,
    refreshConnections: loadConnections,
  }
}

