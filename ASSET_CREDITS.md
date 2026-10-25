# Asset credits and design references

All downloaded runtime art is stored locally in `public/assets/`. No paid assets or accounts are required. File-level provenance and processing notes are in `public/assets/licenses.json`.

## People — CC0 1.0

Innerscene's **Sam**, **Maya**, and **Harper** locomotion collections, adapted from MakeHuman/MPFB CC0 body, rig and skin assets. Each includes named idle and walking clips. Original download sizes were approximately 20 MB per character; the shipped versions total approximately 8.2 MB, using Meshopt geometry compression and 1024px WebP textures. Clothing colours, scale, placement, animation timing and routes vary within the scene.

- [Sam](https://www.innerscene.com/tools/library/3d-parts/locomotion-collection-sam-3d-person-animated-dc23800f)
- [Maya](https://www.innerscene.com/tools/library/3d-parts/locomotion-collection-maya-3d-person-animated-1499b2fd)
- [Harper](https://www.innerscene.com/tools/library/3d-parts/locomotion-collection-harper-3d-person-animated-797e1e2a)
- [CC0 dedication](https://creativecommons.org/publicdomain/zero/1.0/)

These are a limited set of freely available casual/business characters. They are not bespoke scans of local traders or a complete representation of local clothing and demographics. Additional variation does not turn them into unique scanned people.

## Surfaces and sky — Poly Haven, CC0

- [Red sandstone pavement](https://polyhaven.com/a/red_sandstone_pavement)
- [Plastered wall 04](https://polyhaven.com/a/plastered_wall_04)
- [Wood table 001](https://polyhaven.com/a/wood_table_001)
- [Fabric pattern 07](https://polyhaven.com/a/fabric_pattern_07)
- [Kloppenheim 06 pure sky](https://polyhaven.com/a/kloppenheim_06_puresky)
- [Poly Haven asset licence](https://polyhaven.com/license)

Surface albedo, normal and roughness maps are resized to 1024px WebP. The HDR sky is 2K. Geometry, merchandise, foliage texture, signage and canopy meshes are authored in this project. Assets are reused and static meshes are batched by material and corridor segment; characters are culled by distance.

## Design reference and water-system context

The independently modelled flower-shaped rainwater canopies are inspired by the reference supplied by the user, credited in that image to **Yahya KIZILASLAN**. The image itself is not included as a runtime asset.

The diagram is a conceptual architectural explanation, not a hydraulic or structural specification. [CDC rainwater guidance](https://www.cdc.gov/drinking-water/about/collecting-rainwater-and-your-health-an-overview.html) supports keeping harvested water separate from drinking water and including screening and first-flush diversion. Applicable local engineering and approvals still determine the actual system.

## Software

Three.js, TypeScript and Vite retain their respective upstream licences. Three.js supplies GLTFLoader, RGBELoader, SkeletonUtils, geometry batching utilities, and its packaged Meshopt decoder. DM Sans and Playfair Display are optional Google Fonts, with system-font fallbacks.

## Edition 03 scanned market objects — Poly Haven, CC0

The locally bundled GLBs are free CC0 scans: [Apple](https://polyhaven.com/a/food_apple_01), [Bananas](https://polyhaven.com/a/bananas), [Lemon](https://polyhaven.com/a/lemon), [Brass pot](https://polyhaven.com/a/brass_pot_01), [Wicker basket](https://polyhaven.com/a/wicker_basket_01), and [Wooden crate](https://polyhaven.com/a/wooden_crate_01). Textures were converted to WebP, geometry simplified with an error bound, and GLBs Meshopt-compressed. This supplements the bespoke shop architecture and other goods. Complete machine-readable provenance remains in public/assets/licenses.json.

Edition 03 adds project-authored animation corrections to the three CC0 human bases; original clips are retained and the added natural walk/idle clips are baked into the distributed GLBs. The source reproducer is included under tools/gait. Human bases and scanned goods remain visibly reused assets, not unique local photogrammetry.
