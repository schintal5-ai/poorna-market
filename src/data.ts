import {archZ} from './infrastructure.ts';
export interface Stop {name: string; subtitle: string; x: number; z: number; title: string; description: string}
/** Viewpoints stand in the east promenade lane (x 2.8) so the complex reads across the centre row. */
export const stops: Stop[] = [
  {name: 'The threshold', subtitle: 'Entrance', x: 2.4, z: 43, title: 'A slower kind of arrival.', description: 'A welcoming pedestrian gateway gives the street back to people. Pick up a basket at the stand by the gate, then wander the two shaded promenades.'},
  {name: 'Everyday abundance', subtitle: 'Produce market', x: 2.8, z: 22, title: 'Local trade. A better home.', description: 'Fresh produce and flower sellers occupy shaded modular bays, with integrated storage, washable counters and discreet digital-payment signage.'},
  {name: 'Made by hand', subtitle: 'Craft lane', x: 2.8, z: 0, title: 'Tradition, still in the making.', description: 'Timber-framed stalls bring crafts and textiles into the street, opposite the arched entrances of the new shopping complex.'},
  {name: 'A taste of Vizag', subtitle: 'Food court', x: 2.8, z: -22, title: 'Stay for another cup.', description: 'A shaded gathering place for tea, tiffin and conversation, with seat walls under the trees of the centre row.'},
  {name: 'Room to gather', subtitle: 'Community square', x: 0, z: -43.5, title: 'The street becomes a place.', description: 'Generous seating and a shared drinking-water point create a small civic living room above the underground rainwater tank. Warm lighting keeps the market welcoming into the evening.'},
];
export interface Feature {title: string; tag: string; description: string; x: number; y: number; z: number}
export const features: Feature[] = [
  {title: 'A new home for hawkers', tag: '01 / LIVELIHOODS', description: 'A coordinated kit of timber frames, durable counters, concealed cupboards and payment signage supports existing trading traditions. Each bay retains its own colour and identity.', x: 4.9, y: 1.6, z: 20},
  {title: 'Shade and seats down the middle', tag: '02 / COMFORT', description: 'The centre of the street alternates one rain-catching harvester and one tree, every six metres. Each tree is ringed by a circular seat wall, so there is always a shaded place to sit.', x: 0, y: 1.3, z: 8},
  {title: 'Two continuous promenades', tag: '03 / ACCESSIBILITY', description: 'Level, step-free lanes run either side of the centre row, linking every destination. Flush drainage strips and generous clearances form an accessible public realm.', x: 2.8, y: 0.4, z: -6},
  {title: 'The shopping complex', tag: '04 / ARCHITECTURE', description: 'A G+2 shopping complex lines the west side: three 4 m floors of round-bottomed windows with pink lattice transoms, two great arched entrances per wing, and 26 ground-floor shopfronts.', x: -8.2, y: 3, z: 12},
  {title: 'Small everyday essentials', tag: '05 / PUBLIC LIFE', description: 'Shaded benches, a separate drinking-water point, low-glare lighting and segregated waste points make room for longer visits. Harvested water never feeds the drinking-water point.', x: 4.6, y: 1.6, z: -39},
  {title: 'Rain-catching petals', tag: '06 / WATER + SHADE', description: 'Seven sculptural collectors down the centre of the street feed a filtered underground tank. A separate non-potable supply serves the complex and every street shop for cleaning, flushing and irrigation.', x: 0, y: 4.4, z: 26},
];
export interface Vendor {en: string; te: string; type: 'produce' | 'flowers' | 'craft' | 'food'; color: number; side: number; z: number}
export const vendors: Vendor[] = Array.from({length: 20}, (_, i) => {
  const names = [['Fresh harvest', 'తాజా కూరగాయలు', 'produce'], ['Flower house', 'పూల దుకాణం', 'flowers'], ['Coastal crafts', 'హస్తకళలు', 'craft'], ['Tea & tiffin', 'టీ టిఫిన్', 'food']] as const;
  const n = names[Math.floor(i / 5) % 4];
  return {en: n[0], te: n[1], type: n[2], color: [0x9b4836, 0xa3823a, 0x345b4c, 0x476878][i % 4], side: i % 2 ? 1 : -1, z: 36 - Math.floor(i / 2) * 8};
}).filter((v) => !(v.side < 0 && archZ.some((a) => Math.abs(a - v.z) < 3)));
