import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const THEME_KEY = 'ydiFyedk-theme'
const THEMES = ['light', 'dark', 'system']

const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
})

const getStoredTheme = () => {
  if (typeof window === 'undefined') return 'system'
  const saved = window.localStorage.getItem(THEME_KEY)
  return THEMES.includes(saved) ? saved : 'system'
}

const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme)
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event) => setSystemTheme(event.matches ? 'dark' : 'light')

    setSystemTheme(media.matches ? 'dark' : 'light')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    const resolved = theme === 'system' ? systemTheme : theme
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved
  }, [theme, systemTheme])

  const value = useMemo(() => ({
    theme,
    resolvedTheme: theme === 'system' ? systemTheme : theme,
    setTheme,
  }), [theme, systemTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
