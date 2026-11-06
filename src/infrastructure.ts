/** Street layout shared by the scene, navigation and the regression tests. */

/** The shopping complex from the owner's elevation, on the west (left on arrival) frontage. */
export const complex = {
  side: -1,
  /** Street face of the facade, in metres from the street centre line. */
  faceX: 8.65,
  /** Total length along the street: two repeats of the 17-bay elevation. */
  zStart: 50,
  zEnd: -54,
  modules: 2,
  baysPerModule: 17,
  floors: 3,
  floorHeight: 4,
  parapet: 0.95,
  depth: 12,
  /** Bays (0-based, per module) where one large arched entrance spans this bay and the next. */
  archBays: [6, 10],
} as const;
export const complexLength = complex.zStart - complex.zEnd;
export const bayWidth = complexLength / (complex.modules * complex.baysPerModule);
export const complexHeight = complex.floors * complex.floorHeight + complex.parapet;
/** Centre z of bay b (0-based, counted along the whole frontage from the entrance end). */
export const bayZ = (b: number) => complex.zStart - (b + 0.5) * bayWidth;
export const isArchBay = (b: number) => {
  const local = b % complex.baysPerModule;
  return complex.archBays.some((a) => local === a || local === a + 1);
};

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
const complexUnits = Array.from({length: complex.modules * complex.baysPerModule}, (_, b) => b).filter((b) => !isArchBay(b)).map(bayZ);
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

/** Street-side centre of each arched entrance; hawker stalls keep clear of them. */
export const archZ = Array.from({length: complex.modules}, (_, m) => complex.archBays.map((a) => complex.zStart - (m * complex.baysPerModule + a + 1) * bayWidth)).flat();
