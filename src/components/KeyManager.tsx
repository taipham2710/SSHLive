import React, { useState, useEffect } from 'react'
import { Key, Plus, Download, Upload, Trash2, Copy, Check } from 'lucide-react'

interface SSHKey {
  id: string
  name: string
  type: 'rsa' | 'ed25519' | 'ecdsa'
  publicKey: string
  fingerprint: string
  createdAt: Date
}

interface KeyGenerationOptions {
  type: 'rsa' | 'ed25519' | 'ecdsa'
  size?: number
  name: string
}

export function KeyManager() {
  const [keys, setKeys] = useState<SSHKey[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewKey, setShowNewKey] = useState(false)
  const [showImportKey, setShowImportKey] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [formData, setFormData] = useState<KeyGenerationOptions>({
    type: 'ed25519',
    size: 4096,
    name: '',
  })
  const [importData, setImportData] = useState({
    name: '',
    publicKey: '',
    privateKey: '',
  })

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = async () => {
    try {
      if (window.electronAPI) {
        const keyList = await window.electronAPI.keysList()
        setKeys(keyList)
      }
    } catch (error) {
      console.error('Error loading keys:', error)
    }
  }

  const generateKeyPair = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.keysGenerate(formData)
        await loadKeys()
        setShowNewKey(false)
        setFormData({
          type: 'ed25519',
          size: 4096,
          name: '',
        })
      }
    } catch (error) {
      console.error('Error generating key:', error)
    } finally {
      setLoading(false)
    }
  }

  const importKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.keysAdd({
          name: importData.name,
          publicKey: importData.publicKey,
          privateKey: importData.privateKey || undefined,
        })
        await loadKeys()
        setShowImportKey(false)
        setImportData({
          name: '',
          publicKey: '',
          privateKey: '',
        })
      }
    } catch (error) {
      console.error('Error importing key:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this key?')) return
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.keysRemove(keyId)
        await loadKeys()
      }
    } catch (error) {
      console.error('Error deleting key:', error)
    }
  }

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(keyId)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const getKeyTypeColor = (type: string) => {
    switch (type) {
      case 'ed25519':
        return 'text-purple-400 bg-purple-400/10'
      case 'rsa':
        return 'text-blue-400 bg-blue-400/10'
      case 'ecdsa':
        return 'text-green-400 bg-green-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10 theme-light:text-slate-600 theme-light:bg-slate-100/30'
    }
  }

  const getKeyTypeIcon = (type: string) => {
    switch (type) {
      case 'ed25519':
        return '🔐'
      case 'rsa':
        return '🔑'
      case 'ecdsa':
        return '🗝️'
      default:
        return '🔒'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-dark-700/70 separator-line">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">SSH Keys</h2>
            <p className="text-gray-400 mt-1 theme-light:text-slate-600">Manage your SSH key pairs for secure authentication</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowImportKey(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import Key</span>
            </button>
            <button
              onClick={() => setShowNewKey(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Generate New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Keys List */}
      <div className="flex-1 overflow-y-auto p-6">
        {keys.length === 0 ? (
          <div className="text-center py-12">
            <Key className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No SSH Keys</h3>
            <p className="text-gray-500 mb-6">Generate or import SSH keys to secure your connections</p>
            <button
              onClick={() => setShowNewKey(true)}
              className="btn-primary"
            >
              Generate Your First Key
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {keys.map((key) => (
              <div key={key.id} className="card card-hover p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${getKeyTypeColor(key.type)}`}>
                      {getKeyTypeIcon(key.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{key.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKeyTypeColor(key.type)}`}>
                          {key.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2 theme-light:text-slate-600">
                        Fingerprint: <code className="bg-dark-700 px-2 py-1 rounded text-xs">{key.fingerprint}</code>
                      </p>
                      <p className="text-xs text-gray-500">
                        Created {key.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(key.publicKey, key.id)}
                      className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                      title="Copy public key"
                    >
                      {copiedKey === key.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400 theme-light:text-slate-600" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => deleteKey(key.id)}
                      className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                      title="Delete key"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-dark-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-400 theme-light:text-slate-600">Public Key</span>
                    <button
                      onClick={() => copyToClipboard(key.publicKey, `${key.id}-pub`)}
                      className="text-xs text-primary-400 hover:text-primary-300"
                    >
                      {copiedKey === `${key.id}-pub` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <code className="text-xs text-gray-300 break-all">
                    {key.publicKey}
                  </code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Key Modal */}
      {showNewKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Generate New SSH Key</h3>
            
            <form onSubmit={generateKeyPair} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-primary w-full"
                  placeholder="My Server Key"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Key Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="input-primary w-full"
                >
                  <option value="ed25519">ED25519 (Recommended)</option>
                  <option value="rsa">RSA</option>
                  <option value="ecdsa">ECDSA</option>
                </select>
              </div>

              {formData.type === 'rsa' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Key Size (bits)
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                    className="input-primary w-full"
                  >
                    <option value={2048}>2048</option>
                    <option value={3072}>3072</option>
                    <option value={4096}>4096 (Recommended)</option>
                  </select>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewKey(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Generating...' : 'Generate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Key Modal */}
      {showImportKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Import SSH Key</h3>
            
            <form onSubmit={importKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={importData.name}
                  onChange={(e) => setImportData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-primary w-full"
                  placeholder="Imported Key"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Public Key
                </label>
                <textarea
                  value={importData.publicKey}
                  onChange={(e) => setImportData(prev => ({ ...prev, publicKey: e.target.value }))}
                  className="input-primary w-full h-20 resize-none"
                  placeholder="ssh-rsa AAAAB3NzaC1yc2E..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Private Key (optional)
                </label>
                <textarea
                  value={importData.privateKey}
                  onChange={(e) => setImportData(prev => ({ ...prev, privateKey: e.target.value }))}
                  className="input-primary w-full h-32 resize-none"
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowImportKey(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Importing...' : 'Import'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

