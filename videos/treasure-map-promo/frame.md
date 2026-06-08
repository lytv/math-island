# Treasure Map Promo — Design Spec

Promo video for "Bản Đồ Kho Báu" — the Grade 2 pirate-themed math journey map
(Math Island universe). Audience: Vietnamese parents + kids 7–8. Mood: warm,
adventurous, magical — deep night ocean lit by treasure gold.

## Colors

| Token       | Hex       | Use                              |
| ----------- | --------- | -------------------------------- |
| gold-1      | `#fff3c4` | coin highlight, headline glow    |
| gold-2      | `#ffd76a` | primary accent, titles           |
| gold-3      | `#e8a62e` | coin body, gradients             |
| gold-4      | `#b97d18` | coin shadow edge                 |
| gold-ink    | `#6b3f00` | text on gold surfaces            |
| sea-1       | `#0d4a63` | background top                   |
| sea-2       | `#072c42` | background mid                   |
| sea-3       | `#041c2e` | background deep                  |
| parchment   | `#ffe9b0` | body text on dark                |
| sky-soft    | `#9fd6ea` | secondary text on dark           |

## Typography

- Display: **Bungee** (local woff2, vietnamese subset) — uppercase titles only
- Body: **Baloo 2** 600/800 (local woff2, vietnamese subset)
- Headlines 90–150px, subtitles 40–54px, labels 32px+

## Do

- Radial glows, localized gold light on deep sea backgrounds
- Coins, sparkles, soft fog, slow Ken Burns drift on the map artwork
- Map artwork (`map.jpg`) is the hero — show it generously

## Don't

- No full-screen linear gradients (banding)
- No emoji glyphs in rendered text (headless font risk)
- No purple, no neon, no white backgrounds
