export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function isStandalone(displayMode = window.matchMedia('(display-mode: standalone)').matches) {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  return displayMode || navigatorWithStandalone.standalone === true
}

export function isIos(userAgent = navigator.userAgent) {
  return /iphone|ipad|ipod/i.test(userAgent)
}

