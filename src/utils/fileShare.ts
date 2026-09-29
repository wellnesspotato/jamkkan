export function canShareFile(file: File) {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.share !== 'function'
  ) {
    return false
  }

  try {
    return (
      typeof navigator.canShare !== 'function' ||
      navigator.canShare({ files: [file] })
    )
  } catch {
    return false
  }
}
