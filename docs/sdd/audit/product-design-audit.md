# Product Design Audit

Date: 2026-04-24

## Reference Direction

The reference images point to a playful hand-drawn ocean tomato planner:

- Bright turquoise background with underwater scenery.
- Bold Chinese serif headings with marker-like underline accents.
- Large central timer as the main focus action.
- Bottom navigation uses illustrated icons instead of generic line icons.
- Planning combines weekly date navigation and Eisenhower-style quadrants.
- Statistics use friendly cards and a donut chart.
- Calendar/month view is dense and visual, closer to a planner than a plain list.

## Current Implementation Fit

The current app already has the right product skeleton:

- Five-tab structure: plan, view, focus, stats, mine.
- Tomato timer page with mode switching.
- Four-quadrant task planning.
- Focus records and statistics.
- Local persistence through `localStorage`.
- Mobile-width app frame suitable for Android WebView packaging.

## Main Gaps

- Visual language is currently more muted nature/garden than bright deep-sea. Pick one direction; for this product, deep-sea should win because it matches the name and references.
- Bottom navigation uses generic lucide icons. The reference relies heavily on recognizable illustrated sea icons; this is important for brand feel.
- The focus timer should support the reference's quick duration picker or preset wheel, not only a single fixed 25-minute display.
- Calendar data is static demo content. It should eventually map tasks/focus records into real month/week/day views.
- Stats chart currently uses fixed category percentages. It should calculate distribution from real records and task categories.
- Timer accuracy is interval-based in the foreground only. Android background reminders and completion notifications will require native notification/alarm work later.
- Data access is currently direct `localStorage` inside `App.tsx`. Before adding more features, create a small frontend API/storage layer to satisfy the unified API rule and keep data migration manageable.

## Recommended Next Product Iteration

1. Establish a Sea Focus design token set: ocean turquoise, deep teal, coral accent, shell yellow, ink black, card white.
2. Replace generic icons with custom sea-themed assets or a small local SVG asset set.
3. Refactor persistence behind a frontend API module before adding more task/focus fields.
4. Make focus presets configurable: 25/5, 50/10, custom countdown, stopwatch.
5. Add real category selection when starting focus so stats are based on actual user intent.
6. Add Android notification support after the basic APK pipeline is confirmed in GitHub.
