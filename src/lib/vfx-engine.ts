import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// ============================================================================
// 1. CONFIGURATION & TYPES
// ============================================================================

export enum VFXQuality { LOW, MEDIUM, HIGH, ULTRA }

export interface VFXConfig {
  quality: VFXQuality;
  colors: number[];
  baseParticleCount: number;
  bloomIntensity: number;
  duration: number;
  timeScale: number;
  onComplete?: () => void;
  hapticHook?: (event: string) => void;
  soundHook?: (event: string) => void;
}

const DEFAULT_CONFIG: VFXConfig = {
  quality: VFXQuality.HIGH,
  colors: [0x00f3ff, 0x9d00ff, 0xffea00, 0xffffff], // Cyan, Purple, Gold, White
  baseParticleCount: 10000,
  bloomIntensity: 2.5,
  duration: 8000,
  timeScale: 1.0,
};

// Zero-allocation math helpers
const TEMP_VEC3 = new THREE.Vector3();
const TEMP_MAT4 = new THREE.Matrix4();
const TEMP_QUAT = new THREE.Quaternion();
const TEMP_COLOR = new THREE.Color();
const DUMMY_OBJ = new THREE.Object3D();

// ============================================================================
// 2. TIMELINE CONTROLLER (Cinematic Sequencing)
// ============================================================================

type TimelineEvent = { time: number; executed: boolean; action: () => void };

class TimelineController {
  private events: TimelineEvent[] = [];
  private time = 0;

  addEvent(timeMs: number, action: () => void) {
    this.events.push({ time: timeMs / 1000, executed: false, action });
    this.events.sort((a, b) => a.time - b.time);
  }

  update(delta: number) {
    this.time += delta;
    for (let i = 0; i < this.events.length; i++) {
      if (!this.events[i].executed && this.time >= this.events[i].time) {
        this.events[i].action();
        this.events[i].executed = true;
      }
    }
  }

  reset() {
    this.time = 0;
    this.events.forEach(e => (e.executed = false));
  }
}

// ============================================================================
// 3. SHADER MANAGER & POST-PROCESSING
// ============================================================================

const CustomShaders = {
  // Chromatic Aberration & Radial Blur combined for impact punch
  CinematicDistortion: {
    uniforms: {
      tDiffuse: { value: null },
      uDistortion: { value: 0.0 }, // Chromatic spread
      uRadialBlur: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uDistortion;
      uniform float uRadialBlur;
      varying vec2 vUv;
      void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 dir = vUv - center;
        float dist = length(dir);
        dir = normalize(dir);
        
        // Chromatic Aberration
        vec4 cr = texture2D(tDiffuse, vUv + dir * uDistortion * dist);
        vec4 cg = texture2D(tDiffuse, vUv);
        vec4 cb = texture2D(tDiffuse, vUv - dir * uDistortion * dist);
        
        // Vignette
        float vignette = smoothstep(1.0, 0.2, dist);
        
        gl_FragColor = vec4(cr.r, cg.g, cb.b, 1.0) * vignette;
      }
    `
  }
};

class PostProcessingPipeline {
  public composer: EffectComposer;
  public bloom: UnrealBloomPass;
  public distortion: ShaderPass;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, config: VFXConfig) {
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    // High-threshold cinematic bloom
    this.bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), config.bloomIntensity, 0.6, 0.1);
    this.composer.addPass(this.bloom);

    this.distortion = new ShaderPass(CustomShaders.CinematicDistortion);
    this.composer.addPass(this.distortion);
  }

  update(delta: number, timeScale: number) {
    // Spring ease bloom back to normal
    this.bloom.strength += (2.5 - this.bloom.strength) * 5.0 * delta;
    this.distortion.uniforms.uDistortion.value += (0.0 - this.distortion.uniforms.uDistortion.value) * 8.0 * delta;
  }
}

// ============================================================================
// 4. GPU PARTICLE SYSTEM (Sparks, Embers, Magic Dust)
// ============================================================================

class GPUParticleSystem {
  public mesh: THREE.Points;
  private maxParticles: number;
  private cursor = 0;

  constructor(maxParticles: number) {
    this.maxParticles = maxParticles;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxParticles * 3), 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(new Float32Array(maxParticles * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxParticles * 3), 3));
    geo.setAttribute('lifeData', new THREE.BufferAttribute(new Float32Array(maxParticles * 2), 2)); // [startTime, duration]

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        uniform float uTime;
        attribute vec3 velocity;
        attribute vec3 color;
        attribute vec2 lifeData; // x = spawnTime, y = maxLife
        
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          float age = max(0.0, uTime - lifeData.x);
          float lifePct = age / lifeData.y;
          
          if (age > lifeData.y || lifeData.x == 0.0) {
            gl_Position = vec4(9999.0); // Hide dead particles
            return;
          }
          
          // Fluid Drag Simulation
          vec3 pos = position + velocity * age * exp(-age * 1.5);
          pos.y -= 4.0 * age * age; // Gravity curve
          
          vColor = color;
          // Smooth fade in and out (AAA technique)
          vAlpha = smoothstep(0.0, 0.1, lifePct) * smoothstep(1.0, 0.6, lifePct);
          
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (10.0 / -mvPos.z) * vAlpha;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          // Core brightness + soft edge
          float glow = pow(1.0 - (d * 2.0), 1.5); 
          gl_FragColor = vec4(vColor * 2.0, vAlpha * glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.Points(geo, mat);
    this.mesh.frustumCulled = false;
  }

  emit(count: number, pos: THREE.Vector3, time: number, color: THREE.Color, speed: number) {
    const positions = this.mesh.geometry.attributes.position.array as Float32Array;
    const vels = this.mesh.geometry.attributes.velocity.array as Float32Array;
    const colors = this.mesh.geometry.attributes.color.array as Float32Array;
    const life = this.mesh.geometry.attributes.lifeData.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const idx = this.cursor % this.maxParticles;
      const i3 = idx * 3;
      const i2 = idx * 2;

      positions[i3] = pos.x; positions[i3+1] = pos.y; positions[i3+2] = pos.z;
      
      // Spherical burst
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      vels[i3] = Math.sin(phi) * Math.cos(theta) * speed * (Math.random() * 0.5 + 0.5);
      vels[i3+1] = Math.sin(phi) * Math.sin(theta) * speed * (Math.random() * 0.5 + 0.5);
      vels[i3+2] = Math.cos(phi) * speed * (Math.random() * 0.5 + 0.5);

      colors[i3] = color.r; colors[i3+1] = color.g; colors[i3+2] = color.b;
      life[i2] = time;
      life[i2+1] = Math.random() * 2.0 + 1.0; // 1 to 3 sec lifetime

      this.cursor++;
    }
    
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.velocity.needsUpdate = true;
    this.mesh.geometry.attributes.color.needsUpdate = true;
    this.mesh.geometry.attributes.lifeData.needsUpdate = true;
  }

  update(time: number) {
    (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
  }
}

// ============================================================================
// 5. PROCEDURAL ENERGY RINGS (Shockwaves & Buildup)
// ============================================================================

class EnergyRingSystem {
  public mesh: THREE.Mesh;
  private active = false;
  private age = 0;

  constructor() {
    const geo = new THREE.TorusGeometry(1, 0.05, 16, 64);
    const mat = new THREE.MeshBasicMaterial({ 
      color: 0x00f3ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false 
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.x = Math.PI / 2; // Flat on floor
    this.mesh.visible = false;
  }

  trigger() {
    this.active = true;
    this.age = 0;
    this.mesh.visible = true;
    this.mesh.scale.set(0.1, 0.1, 0.1);
  }

  update(delta: number) {
    if (!this.active) return;
    this.age += delta * 3.0; // Speed
    
    // Expanding shockwave curve
    const scale = 1.0 + Math.pow(this.age, 2.5) * 15.0;
    this.mesh.scale.set(scale, scale, scale);
    
    // Fade out
    const opacity = Math.max(0, 1.0 - this.age);
    (this.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;

    if (this.age >= 1.0) {
      this.active = false;
      this.mesh.visible = false;
    }
  }
}

// ============================================================================
// 6. MAIN ENGINE ORCHESTRATOR
// ============================================================================

export class CinematicEngine {
  private config: VFXConfig;
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  private pp: PostProcessingPipeline;
  private timeline = new TimelineController();
  private clock = new THREE.Clock();
  private sparks: GPUParticleSystem;
  private shockwave: EnergyRingSystem;

  // Global State
  private globalTime = 0;
  private animFrame = 0;
  private activeTimeScale = 1.0;
  private targetTimeScale = 1.0;

  // Camera Shake State
  private shakeTime = 0;
  private shakeIntensity = 0;

  constructor(config: Partial<VFXConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.container = document.createElement('div');
    Object.assign(this.container.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '9999' });
    document.body.appendChild(this.container);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 2, 10);

    this.pp = new PostProcessingPipeline(this.renderer, this.scene, this.camera, this.config);
    this.sparks = new GPUParticleSystem(this.config.baseParticleCount);
    this.shockwave = new EnergyRingSystem();
    
    this.scene.add(this.sparks.mesh);
    this.scene.add(this.shockwave.mesh);

    window.addEventListener('resize', this.onResize);
    this.buildCinematicSequence();
  }

  private buildCinematicSequence() {
    // 1. Anticipation (Charge Up)
    this.timeline.addEvent(0, () => {
      this.config.soundHook?.('charge');
      this.targetTimeScale = 0.5; // Slight slow down to build tension
      // Spawn sucking energy particles (negative velocity emitted toward center)
      TEMP_COLOR.setHex(0x00f3ff);
      this.sparks.emit(1000, new THREE.Vector3(0, 0, 0), this.globalTime, TEMP_COLOR, -5);
    });

    // 2. Impact (Explosion)
    this.timeline.addEvent(1200, () => {
      this.config.soundHook?.('impact');
      this.config.hapticHook?.('heavy_impact');
      
      this.targetTimeScale = 0.02; // MATRIX BULLET TIME
      this.shakeIntensity = 2.5;
      
      // Post-Processing Spikes
      this.pp.bloom.strength = 8.0;
      this.pp.distortion.uniforms.uDistortion.value = 0.08;

      this.shockwave.trigger();

      // Emit massive multi-color burst
      this.config.colors.forEach(c => {
        TEMP_COLOR.setHex(c);
        this.sparks.emit(2500, new THREE.Vector3(0, 2, 0), this.globalTime, TEMP_COLOR, 25);
      });
    });

    // 3. Slow-Motion Apex
    this.timeline.addEvent(1500, () => {
      this.config.soundHook?.('slowmo_apex');
    });

    // 4. Graceful Recovery
    this.timeline.addEvent(2500, () => {
      this.targetTimeScale = 1.0; // Spring back to real-time
    });

    // 5. Cleanup
    this.timeline.addEvent(this.config.duration, () => {
      this.dispose();
    });
  }

  public play() {
    this.globalTime = 0;
    this.timeline.reset();
    this.animate();
  }

  private animate = () => {
    this.animFrame = requestAnimationFrame(this.animate);
    const rawDelta = this.clock.getDelta();
    
    // Cinematic Time Spring Interpolation
    this.activeTimeScale += (this.targetTimeScale - this.activeTimeScale) * 5.0 * rawDelta;
    const scaledDelta = rawDelta * this.activeTimeScale;
    this.globalTime += scaledDelta;

    // Sub-system Updates
    this.timeline.update(rawDelta * 1000); // Timeline operates in unscaled real-world MS
    this.sparks.update(this.globalTime);
    this.shockwave.update(scaledDelta);
    this.pp.update(rawDelta, this.activeTimeScale); // PP recovers in real-time

    // Harmonic Camera Shake
    if (this.shakeIntensity > 0.01) {
      this.shakeTime += rawDelta * 50;
      this.camera.position.x = Math.sin(this.shakeTime) * Math.cos(this.shakeTime * 0.8) * this.shakeIntensity;
      this.camera.position.y = 2 + Math.cos(this.shakeTime * 1.2) * Math.sin(this.shakeTime * 0.9) * this.shakeIntensity;
      this.shakeIntensity *= 0.85; // Exponential decay
      
      // FOV Punch
      this.camera.fov = 70 + (this.shakeIntensity * 10);
      this.camera.updateProjectionMatrix();
    }

    this.pp.composer.render();
  };

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.pp.composer.setSize(window.innerWidth, window.innerHeight);
  };

  public dispose() {
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this.onResize);
    
    this.sparks.mesh.geometry.dispose();
    (this.sparks.mesh.material as THREE.Material).dispose();
    this.shockwave.mesh.geometry.dispose();
    (this.shockwave.mesh.material as THREE.Material).dispose();
    
    this.renderer.dispose();
    if (this.container.parentNode) this.container.parentNode.removeChild(this.container);
    this.config.onComplete?.();
  }
}

// ============================================================================
// PUBLIC API EXPORT
// ============================================================================

export const triggerLegendaryLevelUp = (customConfig?: Partial<VFXConfig>) => {
  const engine = new CinematicEngine(customConfig);
  engine.play();
  return engine; // Return instance to allow manual aborts if necessary
};
      
