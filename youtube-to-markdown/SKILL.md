---
name: youtube-to-markdown
description: "Convert one or more YouTube video URLs into markdown documents containing the title, channel, URL, upload date, duration, view count, full description, and a reflowed plain-text transcript (auto-captions if no manual subs exist). Use this skill whenever the user wants to archive, summarize, study, or analyze YouTube videos as text — phrases like 'turn this video into markdown', 'get the transcript', 'extract the description and captions', 'pull these YouTube videos into notes', or any time a list of YouTube URLs needs to become readable text files. Also trigger when the user passes a file containing YouTube URLs (e.g. videos.md, links.txt) and asks for transcripts or summaries."
---

# YouTube → Markdown

Convert YouTube URLs into one markdown file per video. Each file is named after the (sanitized) video title and contains the metadata header plus a transcript reflowed to a fixed column width so it reads like prose, not subtitle fragments.

## How to use this skill

Run the bundled script. It accepts URLs as positional args, a file containing URLs via `-f`, or both. It writes one `.md` per video into `--outdir` (default: cwd).

```bash
python3 scripts/yt2md.py <url> [<url> ...] [-o OUTDIR] [-w WIDTH]
python3 scripts/yt2md.py -f videos.md -o videos/
```

Use the script's path relative to the skill directory — don't reimplement the workflow inline. If the user has a file like `videos.md` with mixed text and URLs, point `-f` at it; the script extracts every `https?://` URL it finds.

## Requirements

- `yt-dlp` on PATH (`brew install yt-dlp` on macOS). The script checks this and exits with a clear error if missing.
- Python 3.9+ (uses only stdlib: `argparse`, `json`, `re`, `subprocess`, `tempfile`, `textwrap`).

## What the script does, and why

1. **`yt-dlp --write-info-json --write-auto-subs --write-subs --sub-langs en.*,en --convert-subs srt`** into a temp dir. We grab both manual and auto subs because many videos only have one of the two; the `en.*` glob also catches `en-orig` (auto-generated original-language captions YouTube emits).
2. **Parse `info.json`** for title, channel, URL, upload date, duration, views, description.
3. **Parse the SRT** by stripping cue indices, `-->` timestamps, and inline `<...>` tags, then dropping consecutive duplicate lines. YouTube auto-captions emit each phrase twice as the rolling caption window advances — without the dedupe, transcripts come out doubled.
4. **Reflow** the joined transcript with `textwrap.fill(width=80)`. This produces the same shape as `vim`'s `gqq` on a single joined paragraph, but without shelling out to vim, so the script works in headless environments.
5. **Sanitize the title** for the filename (`/ \ : * ? " < > |` removed, whitespace collapsed, capped at 200 chars) and write `<title>.md`.

If a video has no captions at all (creator disabled them and YouTube didn't auto-generate any), the transcript section reads `_(no captions available)_` rather than failing the whole run.

## Output format

Each file uses this exact structure:

```markdown
# <title>

- **Channel:** <channel>
- **URL:** <webpage_url>
- **Uploaded:** YYYY-MM-DD
- **Duration:** <seconds>s
- **Views:** <count>

## Description

<raw description from YouTube, including links and hashtags>

## Transcript

<reflowed plain text, paragraph-style, ~80 cols>
```

## Common variations

- **Different reflow width** (e.g., for narrow terminals or wide editors): `-w 100`.
- **Single video, dump to current dir**: `python3 scripts/yt2md.py <url>`.
- **Bulk archive from a notes file**: `python3 scripts/yt2md.py -f notes.md -o archive/`.
- **Failures don't abort the batch**: each URL is processed independently; the script prints errors per-URL and exits non-zero only if at least one failed.
