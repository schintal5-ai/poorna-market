export const laneRadius=1.85;
export const routeLength=160+2*Math.PI*laneRadius;
/** Two one-way walking lanes joined by smooth semicircular turns at the gateways. */
export function crowdRoute(distance:number){const r=laneRadius,s=((distance%routeLength)+routeLength)%routeLength,arc=Math.PI*r;if(s<80)return{x:r,z:-40+s,yaw:0};if(s<80+arc){const t=(s-80)/r;return{x:r*Math.cos(t),z:40+r*Math.sin(t),yaw:-t}}if(s<160+arc)return{x:-r,z:40-(s-80-arc),yaw:Math.PI};const t=(s-160-arc)/r;return{x:-r*Math.cos(t),z:-40-r*Math.sin(t),yaw:Math.PI-t}}
