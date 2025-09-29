import React, { useEffect, useState } from 'react'
import { Wifi, WifiOff, Clock, User } from 'lucide-react'

interface StatusBarProps {
  activeConnection: string | null
  currentView: string
}

export function StatusBar({ activeConnection, currentView }: StatusBarProps) {
  const getConnectionStatus = () => {
    if (!activeConnection) {
      return { icon: WifiOff, text: 'Disconnected', color: 'text-red-400' }
    }
    return { icon: Wifi, text: 'Connected', color: 'text-green-400' }
  }

  const status = getConnectionStatus()
  const StatusIcon = status.icon

  // realtime 24h clock
  const [time, setTime] = useState<string>(() => new Date().toLocaleTimeString([], { hour12: false }))
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour12: false }))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-dark-800 border-t border-dark-700 text-sm">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <StatusIcon className={`w-4 h-4 ${status.color}`} />
          <span className={status.color}>{status.text}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-400">
          <User className="w-4 h-4" />
          <span>View: {currentView}</span>
        </div>
      </div>

      <div className="flex items-center space-x-6 text-gray-400">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>{time}</span>
        </div>
        
        <div className="text-xs">
          SSH Live v1.0.0
        </div>
      </div>
    </div>
  )
}

