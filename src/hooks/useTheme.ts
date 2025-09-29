import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'auto'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    // Load theme from settings
    const loadTheme = async () => {
      try {
        if (window.electronAPI) {
          const savedTheme = await window.electronAPI.settingsGet('theme')
          setTheme(savedTheme || 'dark')
        }
      } catch (error) {
        console.error('Error loading theme:', error)
      }
    }

    loadTheme()
  }, [])

  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'dark' ? 'light' : 'dark'
      setTheme(newTheme)
      
      if (window.electronAPI) {
        await window.electronAPI.settingsSet('theme', newTheme)
      }
    } catch (error) {
      console.error('Error saving theme:', error)
    }
  }

  const setThemeValue = async (newTheme: Theme) => {
    try {
      setTheme(newTheme)
      
      if (window.electronAPI) {
        await window.electronAPI.settingsSet('theme', newTheme)
      }
    } catch (error) {
      console.error('Error saving theme:', error)
    }
  }

  return {
    theme,
    toggleTheme,
    setTheme: setThemeValue,
  }
}

