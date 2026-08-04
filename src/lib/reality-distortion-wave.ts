import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// ============================================================================
// 1. CONFIGURATION & TYPES
// ============================================================================

export enum VFXQuality { LOW, MEDIUM, HIGH, ULTRA }

export interface RealityWaveConfig {
  quality: VFXQuality;
  epicenter: THREE.Vector3;
  waveRadius: number;
  waveSpeed: number;
  distortionIntensity: number;
  rippleCount: number;
  chromaticSpread: number;
  bloomStrength: number;
  debrisCount: number;
  debrisColor: number;
  duration: number;
  onFracture?: () => void;
  onComplete?: () => void;
  soundHook?: (event: 'anticipation' | 'fracture' | 'expansion' | 'stabilize') => void;
  hapticHook?: (event: 'pull' | 'snap' | 'shockwave' | 'fade') => void;
}

const DEFAULT_CONFIG: RealityWaveConfig = {
  quality: VFXQuality.HIGH,
  epicenter: new THREE.Vector3(0, 5, 0),
  waveRadius: 2.0, // Screen-space radius
  waveSpeed: 3.5,
  distortionIntensity: 0.15,
  rippleCount: 15.0,
  chromaticSpread: 0.02,
  bloomStrength: 3.5,
  debrisCount: 2000,
  debrisColor: 0x00ffff, // Cyan/Glassy
  duration: 6000,
};

// Zero-Allocation Math Cache
const MATH = {
  v1: new THREE.Vector3(),
  v2: new THREE.Vector3(),
  mat4: new THREE.Matrix4(),
  quat: new THREE.Quaternion(),
  color: new THREE.Color(),
  screenPos: new THREE.Vector2(),
};

// ============================================================================
// 2. TIMELINE CONTROLLER (Cinematic Sequencing)
// ============================================================================

type TimelinePhase = { time: number; executed: boolean; action: () => void; update?: (t: number) => void; duration?: number };

class TimelineController {
  private phases: TimelinePhase[] = [];
  public time = 0;

  addPhase(startTimeMs: number, action: () => void, update?: (t: number) => void, durationMs?: number) {
    this.phases.push({ time: startTimeMs / 1000, executed: false, action, update, duration: durationMs ? durationMs / 1000 : 0 });
    this.phases.sort((a, b) => a.time - b.time);
  }

  update(delta: number) {
    this.time += delta;
    for (const p of this.phases) {
      if (!p.executed && this.time >= p.time) {
        p.action();
        p.executed = true;
      }
      if (p.executed && p.update && p.duration && this.time <= p.time + p.duration) {
        p.update(Math.min(1.0, (this.time - p.time) / p.duration)); // Normalized 0.0 to 1.0
      }
    }
  }
}

// ============================================================================
// 3. GLSL SHADERS (Screen-Space Reality Bending)
// ============================================================================

const Shaders = {
  // Bends UV coordinates based on an expanding radial mask
  RealityDistortion: {
    uniforms: {
      tDiffuse: { value: null },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) }, // Epicenter in UV space
      uAspect: { value: 1.0 }, // Screen aspect ratio
      uTime: { value: 0.0 },
      uProgress: { value: 0.0 }, // Expanding wave radius
      uIntensity: { value: 0.0 }, // Distortion strength
      uRippleCount: { value: 10.0 },
      uChromaticSpread: { value: 0.01 },
      uMode: { value: 0.0 }, // 0 = Expand, 1 = Implode (Anticipation)
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 uCenter;
      uniform float uAspect;
      uniform float uTime;
      uniform float uProgress;
      uniform float uIntensity;
      uniform float uRippleCount;
      uniform float uChromaticSpread;
      uniform float uMode;
      varying vec2 vUv;
      
      void main() {
        vec2 dir = vUv - uCenter;
        dir.x *= uAspect; // Fix aspect ratio so ripples are circular, not oval
        float dist = length(dir);
        
        if (dist == 0.0 || uIntensity <= 0.0) {
          gl_FragColor = texture2D(tDiffuse, vUv);
          return;
        }

        vec2 normDir = normalize(dir);
        
        // --- The Wave Mask ---
        // Creates a thick expanding ring. 
        float thickness = 0.3;
        float waveDist = abs(dist - uProgress);
        // Smoothstep creates the fade in/out of the distortion ring
        float mask = smoothstep(thickness, 0.0, waveDist); 
        
        // --- The Ripple Math ---
        // Sines wave modulated by the mask to create rippling energy
        float phase = (uMode == 0.0) ? (dist - uTime * 2.0) : (dist + uTime * 5.0);
        float ripple = sin(phase * uRippleCount) * mask * uIntensity;
        
        // --- Chromatic Aberration & Refraction ---
        // We offset the RGB channels along the normal direction of the wave
        float ca = uChromaticSpread * mask;
        vec2 uvR = vUv + normDir * (ripple + ca);
        vec2 uvG = vUv + normDir * ripple;
        vec2 uvB = vUv + normDir * (ripple - ca);
        
        vec4 cr = texture2D(tDiffuse, uvR);
        vec4 cg = texture2D(tDiffuse, uvG);
        vec4 cb = texture2D(tDiffuse, uvB);
        
        // Darken the edges of the wave for a more physical "glassy" look
        float shading = 1.0 - (mask * 0.5 * sin(phase * uRippleCount));
        
        gl_FragColor = vec4(cr.r, cg.g, cb.b, 1.0) * shading;
      }
    `
  }
};

// ============================================================================
// 4. INSTANCED GPU DEBRIS (Reality Fragments)
// ============================================================================

type DebrisPhysics = { active: boolean; pos: THREE.Vector3; vel: THREE.Vector3; rot: THREE.Vector3; rotVel: THREE.Vector3; scale: number; life: number; maxLife: number };

class DimensionalDebris {
  public mesh: THREE.InstancedMesh;
  private physics: DebrisPhysics[] = [];
  private count: number;

  constructor(count: number, color: number) {
    this.count = count;
    // An Octahedron stretched randomly looks like shards of glass/reality
    const geo = new THREE.OctahedronGeometry(0.1, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: color,
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 1.0
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.count = 0; // Hide initially

    // Initialize physics pool
    for (let i = 0; i < count; i++) {
      this.physics.push({
        active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3(), scale: 1, life: 0, maxLife: 1
      });
      // Hide instance
      MATH.mat4.identity().setPosition(0, -9999, 0);
      this.mesh.setMatrixAt(i, MATH.mat4);
    }
  }

  implode(center: THREE.Vector3) {
    // Particles get sucked into the epicenter
    this.mesh.count = this.count;
    for (let i = 0; i < this.count; i++) {
      const p = this.physics[i];
      p.active = true;
      p.life = 0;
      p.maxLife = 2.0;
      p.scale = Math.random() * 2.0 + 0.5;
      
      // Spawn in a wide sphere
      const radius = Math.random() * 15 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      p.pos.set(
        center.x + radius * Math.sin(phi) * Math.cos(theta),
        center.y + radius * Math.sin(phi) * Math.sin(theta),
        center.z + radius * Math.cos(phi)
      );
      
      // Velocity points INWARD
      p.vel.copy(center).sub(p.pos).normalize().multiplyScalar(Math.random() * 10 + 5);
      p.rotVel.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    }
  }

  explode(center: THREE.Vector3, power: number) {
    for (let i = 0; i < this.count; i++) {
      const p = this.physics[i];
      if (!p.active) continue; // Only explode active particles
      
      p.maxLife = Math.random() * 2.0 + 1.0;
      p.life = 0;
      // Velocity points OUTWARD violently
      p.vel.copy(p.pos).sub(center).normalize().multiplyScalar(Math.random() * power + power * 0.5);
      p.vel.y += Math.random() * power * 0.5; // Slight upward bias
    }
  }

  update(delta: number, timeScale: number) {
    if (this.mesh.count === 0) return;
    
    let matrixUpdated = false;
    const scaledDelta = delta * timeScale;

    for (let i = 0; i < this.count; i++) {
      const p = this.physics[i];
      if (!p.active) continue;

      p.life += scaledDelta;
      if (p.life >= p.maxLife) {
        p.active = false;
        MATH.mat4.identity().setPosition(0, -9999, 0);
        this.mesh.setMatrixAt(i, MATH.mat4);
        matrixUpdated = true;
        continue;
      }

      // Physics
      p.vel.y -= 9.8 * scaledDelta; // Gravity
      p.vel.multiplyScalar(0.95); // Drag
      p.pos.addScaledVector(p.vel, scaledDelta);
      p.rot.addScaledVector(p.rotVel, scaledDelta);

      // Scale down over life
      const currentScale = p.scale * (1.0 - Math.pow(p.life / p.maxLife, 2.0));

      MATH.mat4.makeRotationFromEuler(new THREE.Euler(p.rot.x, p.rot.y, p.rot.z));
      MATH.mat4.setPosition(p.pos);
      MATH.mat4.scale(MATH.v2.set(currentScale, currentScale, currentScale));
      
      this.mesh.setMatrixAt(i, MATH.mat4);
      matrixUpdated = true;
    }

    if (matrixUpdated) this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// ============================================================================
// 5. MAIN ENGINE ORCHESTRATOR
// ============================================================================

export class RealityWaveEngine {
  private config: RealityWaveConfig;
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private distortionPass: ShaderPass;
  
  private timeline = new TimelineController();
  private clock = new THREE.Clock();
  
  private debris: DimensionalDebris;
  private coreLight: THREE.PointLight;

  // States
  private animFrame = 0;
  private globalTime = 0;
  private cameraShake = 0;
  private activeTimeScale = 1.0;
  private targetTimeScale = 1.0;

  constructor(config: Partial<RealityWaveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // WebGL Setup
    this.container = document.createElement('div');
    Object.assign(this.container.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '9999' });
    document.body.appendChild(this.container);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 5, 20);
    this.camera.lookAt(this.config.epicenter);

    // Subsystems
    this.setupPostProcessing();
    
    this.debris = new DimensionalDebris(this.config.debrisCount, this.config.debrisColor);
    this.scene.add(this.debris.mesh);

    this.coreLight = new THREE.PointLight(this.config.debrisColor, 0, 50);
    this.coreLight.position.copy(this.config.epicenter);
    this.scene.add(this.coreLight);
    
    window.addEventListener('resize', this.onResize);
    this.onResize(); // Force aspect ratio update for shader
    this.buildCinematicSequence();
  }

  private setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0, 0.5, 0.2);
    this.composer.addPass(this.bloomPass);

    this.distortionPass = new ShaderPass(Shaders.RealityDistortion);
    this.distortionPass.uniforms.uIntensity.value = 0.0;
    this.distortionPass.uniforms.uRippleCount.value = this.config.rippleCount;
    this.distortionPass.uniforms.uChromaticSpread.value = this.config.chromaticSpread;
    this.composer.addPass(this.distortionPass);
  }

  // --- THE CINEMATIC CHOREOGRAPHY ---
  private buildCinematicSequence() {
    // 1. Anticipation (Space compresses inward)
    this.timeline.addPhase(0, () => {
      this.config.soundHook?.('anticipation');
      this.config.hapticHook?.('pull');
      this.targetTimeScale = 0.1; // Matrix slow-motion starts
      
      this.distortionPass.uniforms.uMode.value = 1.0; // Implode mode
      this.debris.implode(this.config.epicenter);
    }, (t) => {
      // Space bends violently inward
      const ease = Math.pow(t, 2.0);
      this.distortionPass.uniforms.uIntensity.value = ease * this.config.distortionIntensity;
      this.distortionPass.uniforms.uProgress.value = (1.0 - ease) * 1.5; // Shrink radius to 0
      
      this.bloomPass.strength = ease * 2.0;
      this.coreLight.intensity = ease * 20.0;
      this.cameraShake = ease * 0.3; // Building rumble
    }, 1500);

    // 2. The Fracture (Reality breaks)
    this.timeline.addPhase(1500, () => {
      this.config.soundHook?.('fracture');
      this.config.hapticHook?.('snap');
      this.config.onFracture?.();
      
      this.targetTimeScale = 0.01; // NEAR FROZEN
      this.cameraShake = 2.5; // Violent snap
      
      this.distortionPass.uniforms.uMode.value = 0.0; // Expand mode
      this.distortionPass.uniforms.uProgress.value = 0.0;
      this.distortionPass.uniforms.uIntensity.value = this.config.distortionIntensity * 2.0; // Overdrive
      this.distortionPass.uniforms.uChromaticSpread.value = this.config.chromaticSpread * 5.0; // Extreme color split
      
      this.bloomPass.strength = 8.0; // Blinding flash
      this.coreLight.intensity = 100.0;
      
      // Debris violently changes direction
      this.debris.explode(this.config.epicenter, 40.0);
    }, (t) => {
      // Hold the frozen state briefly, fading the blinding white flash
      this.bloomPass.strength = THREE.MathUtils.lerp(8.0, this.config.bloomStrength, t);
    }, 400); // Only 400ms in real-time, but feels longer due to time scale

    // 3. The Expansion Wave (Reality ripples outward)
    this.timeline.addPhase(1900, () => {
      this.config.soundHook?.('expansion');
      this.config.hapticHook?.('shockwave');
      this.targetTimeScale = 1.0; // Spring back to normal speed
    }, (t) => {
      // The wave travels outward
      const easeOut = 1.0 - Math.pow(1.0 - t, 3.0); // Cubic ease out
      this.distortionPass.uniforms.uProgress.value = easeOut * this.config.waveRadius;
      
      // Intensity fades as wave expands
      this.distortionPass.uniforms.uIntensity.value = (1.0 - easeOut) * (this.config.distortionIntensity * 2.0);
      this.distortionPass.uniforms.uChromaticSpread.value = (1.0 - easeOut) * (this.config.chromaticSpread * 5.0);
      
      this.coreLight.intensity = (1.0 - easeOut) * 50.0;
    }, 2500);

    // 4. Stabilization & Cleanup
    this.timeline.addPhase(4400, () => {
      this.config.soundHook?.('stabilize');
      this.config.hapticHook?.('fade');
      this.distortionPass.uniforms.uIntensity.value = 0; // Ensure it's off
    }, (t) => {
      this.bloomPass.strength = THREE.MathUtils.lerp(this.config.bloomStrength, 0, t);
    }, 1500);

    this.timeline.addPhase(6000, () => {
      this.dispose();
    });
  }

  public activate() {
    this.globalTime = 0;
    this.animFrame = requestAnimationFrame(this.renderLoop);
  }

  private renderLoop = () => {
    this.animFrame = requestAnimationFrame(this.renderLoop);
    const rawDelta = this.clock.getDelta();
    
    // Spring-based Time Dilation
    this.activeTimeScale += (this.targetTimeScale - this.activeTimeScale) * 6.0 * rawDelta;
    const scaledDelta = rawDelta * this.activeTimeScale;
    this.globalTime += scaledDelta;

    // Orchestrate Subsystems
    this.timeline.update(rawDelta * 1000); // Timeline reads unscaled time
    this.distortionPass.uniforms.uTime.value = this.globalTime;
    
    // Calculate Dynamic Screen-Space Epicenter Center
    // This allows the distortion wave to perfectly track the 3D epicenter even if the camera moves/shakes
    MATH.screenPos.copy(this.config.epicenter as any).project(this.camera as any);
    this.distortionPass.uniforms.uCenter.value.set((MATH.screenPos.x + 1) / 2, (MATH.screenPos.y + 1) / 2);

    this.debris.update(rawDelta, this.activeTimeScale);

    // Harmonic Camera Shake
    if (this.cameraShake > 0.01) {
      this.camera.position.x = Math.sin(this.globalTime * 50) * this.cameraShake * 0.4;
      this.camera.position.y = 5 + Math.cos(this.globalTime * 45) * this.cameraShake * 0.4;
      this.camera.lookAt(this.config.epicenter);
      this.cameraShake *= 0.88; // Decay
    } else {
      this.camera.position.set(0, 5, 20);
    }

    this.composer.render();
  };

  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    
    // Crucial for perfect circular distortion waves
    this.distortionPass.uniforms.uAspect.value = w / h;
  };

  public dispose() {
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this.onResize);
    
    // Rigorous Memory Cleanup
    this.debris.mesh.geometry.dispose();
    (this.debris.mesh.material as THREE.Material).dispose();
    
    this.renderer.dispose();
    if (this.container.parentNode) this.container.parentNode.removeChild(this.container);
    this.config.onComplete?.();
  }
}

// ============================================================================
// PUBLIC API EXPORT
// ============================================================================

/**
 * Triggers a AAA-quality cinematic Reality Distortion Wave.
 * @param customConfig Override default radius, speed, colors, and hooks.
 * @returns The RealityWaveEngine instance
 */
export const triggerRealityWave = (customConfig?: Partial<RealityWaveConfig>) => {
  const engine = new RealityWaveEngine(customConfig);
  engine.activate();
  return engine;
};
  
