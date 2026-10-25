# Verification — Edition 03

Validated on 25 October 2026 in Windows and the Codex in-app Chromium browser. Geometry remains illustrative.

## Passed automated checks

Strict TypeScript and the production Vite build pass. Fourteen Node tests pass: complete corridor reachability, boundaries and invalid coordinates, closed/open modal gating, frame-independent movement at 10/60 fps, normalized diagonal collision movement, continuous crowd routes, sixteen collectors, twenty-six unique shop branches, baked natural animation clips, compressed licensed assets, actual canopy geometry separation, and world-coordinate preservation for quantized scans during batching.

The generated panel/rib/perimeter geometry has a minimum horizontal envelope gap of **1.461 m**, exceeding the shared **0.5 m** requirement. Roof horizontal scale is **65%** of Edition 02; columns/headroom are retained.

## Actual browser regression

Ten checks pass using real keyboard and pointer input, with before/after camera positions read from the canvas's public diagnostic attributes. The runner is tests/browser-regression.mjs. The delivered poorna-market-walking-regression.json contains results and coordinates.

1. Keyboard movement with the water dialog initially closed.
2. Open modal blocks movement.
3. Closing the modal restores exploration.
4. Destination changes retain keyboard control.
5. Keyboard activation of a direction button produces a single step.
6. Holding a direction button moves continuously.
7. Releasing the button leaves no stuck input.
8. Manual input cancels a guided route.
9. Fullscreen keyboard movement works.
10. Exiting fullscreen restores walking, including automatic WebGL context recovery.

Blur, tab hiding, pointer cancellation and modal state clear held input in the implementation. Fullscreen exit initially exposed a lost graphics context in this browser; restoration now rebuilds environment lighting and refocuses the scene. The final regression passed after the last functional changes.

## Visual review and evidence

The review folder contains matching Edition 02 / Edition 03 daylight screenshots at all five stops, plus five evening views. The accompanying comparison.html presents the images. Capture positions are destination-defined; animated people naturally differ between captures. Viewed both gateways, smaller separated collector silhouettes, accessible circulation, daylight/evening shading, relaxed down arms and scanned foreground goods. Review caught and corrected the MakeHuman arm axis and integer-coordinate clamping during scanned-mesh batching. The latter now has a regression test.

The WebM records the actual canvas, including the rebaked walking poses, gateway turns and movement near the viewer. Walking and idle blend over 250 ms; speed follows world velocity and body scale. Grounded reduced-motion idle and standing actors remain available. This review supports visible improvement; it does not certify absence of foot sliding or intersections under every possible interaction. Three free character bases and some bespoke market geometry remain visibly reused. The result is real-time CGI, not achieved photographic realism.

## Performance

Final single-point samples: high detail 38 fps, 575 draws, 2,764,692 triangles, 1380 × 625 buffer; reduced detail 39 fps, 626 draws, 3,714,205 triangles, 1104 × 500 buffer. Samples occurred at different animation/culling instants and are not a controlled benchmark. Earlier entrance/produce observations after scan simplification were approximately 28–32 fps. Device GPU/CPU identification was unavailable. Reduced detail also shortens character visibility and lowers shadows. Public runtime art totals about 17.9 MB. Vite reports its advisory for the 574 kB Three.js vendor chunk (146 kB compressed).

## Scope of remaining verification

The retained interface contrast tokens are green/paper 11.78:1, muted/paper 5.93:1, terracotta/cream 5.38:1 and green/cream 10.62:1. Focus styles, responsive layout and reduced-motion paths remain implemented. This revision was tested in a desktop browser; physical touch-device, OS reduced-motion, deliberate network-failure, tab-hiding/blur, and comprehensive accessibility audits were not independently repeated. Touch buttons share the tested held/single-step input path. No unrelated AR/VR framework migration or image backend was added.

Water infrastructure remains a non-potable conceptual network, separate from drinking/food preparation; engineering sizing and overflow routing remain subject to site design. The private audience and existing URL are preserved.

## GitHub Pages compatibility update

The GitHub copy was made public with the user's explicit approval to enable free Pages hosting. The original private Site is unchanged. Fifteen local tests now pass, including shared asset URL resolution for both /poorna-market/ and root-domain hosting; TypeScript and the production build pass. The workflow uses pinned official GitHub Actions and publishes the tested dist artifact from main. GitHub-hosted build, deployment and live browser verification are checked separately during publication.
