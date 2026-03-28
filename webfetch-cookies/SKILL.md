---
name: webfetch-cookies
description: "Fetch web pages as markdown with cookie authentication support. Use this skill whenever the user needs to scrape or fetch content from a page that requires login cookies, mentions a cookies.txt file, wants to download authenticated web content, or needs to visit a cookie-protected page and get markdown output. Also use when the built-in webfetch tool fails due to authentication and the user has cookies available."
---

# Web Fetch with Cookies

Fetch web pages and convert them to markdown, with support for Netscape `cookies.txt` files to handle authenticated/cookie-protected pages.

This skill wraps a Bun CLI script. Use it instead of the built-in `webfetch` tool when the target page requires cookies for authentication (e.g., pages behind a login, paywalled content, session-protected resources).

## Usage

The CLI is globally linked as `webfetch-cookies`. Run it via the Bash tool:

```bash
webfetch-cookies <url> [--cookies <path-to-cookies.txt>]
```

### Examples

Fetch a public page (no cookies needed):
```bash
webfetch-cookies https://example.com
```

Fetch an authenticated page with cookies:
```bash
webfetch-cookies https://internal.example.com/dashboard --cookies ~/cookies.txt
```

With a custom timeout (in seconds, max 120):
```bash
webfetch-cookies https://slow-site.com --cookies ./cookies.txt --timeout 60
```

### Output

- Markdown is written to **stdout** -- capture it or pipe it as needed
- Errors and warnings go to **stderr**
- Exit code 0 on success, non-zero on failure

If the response content-type is `text/html`, it is automatically converted to markdown (headings, links, lists, code blocks preserved). Non-HTML responses are passed through as-is.

### Auto-install

Dependencies (`turndown`) are installed automatically on first run. No manual setup needed.

## Cookies.txt Format

The `--cookies` flag expects a file in **Netscape/Mozilla cookies.txt** format -- the same format used by `curl -b`, `wget`, and browser extensions like "Get cookies.txt LOCALLY".

Each line is tab-separated with 7 fields:

```
domain	flag	path	secure	expiry	name	value
```

Example:
```
.example.com	TRUE	/	TRUE	0	session_id	abc123def456
.example.com	TRUE	/	FALSE	1735689600	preference	dark_mode
```

Lines starting with `#` are treated as comments (except `#HttpOnly_` prefixed lines, which are valid httponly cookies). The script automatically filters cookies by domain, path, expiry, and secure flag to only send relevant ones.

### How to get a cookies.txt file

Most users export cookies from their browser using an extension:
- **Chrome/Edge**: "Get cookies.txt LOCALLY" extension
- **Firefox**: "cookies.txt" extension
- **Safari**: Export via developer tools or third-party scripts

Tell the user to:
1. Log into the target site in their browser
2. Use the extension to export cookies for that domain
3. Save the file and pass its path via `--cookies`

## When to Use This vs Built-in WebFetch

| Scenario | Tool |
|----------|------|
| Public page, no auth needed | Built-in `webfetch` tool |
| Page requires login/session cookies | This skill |
| Built-in webfetch returns 401/403 | This skill (with cookies) |
| User mentions cookies.txt | This skill |

## Error Handling

The script exits non-zero and prints to stderr on:
- Missing or invalid URL
- Cookies file not found
- HTTP errors (4xx, 5xx)
- Response exceeds 5MB
- Request timeout

If no cookies match the target URL's domain/path, a warning is printed but the request still proceeds (useful if the page works without cookies too).
