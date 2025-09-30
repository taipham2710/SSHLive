import React, { useState } from 'react'
import { Plus, Server, Key, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useSSH, SSHConnectionConfig } from '../hooks/useSSH'

interface ConnectionManagerProps {
  onConnectionSelect: (connectionId: string) => void
}

interface ConnectionFormData {
  name: string
  host: string
  port: number
  username: string
  password: string
  useKeyAuth: boolean
  keyId: string
  passphrase: string
}

export function ConnectionManager({ onConnectionSelect }: ConnectionManagerProps) {
  const { connections, loading, error, connect } = useSSH()
  const [showNewConnection, setShowNewConnection] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    useKeyAuth: false,
    keyId: '',
    passphrase: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const config: SSHConnectionConfig = {
        host: formData.host,
        port: formData.port,
        username: formData.username,
      }

      if (formData.useKeyAuth) {
        // TODO: Get private key from key manager
        // config.privateKey = await getPrivateKey(formData.keyId)
        // config.passphrase = formData.passphrase || undefined
      } else {
        config.password = formData.password
      }

      const connection = await connect(config)
      onConnectionSelect(connection.id)
      setShowNewConnection(false)
      resetForm()
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: 22,
      username: '',
      password: '',
      useKeyAuth: false,
      keyId: '',
      passphrase: '',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'connecting':
        return <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <div className="w-4 h-4 bg-gray-500 rounded-full" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'border-green-400/30 bg-green-400/10'
      case 'connecting':
        return 'border-primary-400/30 bg-primary-400/10'
      case 'error':
        return 'border-red-400/30 bg-red-400/10'
      default:
        return 'border-gray-600 bg-gray-800/50'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-dark-700/70">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">SSH Connections</h2>
            <p className="text-gray-400 mt-1 theme-light:text-slate-600">Manage your SSH server connections</p>
          </div>
          <button
            onClick={() => setShowNewConnection(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Connection</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Connections List */}
      <div className="flex-1 overflow-y-auto p-6">
        {connections.length === 0 ? (
          <div className="max-w-3xl mx-auto">
            <div className="card card-hover p-10 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center gradient-secondary shadow-glow">
                <Server className="w-8 h-8 text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-200 mb-2">No Connections</h3>
              <p className="text-gray-400 mb-6 theme-light:text-slate-600">Create your first SSH connection to get started</p>
              <button
                onClick={() => setShowNewConnection(true)}
                className="btn-primary"
              >
                Create Connection
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className={`card card-hover p-4 cursor-pointer transition-all duration-200 border-l-4 ${getStatusColor(connection.status)}`}
                onClick={() => onConnectionSelect(connection.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(connection.status)}
                    <div>
                      <h3 className="font-semibold text-white">
                        {connection.username}@{connection.host}
                      </h3>
                      <p className="text-sm text-gray-400 theme-light:text-slate-600">
                        Port {connection.port} • {connection.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {connection.connectedAt && (
                      <p className="text-xs text-gray-500">
                        Connected {connection.connectedAt.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Connection Modal */}
      {showNewConnection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800/90 backdrop-blur-md border border-dark-700 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">New SSH Connection</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Connection Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-primary w-full"
                  placeholder="My Server"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Host
                  </label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                    className="input-primary w-full"
                    placeholder="192.168.1.100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }))}
                    className="input-primary w-full"
                    min="1"
                    max="65535"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="input-primary w-full"
                  placeholder="root"
                  required
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.useKeyAuth}
                    onChange={(e) => setFormData(prev => ({ ...prev, useKeyAuth: e.target.checked }))}
                    className="rounded border-gray-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-300">Use SSH Key Authentication</span>
                </label>
              </div>

              {formData.useKeyAuth ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Key Passphrase (optional)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassphrase ? "text" : "password"}
                      value={formData.passphrase}
                      onChange={(e) => setFormData(prev => ({ ...prev, passphrase: e.target.value }))}
                      className="input-primary w-full pr-10"
                      placeholder="Enter passphrase if key is encrypted"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 theme-light:text-slate-600 theme-light:hover:text-slate-700"
                    >
                      {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="input-primary w-full pr-10"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 theme-light:text-slate-600 theme-light:hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewConnection(false)}
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
                    <Server className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Connecting...' : 'Connect'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

