#!/usr/bin/env python3
"""Convert YouTube videos into markdown documents with metadata + transcript.

Usage:
    yt2md.py <url> [<url> ...] [-o OUTDIR] [-w WIDTH]
    yt2md.py -f urls.txt [-o OUTDIR] [-w WIDTH]

Each output file is named after the video title (sanitized) and contains:
title, channel, URL, upload date, duration, views, description, and a
reflowed plain-text transcript (auto-captions if no manual subs exist).

Requires `yt-dlp` on PATH.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
from pathlib import Path

URL_RE = re.compile(r"https?://\S+")
UNSAFE_CHARS = re.compile(r'[/\\:*?"<>|]')


def extract_urls(args_urls: list[str], file_path: Path | None) -> list[str]:
    urls: list[str] = list(args_urls)
    if file_path:
        text = file_path.read_text()
        urls.extend(URL_RE.findall(text))
    # de-dupe, preserve order
    seen = set()
    out = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def sanitize_filename(name: str) -> str:
    name = UNSAFE_CHARS.sub("", name)
    name = re.sub(r"\s+", " ", name).strip()
    # Trim aggressively-long titles so the filename stays sane on all FSes.
    return name[:200] or "untitled"


def parse_srt(srt_text: str) -> str:
    """Strip SRT indices, timestamps, and inline tags; collapse repeated lines.

    YouTube auto-captions emit each phrase twice (rolling window), so we
    drop consecutive duplicates to recover readable prose.
    """
    lines = []
    prev = None
    for raw in srt_text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.isdigit():
            continue
        if "-->" in line:
            continue
        line = re.sub(r"<[^>]*>", "", line)
        if line and line != prev:
            lines.append(line)
            prev = line
    return " ".join(lines)


def reflow(text: str, width: int) -> str:
    if not text:
        return ""
    return textwrap.fill(
        text,
        width=width,
        break_long_words=False,
        break_on_hyphens=False,
    )


def run_yt_dlp(url: str, workdir: Path) -> Path:
    """Fetch metadata + subtitles for one URL; return the info.json path."""
    cmd = [
        "yt-dlp",
        "--skip-download",
        "--write-info-json",
        "--write-auto-subs",
        "--write-subs",
        "--sub-langs", "en.*,en",
        "--convert-subs", "srt",
        "--no-progress",
        "--quiet",
        "-o", "%(id)s.%(ext)s",
        url,
    ]
    subprocess.run(cmd, cwd=workdir, check=True)
    infos = list(workdir.glob("*.info.json"))
    # The newest info.json is the one we just wrote.
    infos.sort(key=lambda p: p.stat().st_mtime)
    return infos[-1]


def find_transcript(workdir: Path, video_id: str) -> str:
    """Prefer manual `.en.srt`, fall back to auto `.en-orig.srt` or any en variant."""
    candidates = [
        workdir / f"{video_id}.en.srt",
        workdir / f"{video_id}.en-orig.srt",
    ]
    candidates.extend(sorted(workdir.glob(f"{video_id}.en*.srt")))
    for p in candidates:
        if p.exists():
            return p.read_text()
    return ""


def format_upload_date(yyyymmdd: str | None) -> str:
    if not yyyymmdd or len(yyyymmdd) != 8:
        return yyyymmdd or ""
    return f"{yyyymmdd[:4]}-{yyyymmdd[4:6]}-{yyyymmdd[6:]}"


def build_markdown(info: dict, transcript: str, width: int) -> str:
    title = info.get("title", "Untitled")
    parts = [f"# {title}", ""]
    parts.append(f"- **Channel:** {info.get('channel', '')}")
    parts.append(f"- **URL:** {info.get('webpage_url', '')}")
    parts.append(f"- **Uploaded:** {format_upload_date(info.get('upload_date'))}")
    parts.append(f"- **Duration:** {info.get('duration', '')}s")
    parts.append(f"- **Views:** {info.get('view_count', '')}")
    parts.append("")
    parts.append("## Description")
    parts.append("")
    parts.append((info.get("description") or "").rstrip())
    parts.append("")
    parts.append("## Transcript")
    parts.append("")
    parts.append(reflow(transcript, width) if transcript else "_(no captions available)_")
    parts.append("")
    return "\n".join(parts)


def process_url(url: str, outdir: Path, width: int) -> Path:
    with tempfile.TemporaryDirectory() as tmp:
        workdir = Path(tmp)
        info_path = run_yt_dlp(url, workdir)
        info = json.loads(info_path.read_text())
        transcript_srt = find_transcript(workdir, info["id"])
        transcript = parse_srt(transcript_srt) if transcript_srt else ""
        md = build_markdown(info, transcript, width)
        outfile = outdir / f"{sanitize_filename(info['title'])}.md"
        outfile.write_text(md)
        return outfile


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("urls", nargs="*", help="YouTube URLs")
    ap.add_argument("-f", "--file", type=Path, help="File containing URLs (one per line, or any text with URLs)")
    ap.add_argument("-o", "--outdir", type=Path, default=Path("."), help="Output directory (default: cwd)")
    ap.add_argument("-w", "--width", type=int, default=80, help="Transcript reflow width (default: 80)")
    args = ap.parse_args()

    if not shutil.which("yt-dlp"):
        print("error: yt-dlp not found on PATH", file=sys.stderr)
        return 2

    urls = extract_urls(args.urls, args.file)
    if not urls:
        ap.error("no URLs provided (pass URLs as args or use -f FILE)")

    args.outdir.mkdir(parents=True, exist_ok=True)
    failed = 0
    for url in urls:
        try:
            out = process_url(url, args.outdir, args.width)
            print(f"wrote {out}")
        except subprocess.CalledProcessError as e:
            print(f"error: yt-dlp failed for {url}: {e}", file=sys.stderr)
            failed += 1
        except Exception as e:
            print(f"error: {url}: {e}", file=sys.stderr)
            failed += 1
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
