# Verification — Edition 04

Checked on 6 November 2026 on Windows, in the Claude desktop app's built-in Chromium browser, against the Vite dev server. Geometry is illustrative.

## Automated checks

Strict TypeScript and the production Vite build pass. All **19 Node tests pass**:

| Area | Checks |
|---|---|
| Navigation | Both promenade lanes reachable along the whole street; all five stops walkable; stall bays and gateways blocked; invalid coordinates fail closed. |
| Centre row | Harvester and tree alternate every 6 m at the street centre; no side harvesters remain; harvesters serve the whole corridor; columns and seat walls are solid. |
| Petals | Real canopy geometry keeps at least 0.5 m between petals and leaves 1.4 m for the tree crowns. |
| Complex | G+2, 4 m floors, 17 bays per wing (3.06 m), two arches per wing, west side. |
| Water | 39 unique non-potable branches (26 complex units and 13 street shops); 6 treatment stages. |
| Shopping | 6 goods per stall within reach of the lane; a basket is needed first; goods fly in and are put back exactly; in VR, a release near the basket drops in and anywhere else returns home; no stall blocks an arch. |
| Assets | Every licensed asset is present; no people models, skeletons or crowd code ship. |
| Movement | Modal gating; frame-rate-independent walking; bounded diagonal collision; quantized-scan batching. |

## Browser checks

- **Load:** the scene loads with no console errors, and loading and asset warnings clear.
- **Complex:**
  - The facade matches the elevation: pink lattice transom, solid band, and U-shaped glazing with frames.
  - The pink arch spandrels are visible.
  - Two left-side stalls that stood in front of the arches were removed after review.
- **Centre row:** seen in daylight and evening, with the seat walls, uplights and harvester lamp rings showing.
- **Basket:**
  - A real mouse click on a jasmine string added it to the basket; the panel and the toast updated.
  - **Put back** returned it; afterwards no item was away from its stall.
  - On a phone (375 × 812) the basket stays in view bottom-right with the goods inside, and the page has no horizontal scroll.
- **Water network:** the paving turns see-through. The collection main, filter, tank, pump, both supply mains and the branches show, with flow animation and labels.
- **VR mode without a headset:** the button explains how to open the site on a Quest.

## Performance

Total scene geometry fell from about **2.95M to 1.49M triangles** during review:
- simple goods instead of scans inside the complex shops and on the east-shop shelves;
- procedural bananas and stall-top baskets;
- lighter spheres.

The built-in pane rendered about 82 fps with 120–460 draw calls depending on the view (pane-sized buffer; not a controlled benchmark). In the evening view the street lamps are 4 point lights rather than 8, so switching to evening stalls less while shaders recompile. In VR, foveation level 1 is requested.

## Not yet verified

- **Real Meta Quest:** VR mode was not run on a headset or in an XR emulator. On the device, check:
  - entering VR;
  - thumbstick walking (1.8 m/s) and 30° snap turn;
  - grip and pinch grabbing, and the basket on the hand;
  - trigger pointing;
  - frame rate.
- **Other browsers and assistive technology:** Safari, Firefox, physical touch devices and screen readers were not tested.
- **Engineering:** the water system remains a non-potable concept; sizing and overflow routing need site design.
