import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// ============================================================================
// 1. CONFIGURATION & TYPES
// ============================================================================

export enum Quality { LOW, MEDIUM, HIGH, ULTRA }

export interface PortalConfig {
  quality: Quality;
  coreColors: number[];
  edgeColors: number[];
  duration: number;
  particleCount: number;
  bloomIntensity: number;
  distortionStrength: number;
  container?: HTMLDivElement;
  onOpen?: () => void;
  onClose?: () => void;
  soundHook?: (event: 'gather' | 'tear' | 'hum' | 'collapse') => void;
  hapticHook?: (event: 'rumble' | 'snap' | 'shockwave') => void;
}

const DEFAULT_CONFIG: PortalConfig = {
  quality: Quality.HIGH,
  coreColors: [0x05001a, 0x1a0040],
  edgeColors: [0x00ffff, 0x9d00ff],
  duration: 10000,
  particleCount: 15000,
  bloomIntensity: 2.5,
  distortionStrength: 0.15,
};

const MATH = {
  vec3: new THREE.Vector3(),
  color: new THREE.Color(),
  dummy: new THREE.Object3D(),
};

type TimelineEvent = { time: number; executed: boolean; action: () => void; update?: (t: number) => void; duration?: number };

class TimelineController {
  private events: TimelineEvent[] = [];
  public time = 0;

  addPhase(startTimeMs: number, action: () => void, update?: (t: number) => void, durationMs?: number) {
    this.events.push({ time: startTimeMs / 1000, executed: false, action, update, duration: durationMs ? durationMs / 1000 : 0 });
    this.events.sort((a, b) => a.time - b.time);
  }

  update(delta: number) {
    this.time += delta;
    for (const e of this.events) {
      if (!e.executed && this.time >= e.time) {
        e.action();
        e.executed = true;
      }
      if (e.executed && e.update && e.duration && this.time <= e.time + e.duration) {
        e.update((this.time - e.time) / e.duration);
      }
    }
  }
}

const Shaders = {
  PortalVortex: {
    uniforms: {
      uTime: { value: 0 },
      uPhase: { value: 0 },
      uColorInner: { value: new THREE.Color(0x05001a) },
      uColorOuter: { value: new THREE.Color(0x00ffff) },
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uPhase; uniform vec3 uColorInner; uniform vec3 uColorOuter; varying vec2 vUv;
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx); vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
        vec4 x12=x0.xyxy+C.xxzz-vec4(i1,0.0,0.0); i=mod(i,289.0);
        vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
        vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0); m=m*m; m=m*m;
        vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
        m*=1.79284291400159-0.85373472095314*(a0*a0+h*h); vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.0*dot(m,g);
      }
      void main(){
        vec2 uv=vUv-0.5; float dist=length(uv)*2.0; uv.x*=1.5; float ovalDist=length(uv)*2.0; float angle=atan(uv.y,uv.x);
        float vortex=angle-dist*4.0+uTime*3.0; float noise=snoise(vec2(cos(vortex),sin(vortex))*2.0-uTime*0.5);
        float edge=smoothstep(1.0,0.8,ovalDist+noise*0.2); float mask=smoothstep(1.0-uPhase,1.05-uPhase,edge);
        vec3 finalColor=mix(uColorInner,uColorOuter,smoothstep(0.0,0.8,ovalDist)); finalColor+=max(0.0,noise*0.5)*uColorOuter;
        float rim=smoothstep(0.8,1.0,ovalDist)*mask; finalColor+=uColorOuter*rim*3.0; if(mask<=0.01) discard;
        gl_FragColor=vec4(finalColor,mask*smoothstep(1.0,0.9,ovalDist));
      }
    `
  },
  SpaceDistortion: {
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uStrength: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uTime; uniform float uStrength; varying vec2 vUv;
      void main(){ vec2 uv=vUv; vec2 center=vec2(0.5); float dist=distance(uv,center); float ripple=sin(dist*20.0-uTime*10.0)*exp(-dist*5.0);
        vec2 offset=uv-center; float offsetLength=length(offset); vec2 dir=offsetLength>0.0001?offset/offsetLength:vec2(0.0);
        vec2 distortedUv=uv+dir*ripple*uStrength; gl_FragColor=texture2D(tDiffuse,mix(uv,distortedUv,uStrength)); }
    `
  }
};

class GPUVFXParticles {
  public mesh: THREE.Points; private maxParticles: number; private cursor = 0;
  constructor(maxParticles:number){
    this.maxParticles=maxParticles; const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(maxParticles*3),3));
    geo.setAttribute('velocity',new THREE.BufferAttribute(new Float32Array(maxParticles*3),3));
    geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(maxParticles*3),3));
    geo.setAttribute('lifeData',new THREE.BufferAttribute(new Float32Array(maxParticles*2),2));
    const mat=new THREE.ShaderMaterial({ uniforms:{uTime:{value:0},uGravity:{value:-2.0}}, vertexShader:`
      uniform float uTime; uniform float uGravity; attribute vec3 velocity; attribute vec3 color; attribute vec2 lifeData; varying vec3 vColor; varying float vAlpha;
      void main(){float age=max(0.0,uTime-lifeData.x);float lifePct=age/lifeData.y;if(age>lifeData.y||lifeData.x==0.0){gl_Position=vec4(9999.0);return;}vec3 pos=position;pos+=velocity*age*exp(-age*1.2);pos.y+=uGravity*age*age;vColor=color;vAlpha=smoothstep(0.0,0.1,lifePct)*smoothstep(1.0,0.6,lifePct);vec4 mvPos=modelViewMatrix*vec4(pos,1.0);gl_PointSize=(12.0/-mvPos.z)*vAlpha;gl_Position=projectionMatrix*mvPos;}
    `, fragmentShader:`
      varying vec3 vColor; varying float vAlpha; void main(){float d=distance(gl_PointCoord,vec2(0.5));if(d>0.5)discard;gl_FragColor=vec4(vColor*2.0,vAlpha*pow(1.0-(d*2.0),1.5));}
    `, transparent:true,blending:THREE.AdditiveBlending,depthWrite:false });
    this.mesh=new THREE.Points(geo,mat); this.mesh.frustumCulled=false;
  }
  emit(count:number,center:THREE.Vector3,time:number,colorHex:number,speed:number,flowInward=false){
    const pos=this.mesh.geometry.attributes.position.array as Float32Array, vel=this.mesh.geometry.attributes.velocity.array as Float32Array, col=this.mesh.geometry.attributes.color.array as Float32Array, life=this.mesh.geometry.attributes.lifeData.array as Float32Array; MATH.color.setHex(colorHex);
    for(let i=0;i<count;i++){const idx=this.cursor%this.maxParticles,i3=idx*3,i2=idx*2,radius=Math.random()*3+1,theta=Math.random()*Math.PI*2,phi=Math.acos(Math.random()*2-1),spawnX=center.x+radius*Math.sin(phi)*Math.cos(theta),spawnY=center.y+radius*Math.sin(phi)*Math.sin(theta),spawnZ=center.z+radius*Math.cos(phi);pos[i3]=spawnX;pos[i3+1]=spawnY;pos[i3+2]=spawnZ;if(flowInward){vel[i3]=(center.x-spawnX)*speed;vel[i3+1]=(center.y-spawnY)*speed;vel[i3+2]=(center.z-spawnZ)*speed;}else{vel[i3]=(spawnX-center.x)*speed;vel[i3+1]=(spawnY-center.y)*speed;vel[i3+2]=(spawnZ-center.z)*speed;}col[i3]=MATH.color.r;col[i3+1]=MATH.color.g;col[i3+2]=MATH.color.b;life[i2]=time;life[i2+1]=Math.random()*1.5+1.0;this.cursor++;}
    this.mesh.geometry.attributes.position.needsUpdate=true;this.mesh.geometry.attributes.velocity.needsUpdate=true;this.mesh.geometry.attributes.color.needsUpdate=true;this.mesh.geometry.attributes.lifeData.needsUpdate=true;
  }
  update(time:number){(this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value=time;}
}

export class PortalEngine {
  private config:PortalConfig; private container:HTMLDivElement; private renderer:THREE.WebGLRenderer; private scene:THREE.Scene; private camera:THREE.PerspectiveCamera; private ppComposer:EffectComposer; private bloomPass:UnrealBloomPass; private distortionPass:ShaderPass; private timeline=new TimelineController(); private clock=new THREE.Clock(); private sparks:GPUVFXParticles; private portalMesh:THREE.Mesh; private shockwaveMesh:THREE.Mesh; private animFrame=0; private globalTime=0; private activeTimeScale=1.0; private targetTimeScale=1.0;

  constructor(config:Partial<PortalConfig>={}){
    this.config={...DEFAULT_CONFIG,...config};
    if(this.config.container){this.container=this.config.container;Object.assign(this.container.style,{position:'absolute',inset:'0',overflow:'hidden',pointerEvents:'auto'});}else{this.container=document.createElement('div');Object.assign(this.container.style,{position:'fixed',inset:'0',overflow:'hidden',pointerEvents:'auto'});document.body.appendChild(this.container);}
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));this.renderer.setSize(Math.max(1,this.container.clientWidth),Math.max(1,this.container.clientHeight));Object.assign(this.renderer.domElement.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'auto'});this.container.appendChild(this.renderer.domElement);
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(60,1,0.1,100);this.camera.position.z=10;
    this.ppComposer=new EffectComposer(this.renderer);this.ppComposer.addPass(new RenderPass(this.scene,this.camera));this.bloomPass=new UnrealBloomPass(new THREE.Vector2(Math.max(1,this.container.clientWidth),Math.max(1,this.container.clientHeight)),this.config.bloomIntensity,0.8,0.1);this.ppComposer.addPass(this.bloomPass);this.distortionPass=new ShaderPass(Shaders.SpaceDistortion);this.ppComposer.addPass(this.distortionPass);
    const portalGeometry=new THREE.PlaneGeometry(7,10,1,1);const portalMaterial=new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.clone(Shaders.PortalVortex.uniforms),vertexShader:Shaders.PortalVortex.vertexShader,fragmentShader:Shaders.PortalVortex.fragmentShader,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});this.portalMesh=new THREE.Mesh(portalGeometry,portalMaterial);this.scene.add(this.portalMesh);
    const shockwaveGeometry=new THREE.RingGeometry(0.1,3.5,96);const shockwaveMaterial=new THREE.MeshBasicMaterial({color:this.config.edgeColors[0],transparent:true,opacity:0,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false});this.shockwaveMesh=new THREE.Mesh(shockwaveGeometry,shockwaveMaterial);this.shockwaveMesh.visible=false;this.scene.add(this.shockwaveMesh);
    this.sparks=new GPUVFXParticles(this.config.particleCount);this.scene.add(this.sparks.mesh);
    this.handleResize=this.handleResize.bind(this);window.addEventListener('resize',this.handleResize,{passive:true});this.animate=this.animate.bind(this);this.animFrame=window.requestAnimationFrame(this.animate);
  }

  private handleResize(){const width=Math.max(1,this.container.clientWidth),height=Math.max(1,this.container.clientHeight);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);this.ppComposer.setSize(width,height);}
  private animate(){const delta=Math.min(this.clock.getDelta(),0.1);this.globalTime+=delta*this.activeTimeScale;this.timeline.update(delta*this.activeTimeScale);const portalMaterial=this.portalMesh.material as THREE.ShaderMaterial;if(portalMaterial.uniforms.uTime)portalMaterial.uniforms.uTime.value=this.globalTime;this.sparks.update(this.globalTime);if(this.targetTimeScale!==this.activeTimeScale)this.activeTimeScale+=(this.targetTimeScale-this.activeTimeScale)*Math.min(1,delta*8);this.ppComposer.render();this.animFrame=window.requestAnimationFrame(this.animate);}
  open(){const material=this.portalMesh.material as THREE.ShaderMaterial;material.uniforms.uPhase.value=0;this.timeline=new TimelineController();this.timeline.addPhase(0,()=>this.config.soundHook?.('gather'));this.timeline.addPhase(100,()=>this.sparks.emit(1200,MATH.vec3.set(0,0,0),this.globalTime,this.config.edgeColors[0],1.5,true));this.timeline.addPhase(300,()=>this.config.soundHook?.('tear'));this.timeline.addPhase(500,()=>this.config.onOpen?.());this.timeline.addPhase(500,()=>this.sparks.emit(1800,MATH.vec3.set(0,0,0),this.globalTime,this.config.edgeColors[1],2.2));this.timeline.addPhase(1200,()=>this.shockwave(),()=>{},900);this.timeline.addPhase(1600,()=>this.config.soundHook?.('hum'));this.timeline.addPhase(1800,()=>this.sparks.emit(700,MATH.vec3.set(0,0,0),this.globalTime,this.config.edgeColors[0],0.9));}
  private shockwave(){this.shockwaveMesh.visible=true;this.shockwaveMesh.scale.setScalar(0.25);(this.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity=1;const start=performance.now(),duration=900;const tick=(now:number)=>{const t=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-t,3);this.shockwaveMesh.scale.setScalar(0.25+eased*3.5);(this.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity=1-t;if(t<1&&!this.renderer.getContext().isContextLost())window.requestAnimationFrame(tick);else{this.shockwaveMesh.visible=false;}};window.requestAnimationFrame(tick);}
  dispose(){window.cancelAnimationFrame(this.animFrame);window.removeEventListener('resize',this.handleResize);this.scene.traverse((object)=>{const mesh=object as THREE.Mesh;if(mesh.geometry)mesh.geometry.dispose();if(Array.isArray(mesh.material))mesh.material.forEach((material)=>material.dispose());else if(mesh.material)mesh.material.dispose();});this.ppComposer.dispose();this.renderer.dispose();if(this.container.parentElement)this.container.parentElement.removeChild(this.container);}
}
