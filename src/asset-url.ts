/** Resolve public assets under either the domain root or a GitHub Pages repository path. */
export function assetUrl(file:string,baseURL=document.baseURI){return new URL('assets/'+file,baseURL).href}
