export interface Stop {name:string; subtitle:string; z:number; title:string; description:string}
export const stops:Stop[]=[
 {name:'The threshold',subtitle:'Entrance',z:43,title:'A slower kind of arrival.',description:'A welcoming pedestrian gateway gives the street back to people. A continuous, step-free promenade connects the entire market.'},
 {name:'Everyday abundance',subtitle:'Produce market',z:22,title:'Local trade. A better home.',description:'Fresh produce and flower sellers occupy shaded modular bays, with integrated storage, washable counters and discreet digital-payment signage.'},
 {name:'Made by hand',subtitle:'Craft lane',z:0,title:'Tradition, still in the making.',description:'Timber-framed stalls bring crafts and textiles into the street. Colourful awnings and repaired shopfronts preserve the character of a working market.'},
 {name:'A taste of Vizag',subtitle:'Food court',z:-22,title:'Stay for another cup.',description:'A shaded gathering place for tea, tiffin and conversation. Organised food stalls pair local hospitality with clean counters and segregated waste points.'},
 {name:'Room to gather',subtitle:'Community square',z:-43,title:'The street becomes a place.',description:'Trees, generous seating and a shared water point create a small civic living room. Warm lighting keeps the pedestrian market welcoming into the evening.'}
];
export interface Feature {title:string; tag:string; description:string; x:number;z:number}
export const features:Feature[]=[
 {title:'A new home for hawkers',tag:'01 / LIVELIHOODS',description:'A coordinated kit of timber frames, durable counters, concealed cupboards and payment signage supports existing trading traditions. Each bay retains its own colour and identity.',x:-4.8,z:22},
 {title:'Shade, all along the way',tag:'02 / COMFORT',description:'Separated rain-catching petals and planted edges shade the market. Warm metal ribs support pale diffuse panels, while columns and concealed downpipes sit outside the clear walking route.',x:4.2,z:6},
 {title:'One continuous promenade',tag:'03 / ACCESSIBILITY',description:'A level central route links every destination. Flush drainage strips, generous clearances and entrances without steps form the concept’s accessible public realm.',x:0,z:0},
 {title:'Craft underfoot',tag:'04 / MATERIALS',description:'Warm stone paving, terracotta borders and a distinct central band replace the visual language of a road. Surface changes define vendor bays without introducing kerbs.',x:-2.5,z:-18},
 {title:'Small everyday essentials',tag:'05 / PUBLIC LIFE',description:'Shaded benches, a separate drinking-water point, low-glare lighting and segregated waste points make room for longer visits. Harvested water never feeds the drinking-water point.',x:4.6,z:-39},
 {title:'Rain-catching petals',tag:'06 / WATER + SHADE',description:'Sixteen sculptural shade collectors feed a filtered underground storage system. A separate non-potable supply serves all twenty-six shop bays for suitable cleaning, flushing and irrigation uses.',x:-4.2,z:30}
];
export interface Vendor {en:string;te:string;type:'produce'|'flowers'|'craft'|'food';color:number;side:number;z:number}
export const vendors:Vendor[]=Array.from({length:20},(_,i)=>{const names=[['Fresh harvest','తాజా కూరగాయలు','produce'],['Flower house','పూల దుకాణం','flowers'],['Coastal crafts','హస్తకళలు','craft'],['Tea & tiffin','టీ టిఫిన్','food']] as const;const n=names[Math.floor(i/5)%4];return {en:n[0],te:n[1],type:n[2],color:[0x9b4836,0xa3823a,0x345b4c,0x476878][i%4],side:i%2?1:-1,z:36-Math.floor(i/2)*8}});
