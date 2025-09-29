import { contextBridge, ipcRenderer } from 'electron'

// Define the API interface
export interface ElectronAPI {
  // SSH Operations
  sshConnect: (config: SSHConnectionConfig) => Promise<SSHConnection>
  sshDisconnect: (connectionId: string) => Promise<{ success: boolean }>
  sshExecute: (connectionId: string, command: string) => Promise<CommandResult>
  sshListConnections: () => Promise<SSHConnection[]>

  // Key Management
  keysList: () => Promise<SSHKey[]>
  keysAdd: (keyData: SSHKeyData) => Promise<SSHKey>
  keysRemove: (keyId: string) => Promise<{ success: boolean }>
  keysGenerate: (options: KeyGenerationOptions) => Promise<SSHKeyPair>

  // Settings
  settingsGet: (key: string) => Promise<any>
  settingsSet: (key: string, value: any) => Promise<void>
  settingsGetAll: () => Promise<Record<string, any>>

  // File Transfer
  sftpUpload: (connectionId: string, localPath: string, remotePath: string) => Promise<{ success: boolean }>
  sftpDownload: (connectionId: string, remotePath: string, localPath: string) => Promise<{ success: boolean }>
  sftpList: (connectionId: string, path: string) => Promise<FileInfo[]>

  // Event listeners
  onSSHEvent: (event: string, callback: (data: any) => void) => void
  removeSSHEvent: (event: string, callback: (data: any) => void) => void
}

// Type definitions
export interface SSHConnectionConfig {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
  passphrase?: string
  timeout?: number
}

export interface SSHConnection {
  id: string
  host: string
  port: number
  username: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  connectedAt?: Date
  lastActivity?: Date
}

export interface CommandResult {
  stdout: string
  stderr: string
  exitCode: number
  duration: number
}

export interface SSHKey {
  id: string
  name: string
  type: 'rsa' | 'ed25519' | 'ecdsa'
  publicKey: string
  privateKey?: string
  fingerprint: string
  createdAt: Date
}

export interface SSHKeyData {
  name: string
  publicKey: string
  privateKey?: string
}

export interface KeyGenerationOptions {
  type: 'rsa' | 'ed25519' | 'ecdsa'
  size?: number
  name: string
}

export interface SSHKeyPair {
  publicKey: string
  privateKey: string
  fingerprint: string
}

export interface FileInfo {
  name: string
  size: number
  type: 'file' | 'directory'
  permissions: string
  modified: Date
}

// Expose the API to the renderer process
const electronAPI: ElectronAPI = {
  // SSH Operations
  sshConnect: (config) => ipcRenderer.invoke('ssh:connect', config),
  sshDisconnect: (connectionId) => ipcRenderer.invoke('ssh:disconnect', connectionId),
  sshExecute: (connectionId, command) => ipcRenderer.invoke('ssh:execute', connectionId, command),
  sshListConnections: () => ipcRenderer.invoke('ssh:list-connections'),

  // Key Management
  keysList: () => ipcRenderer.invoke('keys:list'),
  keysAdd: (keyData) => ipcRenderer.invoke('keys:add', keyData),
  keysRemove: (keyId) => ipcRenderer.invoke('keys:remove', keyId),
  keysGenerate: (options) => ipcRenderer.invoke('keys:generate', options),

  // Settings
  settingsGet: (key) => ipcRenderer.invoke('settings:get', key),
  settingsSet: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  settingsGetAll: () => ipcRenderer.invoke('settings:get-all'),

  // File Transfer
  sftpUpload: (connectionId, localPath, remotePath) => ipcRenderer.invoke('sftp:upload', connectionId, localPath, remotePath),
  sftpDownload: (connectionId, remotePath, localPath) => ipcRenderer.invoke('sftp:download', connectionId, remotePath, localPath),
  sftpList: (connectionId, path) => ipcRenderer.invoke('sftp:list', connectionId, path),

  // Event listeners
  onSSHEvent: (event, callback) => {
    ipcRenderer.on(event, (_, data) => callback(data))
  },
  removeSSHEvent: (event, callback) => {
    ipcRenderer.removeListener(event, callback)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Declare global types for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

