import type { ConnectConfig } from 'ssh2'
import { Client, SFTPWrapper } from 'ssh2'
import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'
import { createReadStream, createWriteStream, promises as fs } from 'fs'
import { join } from 'path'

export interface SSHConnection {
  id: string
  host: string
  port: number
  username: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  connectedAt?: Date
  lastActivity?: Date
  client?: Client
  sftp?: SFTPWrapper
}

export interface CommandResult {
  stdout: string
  stderr: string
  exitCode: number
  duration: number
}

export interface FileInfo {
  name: string
  size: number
  type: 'file' | 'directory'
  permissions: string
  modified: Date
}

export class SSHManager extends EventEmitter {
  private connections: Map<string, SSHConnection> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private maxReconnectAttempts = 3

  constructor() {
    super()
  }

  public async connect(config: ConnectConfig): Promise<SSHConnection> {
    const connectionId = uuidv4()
    const connection: SSHConnection = {
      id: connectionId,
      host: config.host || 'localhost',
      port: config.port || 22,
      username: config.username || 'root',
      status: 'connecting',
      connectedAt: new Date(),
    }

    this.connections.set(connectionId, connection)
    this.emit('connection:connecting', connection)

    return new Promise((resolve, reject) => {
      const client = new Client()
      connection.client = client

      client.on('ready', () => {
        connection.status = 'connected'
        connection.connectedAt = new Date()
        this.connections.set(connectionId, connection)
        this.emit('connection:connected', connection)
        resolve(connection)
      })

      client.on('error', (error: unknown) => {
        connection.status = 'error'
        this.connections.set(connectionId, connection)
        this.emit('connection:error', { connection, error })
        reject(error)
      })

      client.on('close', () => {
        connection.status = 'disconnected'
        this.connections.set(connectionId, connection)
        this.emit('connection:disconnected', connection)
      })

      // Enhanced connection config with security options
      const secureConfig: ConnectConfig = {
        ...config,
        keepaliveInterval: 30000,
        keepaliveCountMax: 3,
        readyTimeout: 20000,
        sock: config.sock,
      }

      client.connect(secureConfig)
    })
  }

  public async disconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.client) {
      throw new Error(`Connection ${connectionId} not found`)
    }

    return new Promise((resolve) => {
      const onClose = () => {
        connection.status = 'disconnected'
        this.connections.set(connectionId, connection)
        this.emit('connection:disconnected', connection)
        connection.client?.removeListener('close', onClose)
        resolve()
      }

      connection.client!.once('close', onClose)
      connection.client!.end()

      // Force close after timeout
      setTimeout(() => {
        if (connection.status !== 'disconnected') {
          connection.client!.destroy()
        }
      }, 5000)
    })
  }

  public async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map(id => 
      this.disconnect(id).catch(console.error)
    )
    await Promise.all(disconnectPromises)
  }

  public async executeCommand(connectionId: string, command: string): Promise<CommandResult> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.client || connection.status !== 'connected') {
      throw new Error(`Connection ${connectionId} is not available`)
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      let stdout = ''
      let stderr = ''
      let exitCode = 0

      connection.client!.exec(command, (err: unknown, stream: any) => {
        if (err) {
          reject(err)
          return
        }

        stream.on('close', (code: number) => {
          exitCode = code || 0
          connection.lastActivity = new Date()
          this.connections.set(connectionId, connection)
          
          const result: CommandResult = {
            stdout,
            stderr,
            exitCode,
            duration: Date.now() - startTime,
          }
          
          resolve(result)
        })

        stream.on('data', (data: Buffer) => {
          stdout += data.toString()
        })

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString()
        })
      })
    })
  }

  public async getSFTP(connectionId: string): Promise<SFTPWrapper> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.client || connection.status !== 'connected') {
      throw new Error(`Connection ${connectionId} is not available`)
    }

    if (connection.sftp) {
      return connection.sftp
    }

    return new Promise((resolve, reject) => {
      connection.client!.sftp((err: unknown, sftp: SFTPWrapper) => {
        if (err) {
          reject(err)
          return
        }
        connection.sftp = sftp
        this.connections.set(connectionId, connection)
        resolve(sftp)
      })
    })
  }

  public async uploadFile(connectionId: string, localPath: string, remotePath: string): Promise<{ success: boolean }> {
    try {
      const sftp = await this.getSFTP(connectionId)
      const readStream = createReadStream(localPath)
      
      return new Promise((resolve, reject) => {
        const writeStream = sftp.createWriteStream(remotePath)
        
        writeStream.on('error', reject)
        writeStream.on('close', () => resolve({ success: true }))
        
        readStream.pipe(writeStream)
      })
    } catch (error) {
      throw error
    }
  }

  public async downloadFile(connectionId: string, remotePath: string, localPath: string): Promise<{ success: boolean }> {
    try {
      const sftp = await this.getSFTP(connectionId)
      const writeStream = createWriteStream(localPath)
      
      return new Promise((resolve, reject) => {
        const readStream = sftp.createReadStream(remotePath)
        
        readStream.on('error', reject)
        readStream.on('end', () => resolve({ success: true }))
        
        readStream.pipe(writeStream)
      })
    } catch (error) {
      throw error
    }
  }

  public async listFiles(connectionId: string, path: string): Promise<FileInfo[]> {
    try {
      const sftp = await this.getSFTP(connectionId)
      
      return new Promise((resolve, reject) => {
        sftp.readdir(path, (err: unknown, list: any[]) => {
          if (err) {
            reject(err)
            return
          }

          const files: FileInfo[] = list.map((item: any) => ({
            name: item.filename,
            size: item.attrs.size,
            type: item.attrs.isDirectory() ? 'directory' : 'file',
            permissions: item.attrs.mode.toString(8),
            modified: new Date(item.attrs.mtime * 1000),
          }))

          resolve(files)
        })
      })
    } catch (error) {
      throw error
    }
  }

  public getActiveConnections(): SSHConnection[] {
    return Array.from(this.connections.values())
  }

  public getConnection(connectionId: string): SSHConnection | undefined {
    return this.connections.get(connectionId)
  }

  private async attemptReconnect(connectionId: string): Promise<void> {
    const attempts = this.reconnectAttempts.get(connectionId) || 0
    if (attempts >= this.maxReconnectAttempts) {
      this.emit('connection:reconnect-failed', { connectionId, attempts })
      return
    }

    this.reconnectAttempts.set(connectionId, attempts + 1)
    
    // Wait before attempting reconnect
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000))
    
    const connection = this.connections.get(connectionId)
    if (connection) {
      this.emit('connection:reconnecting', { connectionId, attempt: attempts + 1 })
      // Implementation would depend on storing original connection config
    }
  }
}

