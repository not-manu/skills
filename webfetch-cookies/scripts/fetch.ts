#!/usr/bin/env bun

import { existsSync } from "fs"
import { join, dirname } from "path"
import TurndownService from "turndown"

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_TIMEOUT = 30_000 // 30 seconds
const MAX_TIMEOUT = 120_000 // 2 minutes

// ---------------------------------------------------------------------------
// Auto-install dependencies if needed
// ---------------------------------------------------------------------------

const scriptDir = dirname(new URL(import.meta.url).pathname)
if (!existsSync(join(scriptDir, "node_modules"))) {
  const install = Bun.spawnSync(["bun", "install"], { cwd: scriptDir, stderr: "inherit" })
  if (install.exitCode !== 0) {
    process.stderr.write("Failed to install dependencies\n")
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

interface Args {
  url: string
  cookiesPath?: string
  timeout: number
}

function parseArgs(): Args {
  const argv = process.argv.slice(2)
  let url: string | undefined
  let cookiesPath: string | undefined
  let timeout = DEFAULT_TIMEOUT

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--cookies" || arg === "-c") {
      cookiesPath = argv[++i]
      if (!cookiesPath) {
        process.stderr.write("Error: --cookies requires a file path\n")
        process.exit(1)
      }
    } else if (arg === "--timeout" || arg === "-t") {
      const val = Number(argv[++i])
      if (isNaN(val) || val <= 0) {
        process.stderr.write("Error: --timeout requires a positive number (seconds)\n")
        process.exit(1)
      }
      timeout = Math.min(val * 1000, MAX_TIMEOUT)
    } else if (arg === "--help" || arg === "-h") {
      printUsage()
      process.exit(0)
    } else if (!arg.startsWith("-")) {
      url = arg
    } else {
      process.stderr.write(`Unknown option: ${arg}\n`)
      printUsage()
      process.exit(1)
    }
  }

  if (!url) {
    process.stderr.write("Error: URL is required\n")
    printUsage()
    process.exit(1)
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`
  }

  return { url, cookiesPath, timeout }
}

function printUsage() {
  process.stderr.write(
    `Usage: bun run fetch.ts <url> [options]

Options:
  --cookies, -c <path>   Path to Netscape cookies.txt file
  --timeout, -t <secs>   Request timeout in seconds (max 120, default 30)
  --help, -h             Show this help
`
  )
}

// ---------------------------------------------------------------------------
// Netscape cookies.txt parser
// ---------------------------------------------------------------------------

interface Cookie {
  domain: string
  includeSubdomains: boolean
  path: string
  secure: boolean
  expiry: number
  name: string
  value: string
}

async function parseCookiesFile(filePath: string): Promise<Cookie[]> {
  const file = Bun.file(filePath)
  if (!(await file.exists())) {
    process.stderr.write(`Error: cookies file not found: ${filePath}\n`)
    process.exit(1)
  }

  const text = await file.text()
  const cookies: Cookie[] = []

  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    // Skip empty lines and comments (# lines), but allow #HttpOnly_ prefix
    if (!trimmed || (trimmed.startsWith("#") && !trimmed.startsWith("#HttpOnly_"))) {
      continue
    }

    // Strip #HttpOnly_ prefix — these are httponly cookies, still valid
    const normalized = trimmed.startsWith("#HttpOnly_") ? trimmed.slice(10) : trimmed

    const parts = normalized.split("\t")
    if (parts.length < 7) continue

    cookies.push({
      domain: parts[0],
      includeSubdomains: parts[1].toUpperCase() === "TRUE",
      path: parts[2],
      secure: parts[3].toUpperCase() === "TRUE",
      expiry: parseInt(parts[4], 10),
      name: parts[5],
      value: parts[6],
    })
  }

  return cookies
}

function matchCookies(cookies: Cookie[], url: URL): string {
  const now = Math.floor(Date.now() / 1000)

  const matched = cookies.filter((c) => {
    // Check expiry (0 means session cookie — always include)
    if (c.expiry !== 0 && c.expiry < now) return false

    // Domain matching
    const hostname = url.hostname
    if (c.domain.startsWith(".")) {
      // Wildcard domain: .example.com matches example.com and *.example.com
      const bare = c.domain.slice(1)
      if (hostname !== bare && !hostname.endsWith(c.domain)) return false
    } else {
      if (hostname !== c.domain) return false
    }

    // Path matching
    if (!url.pathname.startsWith(c.path)) return false

    // Secure flag
    if (c.secure && url.protocol !== "https:") return false

    return true
  })

  return matched.map((c) => `${c.name}=${c.value}`).join("; ")
}

// ---------------------------------------------------------------------------
// HTML to Markdown
// ---------------------------------------------------------------------------

function convertHTMLToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  })
  turndownService.remove(["script", "style", "meta", "link", "noscript"])
  return turndownService.turndown(html)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs()

  // Build headers
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  }

  // Parse and attach cookies
  if (args.cookiesPath) {
    const cookies = await parseCookiesFile(args.cookiesPath)
    const url = new URL(args.url)
    const cookieHeader = matchCookies(cookies, url)
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader
    } else {
      process.stderr.write("Warning: no cookies matched the target URL\n")
    }
  }

  // Fetch
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), args.timeout)

  let response: Response
  try {
    response = await fetch(args.url, {
      signal: controller.signal,
      headers,
      redirect: "follow",
    })
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === "AbortError") {
      process.stderr.write(`Error: request timed out after ${args.timeout / 1000}s\n`)
    } else {
      process.stderr.write(`Error: ${err.message}\n`)
    }
    process.exit(1)
  }

  clearTimeout(timeoutId)

  if (!response.ok) {
    process.stderr.write(`Error: HTTP ${response.status} ${response.statusText}\n`)
    process.exit(1)
  }

  // Size check
  const contentLength = response.headers.get("content-length")
  if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
    process.stderr.write("Error: response too large (exceeds 5MB limit)\n")
    process.exit(1)
  }

  const arrayBuffer = await response.arrayBuffer()
  if (arrayBuffer.byteLength > MAX_RESPONSE_SIZE) {
    process.stderr.write("Error: response too large (exceeds 5MB limit)\n")
    process.exit(1)
  }

  const content = new TextDecoder().decode(arrayBuffer)
  const contentType = response.headers.get("content-type") || ""

  // Convert to markdown if HTML, otherwise output as-is
  if (contentType.includes("text/html")) {
    const markdown = convertHTMLToMarkdown(content)
    process.stdout.write(markdown)
  } else {
    process.stdout.write(content)
  }
}

main()
