import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { SSHManager } from './ssh-manager'
import { KeyManager } from './key-manager'
import { SettingsManager } from './settings-manager'

class MainApp {
  private mainWindow: BrowserWindow | null = null
  private sshManager: SSHManager
  private keyManager: KeyManager
  private settingsManager: SettingsManager

  constructor() {
    this.sshManager = new SSHManager()
    this.keyManager = new KeyManager()
    this.settingsManager = new SettingsManager()
  }

  public async createWindow(): Promise<void> {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        preload: join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
      },
    })

    // Load the app
    if (process.env.NODE_ENV === 'development' || true) {
      // Always load Vite dev server during development
      this.mainWindow.loadURL('http://localhost:5173')
      this.mainWindow?.webContents.openDevTools()
    } else {
      this.mainWindow?.loadFile(join(__dirname, '../renderer/index.html'))
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
    })

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })
  }

  private setupIPC(): void {
    // SSH Connection Management
    ipcMain.handle('ssh:connect', async (event, config) => {
      try {
        return await this.sshManager.connect(config)
      } catch (error) {
        throw error
      }
    })

    ipcMain.handle('ssh:disconnect', async (event, connectionId) => {
      try {
        await this.sshManager.disconnect(connectionId)
        return { success: true }
      } catch (error) {
        throw error
      }
    })

    ipcMain.handle('ssh:execute', async (event, connectionId, command) => {
      try {
        return await this.sshManager.executeCommand(connectionId, command)
      } catch (error) {
        throw error
      }
    })

    ipcMain.handle('ssh:list-connections', async () => {
      return this.sshManager.getActiveConnections()
    })

    // Key Management
    ipcMain.handle('keys:list', async () => {
      return await this.keyManager.listKeys()
    })

    ipcMain.handle('keys:add', async (event, keyData) => {
      return await this.keyManager.addKey(keyData)
    })

    ipcMain.handle('keys:remove', async (event, keyId) => {
      return await this.keyManager.removeKey(keyId)
    })

    ipcMain.handle('keys:generate', async (event, options) => {
      return await this.keyManager.generateKeyPair(options)
    })

    // Settings Management
    ipcMain.handle('settings:get', async (event, key) => {
      return await this.settingsManager.get(key)
    })

    ipcMain.handle('settings:set', async (event, key, value) => {
      return await this.settingsManager.set(key, value)
    })

    ipcMain.handle('settings:get-all', async () => {
      return await this.settingsManager.getAll()
    })

    // File Transfer
    ipcMain.handle('sftp:upload', async (event, connectionId, localPath, remotePath) => {
      try {
        return await this.sshManager.uploadFile(connectionId, localPath, remotePath)
      } catch (error) {
        throw error
      }
    })

    ipcMain.handle('sftp:download', async (event, connectionId, remotePath, localPath) => {
      try {
        return await this.sshManager.downloadFile(connectionId, remotePath, localPath)
      } catch (error) {
        throw error
      }
    })

    ipcMain.handle('sftp:list', async (event, connectionId, path) => {
      try {
        return await this.sshManager.listFiles(connectionId, path)
      } catch (error) {
        throw error
      }
    })
  }

  public async initialize(): Promise<void> {
    // Security: Prevent navigation to external URLs
    app.on('web-contents-created', (event, contents) => {
      contents.on('will-navigate', (e, navigationUrl: string) => {
        const parsedUrl = new URL(navigationUrl)
        if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
          e.preventDefault()
        }
      })
    })

    // Setup IPC handlers
    this.setupIPC()

    // Initialize managers
    await this.keyManager.initialize()
    await this.settingsManager.initialize()

    // Create window when app is ready
    app.whenReady().then(() => {
      this.createWindow()

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow()
        }
      })
    })

    // Quit when all windows are closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    // Cleanup on app quit
    app.on('before-quit', async () => {
      await this.sshManager.disconnectAll()
      await this.keyManager.cleanup()
      await this.settingsManager.cleanup()
    })
  }
}

// Initialize the application
const mainApp = new MainApp()
mainApp.initialize().catch(console.error)

