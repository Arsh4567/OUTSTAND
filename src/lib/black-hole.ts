import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// ============================================================================
// 1. CONFIGURATION & TYPES
// ============================================================================

export enum VFXQuality { LOW, MEDIUM, HIGH, ULTRA }

export interface SingularityConfig {
  quality: VFXQuality;
  position: THREE.Vector3;
  diskColorHot: number;   // Moving towards camera (Doppler Blue/White)
  diskColorCold: number;  // Moving away (Doppler Red/Orange)
  particleCount: number;
  mass: number;           // Controls gravitational lensing strength
  duration: number;
  bloomIntensity: number;
  onEventHorizon?: () => void;
  onCollapse?: () => void;
  soundHook?: (event: 'buildup' | 'ignition' | 'rumble' | 'evaporate') => void;
  hapticHook?: (event: 'subtle_pull' | 'snap' | 'heavy_rumble' | 'shockwave') => void;
}

const DEFAULT_CONFIG: SingularityConfig = {
  quality: VFXQuality.HIGH,
  position: new THREE.Vector3(0, 2, 0),
  diskColorHot: 0x00f3ff, // High-energy cyan/white
  diskColorCold: 0xff4400, // Deep orange/red
  particleCount: 15000,
  mass: 1.5,
  duration: 12000,
  bloomIntensity: 3.0,
};

// Zero-Allocation Math Cache
const MATH = {
  v1: new THREE.Vector3(),
  v2: new THREE.Vector3(),
  v3: new THREE.Vector3(),
  color1: new THREE.Color(),
  color2: new THREE.Color(),
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
// 3. GLSL SHADERS (Relativity & Plasma Physics)
// ============================================================================

const Shaders = {
  // Screen-Space Gravitational Lensing (Bends light around the black hole)
  GravitationalLensing: {
    uniforms: {
      tDiffuse: { value: null },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) }, // Screen UV coordinates of the black hole
      uMass: { value: 0.0 }, // Distortion strength
      uEventHorizon: { value: 0.05 }, // Black core radius in UV space
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 uCenter;
      uniform float uMass;
      uniform float uEventHorizon;
      varying vec2 vUv;
      
      void main() {
        vec2 dir = vUv - uCenter;
        // Correct aspect ratio distortion (assuming 16:9 roughly for math)
        dir.x *= 1.77; 
        float dist = length(dir);
        
        if (uMass <= 0.0) {
          gl_FragColor = texture2D(tDiffuse, vUv);
          return;
        }

        // The Event Horizon (Pitch Black Core)
        if (dist < uEventHorizon) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }

        // Einstein Ring / Gravitational Lensing math approximation
        // Space warp inversely proportional to distance from core
        float warp = uMass / (dist * dist + 0.01);
        vec2 warpDir = normalize(dir);
        
        // Chromatic Aberration caused by extreme gravity tearing light spectrums
        float ca = warp * 0.005;
        vec2 uvR = vUv - warpDir * (warp * 0.01 - ca);
        vec2 uvG = vUv - warpDir * (warp * 0.01);
        vec2 uvB = vUv - warpDir * (warp * 0.01 + ca);
        
        vec4 cr = texture2D(tDiffuse, uvR);
        vec4 cg = texture2D(tDiffuse, uvG);
        vec4 cb = texture2D(tDiffuse, uvB);
        
        gl_FragColor = vec4(cr.r, cg.g, cb.b, 1.0);
      }
    `
  },

  // Swirling Accretion Disk (Doppler Shifted Plasma)
  AccretionDisk: {
    uniforms: {
      uTime: { value: 0 },
      uColorHot: { value: new THREE.Color() },
      uColorCold: { value: new THREE.Color() },
      uIntensity: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() { 
        vUv = uv; 
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition; 
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColorHot;
      uniform vec3 uColorCold;
      uniform float uIntensity;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      // Simplex Noise
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.2113248, 0.366025, -0.57735, 0.02439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz - vec4(i1, 0.0, 0.0);
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.7928429 - 0.853734 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = vUv - 0.5;
        float r = length(uv) * 2.0; // 0 at center, 1 at edge
        float theta = atan(uv.y, uv.x);
        
        // Swirling vortex math
        float vortex = theta - r * 8.0 + uTime * 4.0;
        float noise = snoise(vec2(cos(vortex), sin(vortex)) * 4.0 - uTime);
        float fineNoise = snoise(vec2(cos(vortex), sin(vortex)) * 15.0 - uTime * 2.0);
        
        // Fake Doppler Effect (brighter/bluer on the side rotating toward camera)
        // Assuming rotation is on XZ plane and camera is roughly looking down Z
        float dopplerShift = sin(theta) * 0.5 + 0.5;
        vec3 baseColor = mix(uColorCold, uColorHot, dopplerShift);
        
        // Event horizon cutoff & soft outer fade
        float innerCutoff = smoothstep(0.2, 0.25, r);
        float outerFade = smoothstep(1.0, 0.4, r);
        
        float density = (noise * 0.5 + 0.5) * (fineNoise * 0.5 + 0.5);
        float alpha = innerCutoff * outerFade * density * uIntensity;

        // Glow boost
        gl_FragColor = vec4(baseColor * 3.0, alpha);
      }
    `
  }
};

// ============================================================================
// 4. GPU PARTICLE SYSTEM (Orbital Mechanics & Accretion)
// ============================================================================

class GPUOrbitalParticles {
  public mesh: THREE.Points;
  private maxParticles: number;

  constructor(maxParticles: number, center: THREE.Vector3) {
    this.maxParticles = maxParticles;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const lifeData = new Float32Array(maxParticles * 2); // [spawnTime, speedMultiplier]

    for (let i = 0; i < maxParticles; i++) {
      const i3 = i * 3;
      // Spawn in a massive spherical cloud
      const radius = Math.random() * 20 + 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      positions[i3] = center.x + radius * Math.sin(phi) * Math.cos(theta);
      positions[i3+1] = center.y + (radius * 0.2) * Math.sin(phi) * Math.sin(theta); // Flattened disk
      positions[i3+2] = center.z + radius * Math.cos(phi);

      lifeData[i * 2] = Math.random() * -10.0; // Random staggered start
      lifeData[i * 2 + 1] = Math.random() * 0.5 + 0.5; // Orbital speed variance
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('lifeData', new THREE.BufferAttribute(lifeData, 2));

    const mat = new THREE.ShaderMaterial({
      uniforms: { 
        uTime: { value: 0 }, 
        uCenter: { value: center },
        uPullStrength: { value: 0.0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uCenter;
        uniform float uPullStrength;
        
        attribute vec2 lifeData;
        varying float vAlpha;
        
        void main() {
          vec3 pos = position;
          vec3 dir = uCenter - pos;
          float dist = length(dir);
          vec3 normDir = normalize(dir);
          
          // Cross product with Up vector to get tangential (orbital) velocity
          vec3 up = vec3(0.0, 1.0, 0.0);
          vec3 tangent = normalize(cross(normDir, up));
          
          // Actual time alive for this particle
          float age = uTime - lifeData.x;
          
          // Orbital mechanics: 
          // 1. Move along tangent (orbit)
          // 2. Spiraling inward based on pull strength
          float orbitSpeed = 4.0 * lifeData.y / sqrt(dist);
          float inwardSpeed = uPullStrength * 5.0 / dist;
          
          // We cheat the integration by rotating the original position and scaling the radius
          float angle = age * orbitSpeed;
          float currentRadius = max(0.1, dist - (age * inwardSpeed));
          
          // Matrix-free rotation around Y axis
          float s = sin(angle);
          float c = cos(angle);
          vec3 offset = pos - uCenter;
          vec3 rotatedOffset = vec3(
            offset.x * c - offset.z * s,
            offset.y * 0.5, // flatten towards accretion disk plane
            offset.x * s + offset.z * c
          );
          
          // Scale down the radius as it gets sucked in
          vec3 finalPos = uCenter + normalize(rotatedOffset) * currentRadius;
          
          // Disappear instantly if crossing the event horizon
          if (currentRadius < 0.5) {
            gl_Position = vec4(9999.0);
            return;
          }
          
          // Heat up (glow) as it gets closer
          vAlpha = smoothstep(10.0, 1.0, currentRadius) * uPullStrength;

          vec4 mvPos = modelViewMatrix * vec4(finalPos, 1.0);
          gl_PointSize = (15.0 / -mvPos.z) * vAlpha;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          vec3 color = mix(vec3(1.0, 0.4, 0.0), vec3(0.0, 0.8, 1.0), vAlpha); // Orange to Hot Cyan
          gl_FragColor = vec4(color * 2.0, vAlpha * pow(1.0 - (d * 2.0), 2.0));
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.mesh = new THREE.Points(geo, mat);
    this.mesh.frustumCulled = false;
  }

  update(time: number, pullStrength: number) {
    const mat = this.mesh.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = time;
    mat.uniforms.uPullStrength.value = pullStrength;
  }
}

// ============================================================================
// 5. MAIN ENGINE ORCHESTRATOR
// ============================================================================

export class SingularityEngine {
  private config: SingularityConfig;
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private lensingPass: ShaderPass;
  
  private timeline = new TimelineController();
  private clock = new THREE.Clock();
  
  private accretionMesh: THREE.Mesh;
  private particles: GPUOrbitalParticles;

  // States
  private animFrame = 0;
  private globalTime = 0;
  private cameraShake = 0;
  private activeTimeScale = 1.0;
  private targetTimeScale = 1.0;

  constructor(config: Partial<SingularityConfig> = {}) {
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
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 4, 15);
    this.camera.lookAt(this.config.position);

    // Post-Processing (Bloom + Lensing)
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0, 0.5, 0.1);
    this.composer.addPass(this.bloomPass);

    this.lensingPass = new ShaderPass(Shaders.GravitationalLensing);
    this.composer.addPass(this.lensingPass);

    // 3D Meshes
    this.setupSingularity();
    
    window.addEventListener('resize', this.onResize);
    this.buildCinematicSequence();
  }

  private setupSingularity() {
    // 1. Accretion Disk
    const diskGeo = new THREE.PlaneGeometry(8, 8);
    const diskMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(Shaders.AccretionDisk.uniforms),
      vertexShader: Shaders.AccretionDisk.vertexShader,
      fragmentShader: Shaders.AccretionDisk.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    diskMat.uniforms.uColorHot.value.setHex(this.config.diskColorHot);
    diskMat.uniforms.uColorCold.value.setHex(this.config.diskColorCold);
    
    this.accretionMesh = new THREE.Mesh(diskGeo, diskMat);
    this.accretionMesh.position.copy(this.config.position);
    this.accretionMesh.rotation.x = -Math.PI / 2.5; // Tilted towards camera slightly
    this.scene.add(this.accretionMesh);

    // 2. Orbital Particles
    this.particles = new GPUOrbitalParticles(this.config.particleCount, this.config.position);
    this.scene.add(this.particles.mesh);
  }

  // --- THE CINEMATIC CHOREOGRAPHY ---
  private buildCinematicSequence() {
    // Phase 1: Environmental Distortion (Space begins to bend)
    this.timeline.addPhase(0, () => {
      this.config.soundHook?.('buildup');
      this.config.hapticHook?.('subtle_pull');
    }, (t) => {
      // Smoothly increase gravitational lensing mass
      const ease = t * t * (3.0 - 2.0 * t); // Smoothstep curve
      this.lensingPass.uniforms.uMass.value = ease * this.config.mass;
      // Start pulling particles slightly
      this.particles.update(this.globalTime, ease * 0.2);
    }, 3000);

    // Phase 2: Ignition & Event Horizon Formation
    this.timeline.addPhase(3000, () => {
      this.config.soundHook?.('ignition');
      this.config.hapticHook?.('snap');
      this.config.onEventHorizon?.();
      
      this.targetTimeScale = 0.05; // MATRIX BULLET TIME SNAP
      this.cameraShake = 1.0;
      this.bloomPass.strength = 8.0; // Blinding flash
      
      // Punch a hole in reality (Event Horizon core drops in)
      this.lensingPass.uniforms.uEventHorizon.value = 0.05; 
    }, (t) => {
      // Accretion disk ignites and spins up
      const pMat = this.accretionMesh.material as THREE.ShaderMaterial;
      pMat.uniforms.uIntensity.value = Math.pow(t, 0.5) * 1.5;
      
      this.bloomPass.strength = THREE.MathUtils.lerp(8.0, this.config.bloomIntensity, Math.pow(t, 0.2));
      this.particles.update(this.globalTime, THREE.MathUtils.lerp(0.2, 1.0, t));
    }, 1500);

    // Phase 3: Stabilized Singularity (Idle Rumble)
    this.timeline.addPhase(4500, () => {
      this.config.soundHook?.('rumble');
      this.config.hapticHook?.('heavy_rumble');
      this.targetTimeScale = 1.0; // Return to normal time
    }, (t) => {
      // Continuous violent pull
      this.cameraShake = (Math.sin(this.globalTime * 10) * 0.05) + 0.05;
      this.particles.update(this.globalTime, 1.0);
      
      // Accretion disk breathes
      const pMat = this.accretionMesh.material as THREE.ShaderMaterial;
      pMat.uniforms.uIntensity.value = 1.5 + Math.sin(this.globalTime * 5.0) * 0.2;
    }, this.config.duration - 4500);

    // Phase 4: Evaporation / Collapse (Hawking Radiation Burst)
    this.timeline.addPhase(this.config.duration, () => {
      this.config.soundHook?.('evaporate');
      this.config.hapticHook?.('shockwave');
      this.config.onCollapse?.();
      
      this.targetTimeScale = 2.0; // Fast forward
      this.cameraShake = 2.0;
      this.bloomPass.strength = 10.0;
    }, (t) => {
      // Snap distortion and core back to zero
      const inv = 1.0 - t;
      this.lensingPass.uniforms.uMass.value = inv * this.config.mass;
      this.lensingPass.uniforms.uEventHorizon.value = inv * 0.05;
      
      const pMat = this.accretionMesh.material as THREE.ShaderMaterial;
      pMat.uniforms.uIntensity.value = inv * 1.5;
      
      this.bloomPass.strength = THREE.MathUtils.lerp(10.0, 0, Math.pow(t, 2.0));
    }, 1000);

    // Phase 5: Cleanup
    this.timeline.addPhase(this.config.duration + 1500, () => {
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
    
    // Spring Time Dilation
    this.activeTimeScale += (this.targetTimeScale - this.activeTimeScale) * 5.0 * rawDelta;
    const scaledDelta = rawDelta * this.activeTimeScale;
    this.globalTime += scaledDelta;

    // Timeline execution
    this.timeline.update(rawDelta * 1000);

    // Update Accretion Disk Shader Time
    (this.accretionMesh.material as THREE.ShaderMaterial).uniforms.uTime.value = this.globalTime;

    // --- Dynamic Gravitational Lensing Center ---
    // Project the 3D position of the black hole into 2D screen UV space.
    // This ensures the distortion stays perfectly attached to the core even if the camera shakes.
    MATH.v1.copy(this.config.position).project(this.camera);
    // Project returns [-1, 1], map it to UV [0, 1]
    this.lensingPass.uniforms.uCenter.value.set((MATH.v1.x + 1) / 2, (MATH.v1.y + 1) / 2);

      // Harmonic Spring Camera Shake
    if (this.cameraShake > 0.01) {
      this.camera.position.x = Math.sin(this.globalTime * 40) * this.cameraShake * 0.3;
      this.camera.position.y = 4 + Math.cos(this.globalTime * 35) * this.cameraShake * 0.3;
      this.camera.lookAt(this.config.position);
      
      // Only decay if we are not in the sustained idle phase
      if (this.timeline.time > 4.5 && this.timeline.time < this.config.duration / 1000) {
        // Sustained shake
      } else {
        this.cameraShake *= 0.9; 
      }
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
    
    // Rigorous Memory Cleanup
    this.accretionMesh.geometry.dispose();
    (this.accretionMesh.material as THREE.Material).dispose();
    this.particles.mesh.geometry.dispose();
    (this.particles.mesh.material as THREE.Material).dispose();
    
    this.renderer.dispose();
    if (this.container.parentNode) this.container.parentNode.removeChild(this.container);
  }
}

// ============================================================================
// PUBLIC API EXPORT
// ============================================================================

/**
 * Triggers a AAA-quality cinematic Black Hole / Singularity effect.
 * @param customConfig Override default colors, mass, duration, and hooks.
 * @returns The SingularityEngine instance
 */
export const triggerSingularity = (customConfig?: Partial<SingularityConfig>) => {
  const engine = new SingularityEngine(customConfig);
  engine.activate();
  return engine;
};
