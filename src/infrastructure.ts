/** Street layout shared by the scene, navigation and the regression tests. */

/** The shopping complex on the west (left on arrival) frontage, drawn from Elevation AA'. */
export const complex = {
  side: -1,
  /** Street face of the facade, in metres from the street centre line. */
  faceX: 8.65,
  /** Total length along the street (unchanged: the facade is fitted to this frontage). */
  zStart: 50,
  zEnd: -54,
  /** Elevation AA': 23 bays; the first 6 are full-height windows, then 8 arched modules of two windows each, then one closing window. */
  bays: 23,
  tallBays: 6,
  floors: 3,
  floorHeight: 4,
  parapet: 0.95,
  depth: 12,
  /** Arched modules (0-based, from the entrance end) that are walk-through entrances; the rest are glazed shop halls. */
  entranceArches: [2, 3, 7] as readonly number[],
};
export const complexLength = complex.zStart - complex.zEnd;
export const bayWidth = complexLength / complex.bays;
export const complexHeight = complex.floors * complex.floorHeight + complex.parapet;
/** Number of arched ground-floor modules in the elevation. */
export const archCount = (complex.bays - complex.tallBays - 1) / 2;
/** Along-facade centre of bay b and of arch k (an arch sits on the boundary between its two windows). */
export const bayX = (b: number) => (b + 0.5) * bayWidth;
export const archX = (k: number) => (complex.tallBays + 1 + 2 * k) * bayWidth;
export const isEntrance = (k: number) => complex.entranceArches.includes(k);

/** Centre-of-street row: harvester, tree, harvester, tree … every 6 m. */
export const rowSpacing = 6;
export interface RowItem {id: string; kind: 'harvester' | 'tree'; x: number; z: number}
export const centreRow: RowItem[] = Array.from({length: 14}, (_, i) => ({
  id: i % 2 ? `T${(i + 1) / 2}` : `H${i / 2 + 1}`,
  kind: i % 2 ? 'tree' : 'harvester',
  x: 0,
  z: 38 - i * rowSpacing,
}));
export interface Canopy {id: string; x: number; z: number; side: number}
/** Rain-catching petals: every harvester in the centre row (side 0 = symmetric petal). */
export const canopies: Canopy[] = centreRow.filter((r) => r.kind === 'harvester').map((r) => ({id: r.id, x: r.x, z: r.z, side: 0}));
export const trees = centreRow.filter((r) => r.kind === 'tree');

/** Circular seat wall around each centre tree. */
export const seatWall = {outer: 0.88, inner: 0.56, height: 0.46};
/** Keep-out radii used by walking collision. */
export const obstacleRadius = {harvester: 0.5, tree: seatWall.outer + 0.18};

export interface ShopConnection {id: string; name: string; side: number; z: number; building: 'complex' | 'street'; collection: 'collection-main'; supply: 'non-potable-main'}
/** The underground supply is unchanged from the previous edition: 26 ground-floor units at their original positions. */
const legacyBay = complexLength / 34;
const complexUnits = Array.from({length: 34}, (_, b) => b).filter((b) => ![6, 7, 10, 11].includes(b % 17)).map((b) => complex.zStart - (b + 0.5) * legacyBay);
/** 26 ground-floor units in the complex (west) and 13 street shops (east), each on its own branch. */
export const shopConnections: ShopConnection[] = [
  ...complexUnits.map((z, i) => ({id: `G${String(i + 1).padStart(2, '0')}`, name: `Complex unit ${i + 1}`, side: -1, z, building: 'complex' as const, collection: 'collection-main' as const, supply: 'non-potable-main' as const})),
  ...Array.from({length: 13}, (_, i) => ({id: `S${String(i + 1).padStart(2, '0')}`, name: `Shop ${i + 1}`, side: 1, z: 46 - i * 8, building: 'street' as const, collection: 'collection-main' as const, supply: 'non-potable-main' as const})),
];
export const waterStages = ['Rain-catching petals', 'Debris screen + first-flush diversion', 'Filtration', 'Underground storage', 'Pump + separate supply main', 'Complex and shops: cleaning, flushing, irrigation'];

/** Underground system positions (metres; y is below street level). */
export const underground = {
  collectionY: -1.1,
  supplyY: -0.75,
  supplyX: 6.9,
  filter: {x: 0, z: -42},
  tank: {x: 0, z: -48.5, w: 7, h: 2.6, d: 5, y: -2.7},
  pump: {x: 4.6, z: -46},
  /** Rooftop break tanks on the complex that feed its upper floors. */
  rooftopTankZ: [24, -28],
};

/** Basket stand at the entrance. */
export const basketStand = {x: -4.25, z: 41.6, w: 1.3, d: 0.8};

/** Street-side centre of each walk-through entrance; hawker stalls keep clear of them. */
export const archZ = complex.entranceArches.map((k) => complex.zStart - archX(k));
/** Where the previous facade's entrances were: the hawker stalls were laid out around these, and stay exactly as they were. */
export const legacyArchZ = [28.59, 16.35, -23.41, -35.65];
