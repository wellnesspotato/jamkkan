type FontEmbedRequest = {
  googleCssUrl: string
  daughterFontUrl: string
  newlywedFontUrl: string
}

type FontEmbedProgress = {
  type: 'progress'
  step: string
  elapsedMs: number
  resourceCount?: number
}

type FontEmbedResult =
  | {
      type: 'complete'
      css: string
      elapsedMs: number
      resourceCount: number
    }
  | {
      type: 'error'
      message: string
    }

const workerScope = self as unknown as Worker

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 32_768
  let binary = ''

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }

  return btoa(binary)
}

function getMimeType(url: string, response: Response) {
  return (
    response.headers.get('Content-Type') ??
    (url.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream')
  )
}

async function embedFontResources(css: string, baseUrl: string) {
  const matches = Array.from(css.matchAll(/url\((['"]?)([^'")]+)\1\)/g))
  const resourceUrls = Array.from(
    new Set(matches.map((match) => new URL(match[2], baseUrl).href)),
  )
  const replacements = await Promise.all(
    resourceUrls.map(async (url) => {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Font request failed: ${response.status} ${url}`)
      }

      const buffer = await response.arrayBuffer()
      const dataUrl = `data:${getMimeType(url, response)};base64,${arrayBufferToBase64(buffer)}`

      return { url, dataUrl }
    }),
  )

  let embeddedCss = css

  matches.forEach((match) => {
    const originalUrl = match[2]
    const resolvedUrl = new URL(originalUrl, baseUrl).href
    const replacement = replacements.find(({ url }) => url === resolvedUrl)

    if (replacement !== undefined) {
      embeddedCss = embeddedCss.replaceAll(originalUrl, replacement.dataUrl)
    }
  })

  return {
    css: embeddedCss,
    resourceCount: resourceUrls.length,
  }
}

workerScope.onmessage = async (event: MessageEvent<FontEmbedRequest>) => {
  const startedAt = performance.now()

  try {
    const googleResponse = await fetch(event.data.googleCssUrl)

    if (!googleResponse.ok) {
      throw new Error(`Google font CSS request failed: ${googleResponse.status}`)
    }

    const googleCss = await googleResponse.text()
    const localCss = `
      @font-face {
        font-family: "NanumURiDdarSonGeurSsi";
        src: url("${event.data.daughterFontUrl}") format("woff2");
        font-style: normal;
        font-weight: 400;
      }
      @font-face {
        font-family: "NanumSinHonBuBu";
        src: url("${event.data.newlywedFontUrl}") format("woff2");
        font-style: normal;
        font-weight: 400;
      }
    `
    const sourceCss = `${googleCss}\n${localCss}`
    const cssReadyMessage: FontEmbedProgress = {
      type: 'progress',
      step: 'font-css-fetched',
      elapsedMs: performance.now() - startedAt,
    }
    workerScope.postMessage(cssReadyMessage)

    const embedded = await embedFontResources(
      sourceCss,
      event.data.googleCssUrl,
    )
    const result: FontEmbedResult = {
      type: 'complete',
      css: embedded.css,
      elapsedMs: performance.now() - startedAt,
      resourceCount: embedded.resourceCount,
    }
    workerScope.postMessage(result)
  } catch (error) {
    const result: FontEmbedResult = {
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    }
    workerScope.postMessage(result)
  }
}
