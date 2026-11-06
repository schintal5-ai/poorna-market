# Poorna Market — A street for people / Edition 04

A detailed, vehicle-free architectural concept for the Poorna Market corridor in Visakhapatnam. Geometry is location-inspired and approximate; this is not a surveyed reconstruction or an approved development.

## What's new in Edition 04

- **Shopping complex (west side, on your left as you enter).** Built from the owner's elevation: G+2 with three 4 m floors, round-bottomed windows with pink lattice transoms, floor bands and a parapet. The 17-bay elevation is repeated twice along the whole 104 m frontage. Each wing has two great arched entrances with pink spandrels, leading to lit passages with stairs. The 26 ground-floor bays are glazed shopfronts with name boards and goods, and two rooftop tanks feed the upper floors. The east side is unchanged.
- **Centre row.** The side canopies and side trees are gone. Down the middle of the street the row alternates **harvester, tree, harvester, tree** every 6 m: 7 rain harvesters and 7 trees. Every tree is ringed by a circular stone seat wall with a timber seat. People walk the two promenade lanes either side of the row.
- **Water network in 3D.** **Water network** makes the paving see-through and shows the system underneath:
  - the downpipes and the collection main;
  - first-flush and filtration, the underground tank, and the pump;
  - the separate non-potable mains, with a branch to each of the 26 complex units and 13 street shops;
  - risers to the complex's rooftop tanks and the overflow.
- **Quest VR.** **VR mode**, at the top right next to the day/evening switch, starts an immersive WebXR session on a Meta Quest (Quest Browser).
  - Controllers and hand tracking both work. The left stick walks and the right stick snap-turns 30°.
  - Grip or pinch picks up goods. Let go near the basket and they drop in; anywhere else they float back to the stall.
  - The trigger points at goods from a distance to add them, or at a basket item to put it back.
  - X/A toggles the water network and Y/B toggles day and evening.
- **Pick and place.** Take a basket from the stand by the gate. Each hawker stall has 6 goods you can pick up, 108 in all: produce, flowers, craft and food. On desktop and touch, click or tap goods to add them; click them in the basket, or use **Put back** in the basket panel, to return them exactly where they were.
- **No people.** The walking characters, their models and their code have been removed.

## Run and test

Requires Node.js 24 and pnpm 11.25.0. Run `pnpm install`, `pnpm dev`, or `pnpm build`. `pnpm preview` serves the production output. Run `node --test tests/*.test.mjs` for the layout, navigation, water-network, asset and shopping checks.

**On a Quest:** open the published Pages URL in the Quest Browser and choose **VR mode**. WebXR needs HTTPS, which GitHub Pages provides. For local testing, connect the headset over USB, run `adb reverse tcp:5173 tcp:5173`, then open `http://localhost:5173`.

## Explore

Choose **Enter the street**. Drag to look; use WASD to walk and the arrow keys to move or turn. Touch screens have a directional pad. Five destinations and the minimap jump along the corridor. Guided walk can be paused, resumed and ended. Architectural markers have equivalent HTML controls below the viewer. **Rainwater** or **Rain to renewal** opens the diagram and the full schedule of 39 supply branches.

## Scene systems

- `complex.ts`: the shopping complex from the elevation (facade extrusions with window and arch openings, frames, lattice transoms, shop interiors, archways).
- `infrastructure.ts`: shared layout data (complex dimensions, centre row, seat walls, supply branches, underground positions, basket stand).
- `architecture.ts`, `props.ts`, `geometry.ts`: the east-side shops, hawker stalls, seat walls, gates and street furniture, with static batching by material and segment.
- `water.ts`, `canopy-model.ts`: harvester columns and petals, the 3D underground network, and the accessible diagram.
- `shopping.ts`: pickable goods (instanced per kind), the basket, and the grab/release and put-back logic.
- `xr.ts`: the WebXR session, controllers, hands, locomotion, snap turn, haptics and in-headset panels. Nothing is downloaded at runtime.
- `scene.ts`, `navigation.ts`, `movement.ts`, `input.ts`: camera, lighting, quality, picking and bounded walking.
- `data.ts`, `main.ts`, `style.css`: destination content and the responsive, accessible interface.

Runtime art totals about 8.8 MB (17.9 MB in Edition 03, before the people were removed).

## Limits and credits

See `ASSET_CREDITS.md` and `public/assets/licenses.json`. The result is real-time CGI, not a photograph.

The water system is a conceptual non-potable network for suitable cleaning, flushing and irrigation. It does not supply the separate drinking-water point or food-preparation uses. Catchment yield, treatment, storage, pipe and pump sizing, structure, backflow protection and overflow routing require site engineering.

This static application needs no backend, map key or paid runtime API. Optional Google Fonts fall back to Georgia and Arial.

## GitHub Pages deployment

The repository is public at https://github.com/schintal5-ai/poorna-market, and the site is at https://schintal5-ai.github.io/poorna-market/. `.github/workflows/deploy.yml` installs pinned pnpm and Node 24, runs the regression suite, builds `dist`, and publishes it on every push to `main`. A failing test stops the deploy.
