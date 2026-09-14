let hasLoggedForcedAndroidKakao = false

export function isAndroidKakaoTalkInAppBrowser() {
  const isForcedForQa =
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('qa') === 'android-kakao'

  if (isForcedForQa) {
    if (!hasLoggedForcedAndroidKakao) {
      hasLoggedForcedAndroidKakao = true
      console.info('[QA] forced environment: android-kakao')
    }

    return true
  }

  if (typeof navigator === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent

  return /Android/i.test(userAgent) && /KAKAOTALK/i.test(userAgent)
}
