import type {Direction} from './movement';
const codes=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
export class WalkInput {
 private keys=new Set<string>();private button={forward:0,strafe:0};private dragging=false;private x=0;private y=0;
 constructor(private surface:HTMLCanvasElement,private enabled:()=>boolean,private manual:()=>void,look:(x:number,y:number)=>void){
  window.addEventListener('keydown',e=>{if(!this.enabled()||!codes.has(e.code)||document.activeElement?.matches('input,textarea,select,[contenteditable]'))return;const focused=document.activeElement;if(focused!==this.surface&&!this.surface.parentElement?.parentElement?.contains(focused))return;e.preventDefault();this.manual();this.keys.add(e.code)});
  window.addEventListener('keyup',e=>this.keys.delete(e.code));window.addEventListener('blur',()=>this.clear());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.clear()});
  surface.addEventListener('pointerdown',e=>{if(!this.enabled())return;this.dragging=true;this.x=e.clientX;this.y=e.clientY;surface.setPointerCapture(e.pointerId);this.focus()});surface.addEventListener('pointermove',e=>{if(!this.dragging||!this.enabled())return;look((e.clientX-this.x)*.003,(e.clientY-this.y)*.003);this.x=e.clientX;this.y=e.clientY});surface.addEventListener('pointerup',()=>this.dragging=false);surface.addEventListener('pointercancel',()=>this.dragging=false);surface.addEventListener('lostpointercapture',()=>this.dragging=false);
 }
 focus(){this.surface.focus({preventScroll:true})}
 clear(){this.keys.clear();this.button={forward:0,strafe:0};this.dragging=false}
 hold(forward:number,strafe:number){if(!this.enabled())return;this.manual();this.button={forward,strafe}}
 release(){this.button={forward:0,strafe:0}}
 direction():Direction{if(!this.enabled())return{forward:0,strafe:0,turn:0};return{forward:Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))-Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))+this.button.forward,strafe:Number(this.keys.has('KeyD'))-Number(this.keys.has('KeyA'))+this.button.strafe,turn:Number(this.keys.has('ArrowLeft'))-Number(this.keys.has('ArrowRight'))}}
}
