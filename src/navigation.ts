/** Clear promenade envelope; all solid street furniture lies outside it. */
export function canWalk(x:number,z:number){return Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<=3.35&&z>=-47&&z<=46}
