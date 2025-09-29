import { promises as fs } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { generateKeyPairSync, createHash, randomBytes } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { EventEmitter } from 'events'

export interface SSHKey {
  id: string
  name: string
  type: 'rsa' | 'ed25519' | 'ecdsa'
  publicKey: string
  privateKey?: string
  fingerprint: string
  createdAt: Date
  encrypted?: boolean
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

export class KeyManager extends EventEmitter {
  private keys: Map<string, SSHKey> = new Map()
  private keysDirectory: string
  private encryptionKey?: Buffer

  constructor() {
    super()
    this.keysDirectory = join(homedir(), '.ssh-live', 'keys')
  }

  public async initialize(): Promise<void> {
    try {
      // Create keys directory if it doesn't exist
      await fs.mkdir(this.keysDirectory, { recursive: true })
      
      // Generate or load encryption key for private keys
      await this.initializeEncryptionKey()
      
      // Load existing keys
      await this.loadKeys()
      
      this.emit('initialized')
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  private async initializeEncryptionKey(): Promise<void> {
    const keyPath = join(this.keysDirectory, '.encryption.key')
    
    try {
      const keyData = await fs.readFile(keyPath)
      this.encryptionKey = keyData
    } catch (error) {
      // Generate new symmetric encryption key (32 bytes)
      this.encryptionKey = randomBytes(32)
      await fs.writeFile(keyPath, this.encryptionKey, { mode: 0o600 })
    }
  }

  private async loadKeys(): Promise<void> {
    try {
      const files = await fs.readdir(this.keysDirectory)
      const keyFiles = files.filter(file => file.endsWith('.json'))

      for (const file of keyFiles) {
        try {
          const keyData = await fs.readFile(join(this.keysDirectory, file), 'utf8')
          const key: SSHKey = JSON.parse(keyData)
          key.createdAt = new Date(key.createdAt)
          this.keys.set(key.id, key)
        } catch (error) {
          console.error(`Error loading key file ${file}:`, error)
        }
      }
    } catch (error) {
      console.error('Error loading keys:', error)
    }
  }

  private async saveKey(key: SSHKey): Promise<void> {
    const keyPath = join(this.keysDirectory, `${key.id}.json`)
    const keyData = JSON.stringify(key, null, 2)
    
    await fs.writeFile(keyPath, keyData, { mode: 0o600 })
  }

  private generateFingerprint(publicKey: string): string {
    // Extract key data from OpenSSH format
    const keyParts = publicKey.trim().split(' ')
    if (keyParts.length < 2) {
      throw new Error('Invalid public key format')
    }

    const keyData = Buffer.from(keyParts[1], 'base64')
    const hash = createHash('sha256').update(keyData).digest('hex')
    
    // Format as SSH fingerprint (SHA256:xxxx)
    return `SHA256:${hash.toUpperCase()}`
  }

  public async addKey(keyData: SSHKeyData): Promise<SSHKey> {
    try {
      const fingerprint = this.generateFingerprint(keyData.publicKey)
      
      // Determine key type from public key
      const keyType = this.determineKeyType(keyData.publicKey)
      
      const key: SSHKey = {
        id: uuidv4(),
        name: keyData.name,
        type: keyType,
        publicKey: keyData.publicKey,
        fingerprint,
        createdAt: new Date(),
        encrypted: !!keyData.privateKey,
      }

      // Encrypt private key if provided
      if (keyData.privateKey) {
        key.privateKey = await this.encryptPrivateKey(keyData.privateKey)
      }

      this.keys.set(key.id, key)
      await this.saveKey(key)
      
      this.emit('key:added', key)
      return key
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  public async removeKey(keyId: string): Promise<{ success: boolean }> {
    try {
      const key = this.keys.get(keyId)
      if (!key) {
        throw new Error(`Key ${keyId} not found`)
      }

      // Remove key file
      const keyPath = join(this.keysDirectory, `${keyId}.json`)
      await fs.unlink(keyPath)
      
      this.keys.delete(keyId)
      this.emit('key:removed', key)
      
      return { success: true }
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  public async generateKeyPair(options: KeyGenerationOptions): Promise<SSHKeyPair> {
    try {
      if (options.type === 'rsa') {
        const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: options.size || 4096 })
        const publicKeyString = publicKey.export({ type: 'spki', format: 'pem' }).toString()
        const privateKeyString = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
        const fingerprint = this.generateFingerprint(publicKeyString)
        await this.addKey({ name: options.name, publicKey: publicKeyString, privateKey: privateKeyString })
        return { publicKey: publicKeyString, privateKey: privateKeyString, fingerprint }
      }

      if (options.type === 'ecdsa') {
        const curve = options.size === 256 ? 'prime256v1' : 'secp384r1'
        const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: curve })
        const publicKeyString = publicKey.export({ type: 'spki', format: 'pem' }).toString()
        const privateKeyString = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
        const fingerprint = this.generateFingerprint(publicKeyString)
        await this.addKey({ name: options.name, publicKey: publicKeyString, privateKey: privateKeyString })
        return { publicKey: publicKeyString, privateKey: privateKeyString, fingerprint }
      }

      // ed25519 via node:crypto generateKeyPairSync('ed25519')
      if (options.type === 'ed25519') {
        const { publicKey, privateKey } = generateKeyPairSync('ed25519')
        const publicKeyString = publicKey.export({ type: 'spki', format: 'pem' }).toString()
        const privateKeyString = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
        const fingerprint = this.generateFingerprint(publicKeyString)
        await this.addKey({ name: options.name, publicKey: publicKeyString, privateKey: privateKeyString })
        return { publicKey: publicKeyString, privateKey: privateKeyString, fingerprint }
      }
      
      throw new Error('Unsupported key type')
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  public listKeys(): SSHKey[] {
    return Array.from(this.keys.values()).map(key => ({
      ...key,
      privateKey: undefined, // Never expose private keys in list
    }))
  }

  public async getPrivateKey(keyId: string): Promise<string | null> {
    const key = this.keys.get(keyId)
    if (!key || !key.privateKey) {
      return null
    }

    try {
      return await this.decryptPrivateKey(key.privateKey)
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  private determineKeyType(publicKey: string): 'rsa' | 'ed25519' | 'ecdsa' {
    if (publicKey.includes('BEGIN RSA PUBLIC KEY') || publicKey.includes('ssh-rsa')) {
      return 'rsa'
    } else if (publicKey.includes('BEGIN ED25519 PUBLIC KEY') || publicKey.includes('ssh-ed25519')) {
      return 'ed25519'
    } else if (publicKey.includes('BEGIN EC PUBLIC KEY') || publicKey.includes('ecdsa-sha2-')) {
      return 'ecdsa'
    }
    
    throw new Error('Unable to determine key type')
  }

  private async encryptPrivateKey(privateKey: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized')
    }
    
    // Simple XOR encryption for demo - in production use proper encryption
    const keyBuffer = Buffer.from(privateKey, 'utf8')
    const encrypted = Buffer.alloc(keyBuffer.length)
    
    for (let i = 0; i < keyBuffer.length; i++) {
      encrypted[i] = keyBuffer[i] ^ this.encryptionKey[i % this.encryptionKey.length]
    }
    
    return encrypted.toString('base64')
  }

  private async decryptPrivateKey(encryptedPrivateKey: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized')
    }
    
    const encryptedBuffer = Buffer.from(encryptedPrivateKey, 'base64')
    const decrypted = Buffer.alloc(encryptedBuffer.length)
    
    for (let i = 0; i < encryptedBuffer.length; i++) {
      decrypted[i] = encryptedBuffer[i] ^ this.encryptionKey[i % this.encryptionKey.length]
    }
    
    return decrypted.toString('utf8')
  }

  public async cleanup(): Promise<void> {
    // Cleanup resources if needed
    this.keys.clear()
  }
}

