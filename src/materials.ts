import * as T from 'three';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
export type Surface='stone'|'plaster'|'wood'|'fabric'|'metal'|'plain'|'ceramic'|'leaf';
export class Materials {
 private maps=new Map<string,T.Texture>();private cache=new Map<string,T.MeshStandardMaterial>();
 readonly failures:string[]=[];readonly glow=new T.MeshStandardMaterial({color:0xffe7bd,emissive:0xffc46d,emissiveIntensity:.15,roughness:.3});
 async load(renderer:T.WebGLRenderer,scene:T.Scene,onProgress:(s:string)=>void){
  const loader=new T.TextureLoader();let done=0;
  const tasks=['stone','plaster','wood','fabric'].flatMap(name=>['diff','normal','rough'].map(async kind=>{try{const tex=await loader.loadAsync(`/assets/${name}-${kind}.webp`);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);if(kind==='diff')tex.colorSpace=T.SRGBColorSpace;this.maps.set(`${name}-${kind}`,tex)}catch{this.failures.push(`${name}-${kind}`)}onProgress(`Preparing materials · ${++done}/13`)}));
  tasks.push((async()=>{try{const hdr=await new RGBELoader().loadAsync('/assets/daylight.hdr');hdr.mapping=T.EquirectangularReflectionMapping;scene.background=hdr;const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(hdr).texture;scene.environmentIntensity=.8;scene.backgroundIntensity=.75;scene.backgroundRotation.y=1.2;scene.environmentRotation.y=1.2;pmrem.dispose()}catch{this.failures.push('daylight.hdr')}onProgress(`Preparing materials · ${++done}/13`)})());await Promise.all(tasks);
 }
 get(type:Surface,color:number,repeat=1){const key=`${type}-${color}-${repeat}`;let m=this.cache.get(key);if(m)return m;
  const texture=(kind:string)=>{const t=this.maps.get(`${type}-${kind}`)?.clone();if(t){t.repeat.set(repeat,repeat);t.needsUpdate=true}return t};
  m=new T.MeshStandardMaterial({color,roughness:type==='metal'?.3:type==='ceramic'?.3:.83,metalness:type==='metal'?.72:0,map:texture('diff')||null,normalMap:texture('normal')||null,roughnessMap:texture('rough')||null,normalScale:new T.Vector2(type==='plaster'?.3:.6,type==='plaster'?.3:.6)});if(type==='wood')m.color.lerp(new T.Color(0xffffff),.55);this.cache.set(key,m);return m;
 }
}
