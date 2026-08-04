import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// ============================================================================
// 1. CONFIGURATION & TYPES
// ============================================================================

export enum VFXQuality { LOW, MEDIUM, HIGH, ULTRA }

export interface LightningConfig {
  quality: VFXQuality;
  coreColor: number;
  glowColor: number;
  origin: THREE.Vector3;
  target: THREE.Vector3;
  branchCount: number;
  roughness: number; // Fractal displacement strength
  duration: number;
  bloomIntensity: number;
  distortionStrength: number;
  onStrike?: () => void;
  onComplete?: () => void;
  soundHook?: (event: 'charge' | 'strike' | 'thunder' | 'crackle') => void;
  hapticHook?: (event: 'charge' | 'heavy_strike' | 'rumble') => void;
}

const DEFAULT_CONFIG: LightningConfig = {
  quality: VFXQuality.HIGH,
  coreColor: 0xffffff,     // Super-hot white core
  glowColor: 0x0066ff,     // High-voltage blue/cyan glow
  origin: new THREE.Vector3(0, 15, 0),
  target: new THREE.Vector3(0, -2, 0),
  branchCount: 5,
  roughness: 1.5,
  duration: 2500,
  bloomIntensity: 3.5,
  distortionStrength: 0.2,
};

// Zero-Allocation Math Cache
const MATH = {
  v1: new THREE.Vector3(),
  v2: new THREE.Vector3(),
  v3: new THREE.Vector3(),
  mat4: new THREE.Matrix4(),
  quat: new THREE.Quaternion(),
  color: new THREE.Color(),
  up: new THREE.Vector3(0, 1, 0),
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
        p.update((this.time - p.time) / p.duration); // Normalized 0.0 to 1.0
      }
    }
  }
}

// ============================================================================
// 3. GLSL SHADERS (Electrical Instability & Impact)
// ============================================================================

const Shaders = {
  // Volumetric Lightning Core with Fresnel edge-fading
  LightningBolt: {
    uniforms: {
      uTime: { value: 0 },
      uCoreColor: { value: new THREE.Color() },
      uGlowColor: { value: new THREE.Color() },
      uIntensity: { value: 0 },
      uProgress: { value: 0 }, // For animated striking
    },
    vertexShader: `
      attribute float segmentOrder; // 0.0 to 1.0 along the branch
      varying float vOrder;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      
      void main() {
        vOrder = segmentOrder;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uCoreColor;
      uniform vec3 uGlowColor;
      uniform float uIntensity;
      uniform float uProgress;
      
      varying float vOrder;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      
      // High-frequency noise for electrical flickering
      float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }

      void main() {
        // Animate the strike unrolling
        if (vOrder > uProgress) discard;

        // Extreme flickering (60hz simulation)
        float flicker = (rand(vec2(uTime * 50.0, vOrder)) * 0.4) + 0.6;
        
        // Volumetric Fresnel (Edges fade to transparent, making the cylinder look like a soft beam)
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = 1.0 - abs(dot(normal, viewDir));
        fresnel = pow(fresnel, 2.0); // Soften

        // Mix core and glow based on depth/fresnel
        vec3 finalColor = mix(uCoreColor, uGlowColor, fresnel);
        float alpha = (1.0 - fresnel) * uIntensity * flicker;
        
        // Emissive boost
        gl_FragColor = vec4(finalColor * 2.0, alpha);
      }
    `
  },

  // Chromatic Aberration & Lens Impact Distortion
  ShockwaveLens: {
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uStrength: { value: 0 },
      uCenter: { value: new vec2(0.5, 0.5) },
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uStrength;
      uniform vec2 uCenter;
      varying vec2 vUv;
      void main() {
        vec2 dir = vUv - uCenter;
        float dist = length(dir);
        vec2 normDir = normalize(dir);
        
        // Shockwave ripple
        float ripple = sin(dist * 30.0 - uStrength * 20.0) * exp(-dist * 8.0) * uStrength;
        
        // Chromatic split
        vec4 cr = texture2D(tDiffuse, vUv + normDir * ripple * 1.5);
        vec4 cg = texture2D(tDiffuse, vUv);
        vec4 cb = texture2D(tDiffuse, vUv - normDir * ripple * 1.5);
        
        // Vignette
        float vignette = smoothstep(1.2, 0.3, dist);
        
        gl_FragColor = vec4(cr.r, cg.g, cb.b, 1.0) * vignette;
      }
    `
  }
};

// ============================================================================
// 4. PROCEDURAL LIGHTNING GENERATOR (Fractal Subdivision)
// ============================================================================

type BoltSegment = { start: THREE.Vector3; end: THREE.Vector3; thickness: number; order: number };

class ProceduralLightning {
  public mesh: THREE.InstancedMesh;
  private maxSegments = 2000;
  private activeSegments = 0;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.CylinderGeometry;

  constructor(config: LightningConfig) {
    // A low-poly cylinder represents one segment of lightning. Instancing allows thousands of them efficiently.
    this.geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 4, 1, true);
    this.geometry.rotateX(Math.PI / 2); // Align to Z axis for easier LookAt math
    
    // Add custom attribute for strike animation
    const orderArray = new Float32Array(this.maxSegments);
    const instancedOrder = new THREE.InstancedBufferAttribute(orderArray, 1);
    this.geometry.setAttribute('segmentOrder', instancedOrder);

    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(Shaders.LightningBolt.uniforms),
      vertexShader: Shaders.LightningBolt.vertexShader,
      fragmentShader: Shaders.LightningBolt.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.material.uniforms.uCoreColor.value.setHex(config.coreColor);
    this.material.uniforms.uGlowColor.value.setHex(config.glowColor);

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxSegments);
    this.mesh.count = 0; // Hide initially
  }

  generate(start: THREE.Vector3, end: THREE.Vector3, config: LightningConfig) {
    const segments: BoltSegment[] = [];
    
    // Recursive Midpoint Displacement Algorithm
    const subdivide = (p1: THREE.Vector3, p2: THREE.Vector3, offsetAmount: number, generation: number, isMain: boolean) => {
      if (generation <= 0 || segments.length >= this.maxSegments - 2) {
        segments.push({ start: p1.clone(), end: p2.clone(), thickness: isMain ? 1.0 : 0.4, order: 0 });
        return;
      }

      // Find midpoint and jitter it
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const randomOffset = new THREE.Vector3(
        (Math.random() - 0.5) * offsetAmount,
        (Math.random() - 0.5) * offsetAmount,
        (Math.random() - 0.5) * offsetAmount
      );
      mid.add(randomOffset);

      subdivide(p1, mid, offsetAmount * 0.5, generation - 1, isMain);
      subdivide(mid, p2, offsetAmount * 0.5, generation - 1, isMain);

      // Procedural Branching
      if (Math.random() < (isMain ? 0.4 : 0.1) && config.branchCount > 0) {
        const branchEnd = mid.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * offsetAmount * 4,
          (Math.random() - 0.5) * offsetAmount * 4,
          (Math.random() - 0.5) * offsetAmount * 4
        ));
        subdivide(mid, branchEnd, offsetAmount * 0.6, generation - 2, false);
      }
    };

    subdivide(start, end, config.roughness, 6, true);

    // Build Instance Matrices
    this.activeSegments = Math.min(segments.length, this.maxSegments);
    this.mesh.count = this.activeSegments;

    const orderAttr = this.geometry.getAttribute('segmentOrder') as THREE.InstancedBufferAttribute;

    // Calculate distances to assign 'order' for animated unrolling
    let totalLength = 0;
    segments.forEach((seg, i) => {
      if (i >= this.activeSegments) return;
      const length = seg.start.distanceTo(seg.end);
      
      // Matrix Math for Instancing (Position, Rotation, Scale)
      MATH.v1.copy(seg.start).add(seg.end).multiplyScalar(0.5); // Midpoint
      MATH.mat4.setPosition(MATH.v1);
      
      // LookAt logic using zero-allocation cache
      MATH.mat4.lookAt(seg.start, seg.end, MATH.up);
      MATH.quat.setFromRotationMatrix(MATH.mat4);
      
      MATH.v2.set(seg.thickness, seg.thickness, length); // Scale
      
      MATH.mat4.compose(MATH.v1, MATH.quat, MATH.v2);
      this.mesh.setMatrixAt(i, MATH.mat4);

      // Assign sequential order
      totalLength += length;
      orderAttr.setX(i, i / this.activeSegments); 
    });

    this.mesh.instanceMatrix.needsUpdate = true;
    orderAttr.needsUpdate = true;
  }

  update(time: number, intensity: number, progress: number) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uIntensity.value = intensity;
    this.material.uniforms.uProgress.value = progress;
  }
}

// ============================================================================
// 5. GPU PARTICLE SYSTEM (Sparks & Plasma Embers)
// ============================================================================

class ErraticSparks {
  public mesh: THREE.Points;
  private maxSparks = 5000;
  private cursor = 0;

  constructor() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.maxSparks * 3), 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(new Float32Array(this.maxSparks * 3), 3));
    geo.setAttribute('lifeData', new THREE.BufferAttribute(new Float32Array(this.maxSparks * 2), 2));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        uniform float uTime;
        attribute vec3 velocity;
        attribute vec2 lifeData;
        varying float vAlpha;
        
        // Noise for erratic electrical movement
        float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }

        void main() {
          float age = max(0.0, uTime - lifeData.x);
          float lifePct = age / lifeData.y;
          if (age > lifeData.y || lifeData.x == 0.0) { gl_Position = vec4(9999.0); return; }
          
          vec3 pos = position;
          // Erratic jitter + physics
          pos += velocity * age * exp(-age * 1.5);
          pos.x += sin(uTime * 15.0 + position.y) * 0.2;
          pos.y -= age * age * 2.0; // Gravity
          
          vAlpha = smoothstep(0.0, 0.1, lifePct) * smoothstep(1.0, 0.5, lifePct);
          // Spark flickering
          vAlpha *= (rand(vec2(uTime * 20.0, position.x)) * 0.5 + 0.5);

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (15.0 / -mvPos.z) * vAlpha;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          gl_FragColor = vec4(vec3(1.0, 0.8, 0.2), vAlpha * pow(1.0 - (d * 2.0), 2.0)); // Gold/White sparks
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.mesh = new THREE.Points(geo, mat);
    this.mesh.frustumCulled = false;
  }

  emit(pos: THREE.Vector3, count: number, time: number) {
    const p = this.mesh.geometry.attributes.position.array as Float32Array;
    const v = this.mesh.geometry.attributes.velocity.array as Float32Array;
    const l = this.mesh.geometry.attributes.lifeData.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const idx = this.cursor % this.maxSparks;
      const i3 = idx * 3, i2 = idx * 2;

      p[i3] = pos.x; p[i3+1] = pos.y; p[i3+2] = pos.z;
      v[i3] = (Math.random() - 0.5) * 15;
      v[i3+1] = Math.random() * 15 + 5;
      v[i3+2] = (Math.random() - 0.5) * 15;
      l[i2] = time;
      l[i2+1] = Math.random() * 1.5 + 0.5;

      this.cursor++;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.velocity.needsUpdate = true;
    this.mesh.geometry.attributes.lifeData.needsUpdate = true;
  }

  update(time: number) { (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = time; }
}

// ============================================================================
// 6. MAIN ENGINE ORCHESTRATOR
// ============================================================================

export class LightningEngine {
  private config: LightningConfig;
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private shockwavePass: ShaderPass;
  
  private timeline = new TimelineController();
  private clock = new THREE.Clock();
  
  private lightning: ProceduralLightning;
  private sparks: ErraticSparks;
  private impactLight: THREE.PointLight;

  // States
  private animFrame = 0;
  private globalTime = 0;
  private cameraShake = 0;
  private activeTimeScale = 1.0;
  private targetTimeScale = 1.0;

  constructor(config: Partial<LightningConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // DOM & WebGL
    this.container = document.createElement('div');
    Object.assign(this.container.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '9999' });
    document.body.appendChild(this.container);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 5, 25);

    // Post-Processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0, 0.4, 0.1);
    this.composer.addPass(this.bloomPass);

    this.shockwavePass = new ShaderPass(Shaders.ShockwaveLens);
    this.composer.addPass(this.shockwavePass);

    // Subsystems
    this.lightning = new ProceduralLightning(this.config);
    this.sparks = new ErraticSparks();
    
    this.impactLight = new THREE.PointLight(this.config.glowColor, 0, 20);
    this.impactLight.position.copy(this.config.target);

    this.scene.add(this.lightning.mesh);
    this.scene.add(this.sparks.mesh);
    this.scene.add(this.impactLight);
    
    window.addEventListener('resize', this.onResize);
    this.buildCinematicSequence();
  }

  // --- THE CINEMATIC CHOREOGRAPHY ---
  private buildCinematicSequence() {
    // 1. Anticipation (Atmospheric Charging)
    this.timeline.addPhase(0, () => {
      this.config.soundHook?.('charge');
      this.config.hapticHook?.('charge');
      this.targetTimeScale = 0.5; // Slight slow-mo
      
      // Floating pre-strike embers
      this.sparks.emit(this.config.target, 50, this.globalTime);
    }, (t) => {
      this.bloomPass.strength = THREE.MathUtils.lerp(0, 1.0, t);
    }, 800);

    // 2. THE MAIN STRIKE (Violent Discharge)
    this.timeline.addPhase(800, () => {
      this.config.soundHook?.('strike');
      this.config.hapticHook?.('heavy_strike');
      this.config.onStrike?.();

      this.targetTimeScale = 0.05; // MATRIX BULLET TIME
      this.cameraShake = 2.0;
      
      this.bloomPass.strength = 8.0; // Blinding flash
      this.shockwavePass.uniforms.uStrength.value = this.config.distortionStrength;
      this.impactLight.intensity = 50.0;

      // Generate the fractal lightning geometry
      this.lightning.generate(this.config.origin, this.config.target, this.config);
      
      // Massive spark eruption at impact
      this.sparks.emit(this.config.target, 500, this.globalTime);
    }, (t) => {
      // Lightning quickly unrolls from sky to ground
      const progress = Math.pow(t, 0.2); 
      // Intensity pulses wildly
      const intensity = Math.max(0, 1.0 - t) * (Math.sin(t * 100) * 0.2 + 0.8);
      
      this.lightning.update(this.globalTime, intensity * 2.0, progress);
      this.bloomPass.strength = THREE.MathUtils.lerp(8.0, this.config.bloomIntensity, t);
      
      // Expand shockwave distortion
      this.shockwavePass.uniforms.uStrength.value *= 0.95;
    }, 1000); // 1 sec in real-time, feels longer due to time scale

    // 3. Lingering Energy & Discharge
    this.timeline.addPhase(1800, () => {
      this.config.soundHook?.('crackle');
      this.config.hapticHook?.('rumble');
      this.targetTimeScale = 1.0; // Return to normal speed
    }, (t) => {
      // Fade out everything gracefully
      const fade = 1.0 - t;
      this.lightning.update(this.globalTime, fade * 0.5, 1.0);
      this.bloomPass.strength = THREE.MathUtils.lerp(this.config.bloomIntensity, 0, t);
      this.impactLight.intensity = fade * 10.0;
    }, 1500);

    // 4. Cleanup
    this.timeline.addPhase(3500, () => {
      this.dispose();
    });
  }

  public strike() {
    this.globalTime = 0;
    this.animFrame = requestAnimationFrame(this.renderLoop);
  }

  private renderLoop = () => {
    this.animFrame = requestAnimationFrame(this.renderLoop);
    const rawDelta = this.clock.getDelta();
    
    // Spring-based Time Dilation
    this.activeTimeScale += (this.targetTimeScale - this.activeTimeScale) * 8.0 * rawDelta;
    const scaledDelta = rawDelta * this.activeTimeScale;
    this.globalTime += scaledDelta;

    // Orchestrate Subsystems
    this.timeline.update(rawDelta * 1000); // Timeline uses unscaled time
    this.sparks.update(this.globalTime);
    this.shockwavePass.uniforms.uTime.value = this.globalTime;

   // Harmonic Spring Camera Shake
    if (this.cameraShake > 0.01) {
      this.camera.position.x = Math.sin(this.globalTime * 60) * this.cameraShake * 0.5;
      this.camera.position.y = 5 + Math.cos(this.globalTime * 50) * this.cameraShake * 0.5;
      this.cameraShake *= 0.85; // Rapid decay
    } else {
      this.camera.position.set(0, 5, 25);
    }

    this.composer.render();
  };

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  };

  public dispose() {
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this.onResize);
    
    // Memory Cleanup
    this.lightning.mesh.geometry.dispose();
    (this.lightning.mesh.material as THREE.Material).dispose();
    this.sparks.mesh.geometry.dispose();
    (this.sparks.mesh.material as THREE.Material).dispose();
    
    this.renderer.dispose();
    if (this.container.parentNode) this.container.parentNode.removeChild(this.container);
    this.config.onComplete?.();
  }
}

// ============================================================================
// PUBLIC API EXPORT
// ============================================================================

/**
 * Triggers a AAA-quality cinematic lightning strike effect.
 * @param customConfig Override default colors, positions, duration, and effects.
 * @returns The LightningEngine instance
 */
export const triggerLightningStrike = (customConfig?: Partial<LightningConfig>) => {
  const engine = new LightningEngine(customConfig);
  engine.strike();
  return engine;
}; 
