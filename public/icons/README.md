# App Icons

The PWA manifest at `app/manifest.ts` references these icons. Generate them from a single
1024×1024 source SVG (or PNG) using any of:

- [realfavicongenerator.net](https://realfavicongenerator.net) — one-shot upload
- [pwa-asset-generator](https://github.com/elegantapp/pwa-asset-generator) — CLI
- Figma export

Required files in this directory:

| File                        | Size     | Purpose                              |
| --------------------------- | -------- | ------------------------------------ |
| `icon-192.png`              | 192×192  | Standard PWA icon                    |
| `icon-512.png`              | 512×512  | Standard PWA icon (installable)      |
| `icon-maskable-192.png`     | 192×192  | Maskable (adaptive) Android icon     |
| `icon-maskable-512.png`     | 512×512  | Maskable (adaptive) Android icon     |
| `apple-touch-icon.png`      | 180×180  | iOS home-screen icon                 |

Maskable icons need the main logo mark centered inside the **safe zone** (the middle 80%
of the canvas) because Android may crop them into circles, squircles, or rounded squares.

Also place a `favicon.ico` at the repo root of `public/` when the brand mark is finalized.
