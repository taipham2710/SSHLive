import React, { useState, useEffect } from 'react'
import { Upload, Download, Folder, File, ArrowUp, RefreshCw, MoreVertical } from 'lucide-react'

interface FileInfo {
  name: string
  size: number
  type: 'file' | 'directory'
  permissions: string
  modified: Date
}

interface FileTransferProps {
  connectionId: string | null
}

export function FileTransfer({ connectionId }: FileTransferProps) {
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<FileInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (connectionId) {
      loadFiles(currentPath)
    }
  }, [connectionId, currentPath])

  const loadFiles = async (path: string) => {
    if (!connectionId) return

    setLoading(true)
    setError(null)
    
    try {
      if (window.electronAPI) {
        const fileList = await window.electronAPI.sftpList(connectionId, path)
        setFiles(fileList)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      setCurrentPath(prev => {
        const newPath = prev === '/' ? `/${fileName}` : `${prev}/${fileName}`
        return newPath
      })
    } else {
      setSelectedFiles(prev => {
        const newSet = new Set(prev)
        if (newSet.has(fileName)) {
          newSet.delete(fileName)
        } else {
          newSet.add(fileName)
        }
        return newSet
      })
    }
  }

  const handleUpload = async () => {
    if (!connectionId) return

    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files) return

      for (const file of Array.from(files)) {
        try {
          // In a real implementation, you would need to handle file upload
          // This would require additional backend functionality
          console.log('Uploading file:', file.name)
        } catch (error) {
          console.error('Upload failed:', error)
        }
      }
    }
    input.click()
  }

  const handleDownload = async (fileName: string) => {
    if (!connectionId) return

    try {
      // In a real implementation, you would download the file
      console.log('Downloading file:', fileName)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleGoUp = () => {
    if (currentPath !== '/') {
      const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/'
      setCurrentPath(parentPath)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatPermissions = (permissions: string): string => {
    return permissions.slice(-3)
  }

  if (!connectionId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center card p-10 max-w-md mx-auto">
          <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Active Connection</h3>
          <p className="text-gray-500 theme-light:text-slate-600">Connect to a server to transfer files</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-dark-700/70 separator-line">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">File Transfer</h2>
            <p className="text-gray-400 mt-1 theme-light:text-slate-600">Browse and transfer files via SFTP</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => loadFiles(currentPath)}
              className="btn-secondary flex items-center space-x-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleUpload}
              className="btn-primary flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Path Navigation */}
      <div className="px-6 py-3 bg-dark-800/70 backdrop-blur-md border-b border-dark-700/70 separator-line">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGoUp}
            disabled={currentPath === '/'}
            className="p-1.5 hover:bg-dark-700/70 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUp className="w-4 h-4 text-gray-300" />
          </button>
          <div className="text-sm text-gray-300 font-mono truncate max-w-[75%]">
            {currentPath}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2 text-red-400">
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2 text-gray-400 theme-light:text-slate-600">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading files...</span>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 card">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center gradient-secondary shadow-glow">
              <Folder className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Empty Directory</h3>
            <p className="text-gray-500">This directory is empty</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.name}
                className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedFiles.has(file.name)
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-700 hover:border-dark-600 hover:bg-dark-800/40'
                }`}
                onClick={() => handleFileSelect(file.name, file.type === 'directory')}
              >
                <div className="flex-shrink-0">
                  {file.type === 'directory' ? (
                    <Folder className="w-6 h-6 text-blue-400" />
                  ) : (
                    <File className="w-6 h-6 text-gray-400 theme-light:text-slate-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium truncate">{file.name}</span>
                    {file.type === 'directory' && (
                      <span className="text-xs text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        DIR
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400 theme-light:text-slate-600">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatPermissions(file.permissions)}</span>
                    <span>{file.modified.toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {file.type === 'file' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(file.name)
                      }}
                      className="px-2 py-1 hover:bg-dark-700 rounded-lg transition-colors text-sm text-gray-300"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    className="px-2 py-1 hover:bg-dark-700 rounded-lg transition-colors text-sm text-gray-300"
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-6 py-3 bg-dark-800/70 backdrop-blur-md border-t border-dark-700/70 separator-line">
        <div className="flex items-center justify-between text-sm text-gray-400 theme-light:text-slate-600">
          <div className="flex items-center space-x-4">
            <span>{files.length} items</span>
            {selectedFiles.size > 0 && (
              <span>{selectedFiles.size} selected</span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span>SFTP Connection</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

