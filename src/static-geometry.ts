import * as T from 'three';
/** Expand quantized accessors before world transforms; normalized integer setters clamp world coordinates. */
export function expandQuantizedAttributes(g:T.BufferGeometry){for(const name of ['position','normal','uv']){const a=g.getAttribute(name);if(a&&!(a.array instanceof Float32Array)){const values=new Float32Array(a.count*a.itemSize);for(let i=0;i<a.count;i++)for(let c=0;c<a.itemSize;c++)values[i*a.itemSize+c]=a.getComponent(i,c);g.setAttribute(name,new T.BufferAttribute(values,a.itemSize))}}return g}
