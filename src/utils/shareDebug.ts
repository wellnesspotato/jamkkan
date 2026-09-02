export function isShareDebugEnabled() {
  return new URLSearchParams(window.location.search).get('shareDebug') === '1'
}

export function logShareDebug(
  step: string,
  details: Record<string, unknown> = {},
) {
  if (isShareDebugEnabled()) {
    console.info(`[jamkkan share] ${step}`, details)
  }
}

export function getErrorDetails(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return {
      name: 'UnknownError',
      message: String(error),
      isDomException: false,
    }
  }

  return {
    name: 'name' in error ? String(error.name) : 'UnknownError',
    message: 'message' in error ? String(error.message) : '',
    isDomException:
      typeof DOMException !== 'undefined' && error instanceof DOMException,
  }
}

export function isAbortError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  )
}
