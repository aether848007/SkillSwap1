import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'

// Routes where pressing the hardware back button should exit the app rather than navigate.
const ROOT_ROUTES = ['/', '/login', '/onboarding']

/**
 * Initializes Capacitor native behavior on Android: hides the splash once React has mounted,
 * styles the status bar, makes the hardware back button navigate (with double-press-to-exit on
 * root screens), and tidies up keyboard behavior. No-op on the web build.
 */
export function useNativeApp() {
  const navigate = useNavigate()
  const location = useLocation()

  // One-time setup: splash + status bar.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let cancelled = false
    ;(async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar')
        await StatusBar.setStyle({ style: Style.Light })
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#054d28' })
        }
      } catch {}
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen')
        if (!cancelled) await SplashScreen.hide()
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  // Hardware back button — re-registered when the route changes so it sees the latest location.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let remove = () => {}
    let lastBackPress = 0
    ;(async () => {
      try {
        const { App } = await import('@capacitor/app')
        const handle = await App.addListener('backButton', ({ canGoBack }) => {
          const onRoot = ROOT_ROUTES.includes(location.pathname)
          if (!onRoot && (canGoBack || window.history.length > 1)) {
            navigate(-1)
            return
          }
          const now = Date.now()
          if (now - lastBackPress < 2000) {
            App.exitApp()
          } else {
            lastBackPress = now
            showExitHint()
          }
        })
        remove = () => handle.remove()
      } catch {}
    })()
    return () => remove()
  }, [location.pathname, navigate])
}

// Lightweight transient toast for the "press back again to exit" hint (no app state needed).
function showExitHint() {
  const existing = document.getElementById('native-exit-hint')
  if (existing) return
  const el = document.createElement('div')
  el.id = 'native-exit-hint'
  el.textContent = 'Press back again to exit'
  Object.assign(el.style, {
    position: 'fixed', left: '50%', bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
    transform: 'translateX(-50%)', background: 'rgba(5,77,40,0.95)', color: '#fff',
    padding: '10px 18px', borderRadius: '999px', fontSize: '14px', zIndex: '9999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)', pointerEvents: 'none',
  })
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}
