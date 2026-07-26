# Olliecator character artwork

This folder contains one character image for each Olliecator result.

Replace the placeholder SVG files with the final character logos while keeping
the filenames unchanged:

- `YGC.svg` — The Load-Bearing Yapper
- `YGF.svg` — The Productive Side-Quester
- `YDC.svg` — The Colour-Coded Crisis
- `YDF.svg` — The Chaos Coordinator
- `LGC.svg` — The Silent Mastermind
- `LGF.svg` — The Suspiciously Functional Otter
- `LDC.svg` — The Internal System Error
- `LDF.svg` — The Deadline Cryptid

Recommended artwork specifications:

- SVG is preferred for sharp website and share-card rendering.
- Use a square `1:1` artboard, ideally `1024 × 1024`.
- Keep important artwork inside an 8% safe margin.
- Use a transparent background.
- Convert embedded text to outlines.
- Avoid external fonts, linked images, or scripts inside the SVG.

If the final files are PNG or WebP instead, update the character image path in
`app.js` in both places that currently use:

`./assets/characters/${state.resultCode}.svg`
