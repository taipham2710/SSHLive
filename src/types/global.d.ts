export {}

declare global {
  interface ElectronAPI {
    // SSH operations
    sshConnect: (config: any) => Promise<any>
    sshDisconnect: (connectionId: string) => Promise<{ success: boolean }>
    sshExecute: (connectionId: string, command: string) => Promise<any>
    sshListConnections: () => Promise<any[]>

    // Key management
    keysList: () => Promise<any[]>
    keysAdd: (keyData: any) => Promise<any>
    keysRemove: (keyId: string) => Promise<{ success: boolean }>
    keysGenerate: (options: any) => Promise<any>

    // Settings
    settingsGet: (key: string) => Promise<any>
    settingsSet: (key: string, value: any) => Promise<void>
    settingsGetAll: () => Promise<Record<string, any>>

    // File transfer
    sftpUpload: (connectionId: string, localPath: string, remotePath: string) => Promise<{ success: boolean }>
    sftpDownload: (connectionId: string, remotePath: string, localPath: string) => Promise<{ success: boolean }>
    sftpList: (connectionId: string, path: string) => Promise<any[]>
  }

  interface Window {
    electronAPI?: ElectronAPI
  }
}


