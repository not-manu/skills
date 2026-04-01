---
name: pixelarticons
description: "Search and retrieve pixel art icons from the pixelarticons collection (~4000 SVG icons). Use this skill whenever the user asks for an icon, wants to find an icon by name or keyword, needs SVG source code for a pixel art icon, or mentions pixelarticons. Also trigger when the user says /pixelarticons."
---

# Pixelarticons

A collection of ~4000 pixel art SVG icons in a 24x24 grid. All icons live in:

```
/Users/manu/Documents/Projects/not-manu/pixelarticons/svg/
```

Each icon is a single SVG file like `heart.svg`, `home.svg`, `arrow-up.svg`.

## How to find icons

Search by keyword using grep on filenames:

```bash
rg --files /Users/manu/Documents/Projects/not-manu/pixelarticons/svg/ | rg -i <keyword>
```

Many icons have variants suffixed with `-solid`, `-sharp`, `-glyph`. For example:
- `heart.svg` (outline)
- `heart-solid.svg` (filled)
- `heart-sharp.svg` (sharp corners)

## How to get the SVG source

Read the file directly:

```
/Users/manu/Documents/Projects/not-manu/pixelarticons/svg/<icon-name>.svg
```

The SVGs use `fill="currentColor"` so they inherit the parent's text color. They are all `viewBox="0 0 24 24"` and use only `<path>` elements — no strokes, no embedded images.

## Unicode text previews

Pre-rendered Unicode text versions of each icon are available at:

```
/Users/manu/Documents/Projects/not-manu/pixelarticons/txt/<icon-name>.txt
```

These render the icon using Unicode half-block characters (▀▄█) and can be shown directly in a response to give the user a quick visual preview.
