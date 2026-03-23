---
name: flexoki
description: "Look up and apply colors from the Flexoki color palette — an inky color scheme for prose and code. Use this skill whenever the user mentions Flexoki, asks for Flexoki colors, wants to theme something with Flexoki, or needs specific hex values from the Flexoki palette. Also trigger when the user says /flexoki."
---

# Flexoki Color Palette

Flexoki is an inky color scheme for prose and code, inspired by analog printing inks and warm shades of paper. It provides dark and light theme variants built for readability.

## How to use this skill

Read `references/palette.md` (relative to this skill's directory) to find the exact hex values you need. The palette has:

- **15 base/neutral colors** ranging from `black` (#100F0F) to `paper` (#FFFCF0)
- **8 accent color families**: red, orange, yellow, green, cyan, blue, purple, magenta
- Each accent family has **13 shades** (50 through 950) for fine-grained control

## Quick reference: Theme roles

When applying Flexoki to a light or dark theme, use these semantic mappings:

### Light theme
| Role | Color | Hex |
|------|-------|-----|
| Background | paper | #FFFCF0 |
| Background secondary | base-50 | #F2F0E5 |
| UI element | base-100 | #E6E4D9 |
| UI element secondary | base-150 | #DAD8CE |
| UI element tertiary | base-200 | #CECDC3 |
| Text tertiary | base-300 | #B7B5AC |
| Text secondary | base-600 | #6F6E69 |
| Text primary | black | #100F0F |

### Dark theme
| Role | Color | Hex |
|------|-------|-----|
| Background | black | #100F0F |
| Background secondary | base-950 | #1C1B1A |
| UI element | base-900 | #282726 |
| UI element secondary | base-850 | #343331 |
| UI element tertiary | base-800 | #403E3C |
| Text tertiary | base-700 | #575653 |
| Text secondary | base-500 | #878580 |
| Text primary | base-200 | #CECDC3 |

### Accent colors by theme

In the **light theme**, use the 600-level accents as primary and 400-level as secondary.
In the **dark theme**, use the 400-level accents as primary and 600-level as secondary.

| Color | Light primary (600) | Light secondary (400) | Dark primary (400) | Dark secondary (600) |
|-------|--------------------|-----------------------|-------------------|---------------------|
| Red | #AF3029 | #D14D41 | #D14D41 | #AF3029 |
| Orange | #BC5215 | #DA702C | #DA702C | #BC5215 |
| Yellow | #AD8301 | #D0A215 | #D0A215 | #AD8301 |
| Green | #66800B | #879A39 | #879A39 | #66800B |
| Cyan | #24837B | #3AA99F | #3AA99F | #24837B |
| Blue | #205EA6 | #4385BE | #4385BE | #205EA6 |
| Purple | #5E409D | #8B7EC8 | #8B7EC8 | #5E409D |
| Magenta | #A02F6F | #CE5D97 | #CE5D97 | #A02F6F |

## When you need the extended palette

For UI work requiring more granularity (hover states, borders, subtle backgrounds), read the full `references/palette.md` file. Each accent family has 13 shades from very light (50) to very dark (950), following the same pattern as Tailwind's color scale.
