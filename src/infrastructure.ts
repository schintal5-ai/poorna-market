export interface Canopy {id:string;x:number;z:number;side:number}
export interface ShopConnection {id:string;name:string;side:number;z:number;collection:'collection-main';supply:'non-potable-main'}
export const canopies:Canopy[]=Array.from({length:16},(_,i)=>({id:`C${i+1}`,x:i%2?4.2:-4.2,z:42-Math.floor(i/2)*12,side:i%2?1:-1}));
export const shopConnections:ShopConnection[]=Array.from({length:26},(_,i)=>({id:`S${String(i+1).padStart(2,'0')}`,name:`Shop ${i+1}`,side:i<13?-1:1,z:46-(i%13)*8,collection:'collection-main',supply:'non-potable-main'}));
export const waterStages=['Rain-catching petals','Debris screen + first-flush diversion','Filtration','Underground storage','Pump + separate supply main','Shop cleaning, flushing and irrigation'];
