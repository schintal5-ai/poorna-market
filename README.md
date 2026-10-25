# Poorna Market — A street for people / Edition 03

A detailed, vehicle-free architectural concept for the Poorna Market corridor in Visakhapatnam, with separated rain-catching shade collectors. Geometry remains location-inspired and approximate; this is not a surveyed reconstruction or an approved development.

## Run and test

Requires Node.js 22+ (Node 24 recommended for the TypeScript tests) and pnpm 11.25.0. Run `pnpm install`, `pnpm dev`, or `pnpm build`. `pnpm preview` serves the production output. Run `node --test tests/*.test.mjs` for asset, navigation, and infrastructure checks.

## Explore

Choose **Enter the street**. Drag to look in 360 degrees; use WASD to walk and arrow keys to move/turn. Touch screens have a directional pad. Five destinations and minimap markers jump along the corridor. Guided walk includes pause, resume and end controls. Architectural markers have equivalent HTML controls below the viewer.

Choose **Rainwater** or **Rain to renewal** to see the collection/storage/distribution diagram and expand the complete 26-shop connection schedule. Daylight/evening, reset, overview, fullscreen and rendering-detail controls are included. High detail is the default for fine-pointer desktops; coarse-pointer devices start with fewer people and a lower rendering resolution. Reduced detail lowers shadow resolution and distant crowd visibility.

## Scene systems

- `materials.ts`: locally hosted scanned PBR textures and HDR environment lighting, with load-failure tracking.
- `geometry.ts`, `architecture.ts`, `props.ts`: unique storefront identities, visible interiors, merchandise, foliage and static geometry batching by material and street segment.
- `crowds.ts`: three rigged character assets, clothing/scale variation, idle/walk clips, standing vendor/conversation groups, crowd spacing, viewer avoidance, contact shadows and distance culling. Desktop includes 24 actors; mobile includes 8.
- `infrastructure.ts`, `water.ts`: typed canopy positions, separate collection/supply network references, all 26 shop branches and an accessible explanatory diagram. Underground infrastructure is represented in the diagram only.
- `scene.ts`, `navigation.ts`: camera, lighting, quality controls, measured rendering diagnostics and bounded walking.
- `data.ts`, `main.ts`, `style.css`: destination content and responsive accessible interface.

Shared character assets are preloaded once so animation does not stall on entering a new segment. Character visibility and merged static geometry are spatially culled. GLBs use Meshopt; embedded and external textures use WebP. Runtime art totals approximately 17.9 MB. Loading progress and retry controls are shown when resources fail. Hidden tabs suspend rendering work.

## Limits and credits

See `ASSET_CREDITS.md` and `public/assets/licenses.json` for free-asset provenance. The result is detailed real-time CGI, not a photograph or a guarantee of photorealism. Three base human assets are reused with variations; they are not bespoke local scans. Architecture and some goods are custom modelled; selected foreground objects use scanned CC0 assets.

The water system is a conceptual non-potable network for suitable cleaning, flushing and irrigation. It does not supply the separate drinking-water point or food-preparation uses. Catchment yield, treatment, storage, pipe/pump sizing, structure, backflow protection and overflow routing require site engineering.

This static application needs no backend, map key or paid runtime API. Optional Google Fonts fall back to Georgia and Arial. Runtime art is local.


## Edition 03 corrections

Walking uses explicit modal/exploration state, focus-scoped input, a separate bounded motion simulation and collision resolution. Desktop and touch directional buttons support held motion and single steps. Blur, tab hiding, pointer cancellation and modal opening clear input. Graphics-context recovery restores navigation after fullscreen transitions.

Sixteen collector roofs retain their columns and headroom while horizontal dimensions are 65% of Edition 02. Shared canopy geometry/specification and geometry-envelope tests enforce 0.5 m separation; the current minimum is 1.461 m. All 26 non-potable shop branches remain in the accessible diagram.

Three characters include baked 30 fps Walk_Natural and Idle_Natural clips with relaxed down arms and sole grounding, speed-linked playback, 250 ms animation blends, acceleration and avoidance hysteresis. Reproduction scripts are in tools/gait. Scanned CC0 produce, brassware, crates and wicker baskets supplement rounded bespoke details; textures are locally hosted and meshes simplified before Meshopt compression.

A-Frame camera/control separation informed the input architecture without replacing Three.js. Roomify was a presentation reference; its generated images cannot supply continuous navigable geometry. No A-Frame or Roomify runtime dependency or image backend was introduced.

Use ?review=1 for an optional canvas-only 12-second WebM recording control. tests/browser-regression.mjs exports the actual browser regression runner for the documented CUA tab interface.

