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

  /**
   * Optional existing DOM container.
   * If supplied, the engine mounts its WebGL canvas here.
   */
  container?: HTMLDivElement;

  onOpen?: () => void;
  onClose?: () => void;
  soundHook?: (event: 'gather' | 'tear' | 'hum' | 'collapse') => void;
  hapticHook?: (event: 'rumble' | 'snap' | 'shockwave') => void;
}

const DEFAULT_CONFIG: PortalConfig = {
  quality: Quality.HIGH,
  coreColors: [0x05001a, 0x1a0040], // Deep void purples
  edgeColors: [0x00ffff, 0x9d00ff], // Cyan and Neon Purple
  duration: 10000,
  particleCount: 15000,
  bloomIntensity: 2.5,
  distortionStrength: 0.15,
};

// Zero-Allocation Math Cache
const MATH = {
  vec3: new THREE.Vector3(),
  color: new THREE.Color(),
  dummy: new THREE.Object3D(),
};

// ============================================================================
// 2. TIMELINE CONTROLLER (Cinematic Sequencing)
// ============================================================================

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
        // Normalized local time (0.0 to 1.0) for this specific phase
        e.update((this.time - e.time) / e.duration);
      }
    }
  }
}

// ============================================================================
// 3. GLSL SHADER MANAGER
// ============================================================================

const Shaders = {
  // The Portal Rift: Uses Polar Coordinates, fBm noise, and Alpha erosion
  PortalVortex: {
    uniforms: {
      uTime: { value: 0 },
      uPhase: { value: 0 }, // 0 = closed, 1 = fully open
      uColorInner: { value: new THREE.Color(0x05001a) },
      uColorOuter: { value: new THREE.Color(0x00ffff) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uPhase;
      uniform vec3 uColorInner;
      uniform vec3 uColorOuter;
      varying vec2 vUv;

      // Classic Simplex 2D Noise
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
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
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        // Center UV and convert to polar coordinates
        vec2 uv = vUv - 0.5;
        float dist = length(uv) * 2.0;
        
        // Shape the rift (oval vertically)
        uv.x *= 1.5; 
        float ovalDist = length(uv) * 2.0;

        // Swirling vortex math
        float angle = atan(uv.y, uv.x);
        float vortex = angle - dist * 4.0 + uTime * 3.0; // Twist and rotate
        
        // Sample noise along the spiral
        float noise = snoise(vec2(cos(vortex), sin(vortex)) * 2.0 - uTime * 0.5);
        
        // Edge erosion based on phase (cinematic tearing)
        float edge = smoothstep(1.0, 0.8, ovalDist + noise * 0.2);
        float mask = smoothstep(1.0 - uPhase, 1.05 - uPhase, edge); // Tear opens from center
        
        // Color mapping (deep void in center, bright rim)
        vec3 finalColor = mix(uColorInner, uColorOuter, smoothstep(0.0, 0.8, ovalDist));
        finalColor += max(0.0, noise * 0.5) * uColorOuter; // Add energy wisps
        
        // Intense glowing rim
        float rim = smoothstep(0.8, 1.0, ovalDist) * mask;
        finalColor += uColorOuter * rim * 3.0;

        if(mask <= 0.01) discard; // Optimize rendering

        gl_FragColor = vec4(finalColor, mask * smoothstep(1.0, 0.9, ovalDist));
      }
    `
  },
  
  // Screen-Space Gravitational Lensing (Heat Ripple / Space Warp)
  SpaceDistortion: {
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uStrength: { value: 0 },
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform float uStrength;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5);
        float dist = distance(uv, center);
        
        // Ripple effect originating from center
        float ripple = sin(dist * 20.0 - uTime * 10.0) * exp(-dist * 5.0);
        
        // Lens distortion (gravitational pull)
        vec2 offset = uv - center;
float offsetLength = length(offset);
vec2 dir = offsetLength > 0.0001
  ? offset / offsetLength
  : vec2(0.0);
        vec2 distortedUv = uv + dir * ripple * uStrength;
        
        gl_FragColor = texture2D(tDiffuse, mix(uv, distortedUv, uStrength));
      }
    `
  }
};

// ============================================================================
// 4. GPU PARTICLE SYSTEM (Sparks & Magic Dust)
// ============================================================================

class GPUVFXParticles {
  public mesh: THREE.Points;
  private maxParticles: number;
  private cursor = 0;

  constructor(maxParticles: number) {
    this.maxParticles = maxParticles;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxParticles * 3), 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(new Float32Array(maxParticles * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxParticles * 3), 3));
    geo.setAttribute('lifeData', new THREE.BufferAttribute(new Float32Array(maxParticles * 2), 2)); // [start, lifespan]

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uGravity: { value: -2.0 } },
      vertexShader: `
        uniform float uTime;
        uniform float uGravity;
        attribute vec3 velocity;
        attribute vec3 color;
        attribute vec2 lifeData;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          float age = max(0.0, uTime - lifeData.x);
          float lifePct = age / lifeData.y;
          
          if (age > lifeData.y || lifeData.x == 0.0) { gl_Position = vec4(9999.0); return; }
          
          // Orbital + Fluid drag physics on GPU
          vec3 pos = position;
          pos += velocity * age * exp(-age * 1.2); 
          pos.y += uGravity * age * age; // Gravity drop
          
          vColor = color;
          // AAA fade curve: quick fade in, slow fade out
          vAlpha = smoothstep(0.0, 0.1, lifePct) * smoothstep(1.0, 0.6, lifePct);
          
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (12.0 / -mvPos.z) * vAlpha;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          gl_FragColor = vec4(vColor * 2.0, vAlpha * pow(1.0 - (d * 2.0), 1.5));
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.mesh = new THREE.Points(geo, mat);
    this.mesh.frustumCulled = false;
  }

  emit(count: number, center: THREE.Vector3, time: number, colorHex: number, speed: number, flowInward = false) {
    const pos = this.mesh.geometry.attributes.position.array as Float32Array;
    const vel = this.mesh.geometry.attributes.velocity.array as Float32Array;
    const col = this.mesh.geometry.attributes.color.array as Float32Array;
    const life = this.mesh.geometry.attributes.lifeData.array as Float32Array;
    MATH.color.setHex(colorHex);

    for (let i = 0; i < count; i++) {
      const idx = this.cursor % this.maxParticles;
      const i3 = idx * 3, i2 = idx * 2;

      // Spawn in a radius
      const radius = Math.random() * 3 + 1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      const spawnX = center.x + radius * Math.sin(phi) * Math.cos(theta);
      const spawnY = center.y + radius * Math.sin(phi) * Math.sin(theta);
      const spawnZ = center.z + radius * Math.cos(phi);

      pos[i3] = spawnX; pos[i3+1] = spawnY; pos[i3+2] = spawnZ;
      
      // Calculate velocity vector
      if (flowInward) {
        // Anticipation phase: suck into center
        vel[i3] = (center.x - spawnX) * speed;
        vel[i3+1] = (center.y - spawnY) * speed;
        vel[i3+2] = (center.z - spawnZ) * speed;
      } else {
        // Explosion phase: burst outward
        vel[i3] = (spawnX - center.x) * speed;
        vel[i3+1] = (spawnY - center.y) * speed;
        vel[i3+2] = (spawnZ - center.z) * speed;
      }

      col[i3] = MATH.color.r; col[i3+1] = MATH.color.g; col[i3+2] = MATH.color.b;
      life[i2] = time;
      life[i2+1] = Math.random() * 1.5 + 1.0; // 1 to 2.5s lifespan

      this.cursor++;
    }
    
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.velocity.needsUpdate = true;
    this.mesh.geometry.attributes.color.needsUpdate = true;
    this.mesh.geometry.attributes.lifeData.needsUpdate = true;
  }

  update(time: number) { (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = time; }
}

// ============================================================================
// 5. THE PORTAL ENGINE (Orchestrator)
// ============================================================================

export class PortalEngine {
  private config: PortalConfig;
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  private ppComposer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private distortionPass: ShaderPass;
  
  private timeline = new TimelineController();
  private clock = new THREE.Clock();
  
  private sparks: GPUVFXParticles;
  private portalMesh: THREE.Mesh;
  private shockwaveMesh: THREE.Mesh;

  // States
  private animFrame = 0;
  private globalTime = 0;
  private cameraShake = 0;
  private activeTimeScale = 1.0;
  private targetTimeScale = 1.0;

  constructor(config: Partial<PortalConfig> = {}) {
  this.config = { ...DEFAULT_CONFIG, ...config };

  // WebGL Setup
  if (this.config.container) {
    this.container = this.config.container;

    Object.assign(this.container.style, {
      position: 'absolute',
      inset: '0',
      overflow: 'hidden',
      pointerEvents: 'none',
    });
  } else {
    this.container = document.createElement('div');

    Object.assign(this.container.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '9999',
    });

    document.body.appendChild(this.container);
  }

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 0, 10);

    // Subsystems
    this.setupPostProcessing();
    this.setupMeshes();
    
    window.addEventListener('resize', this.onResize);
    this.buildCinematicSequence();
  }

  private setupPostProcessing() {
    this.ppComposer = new EffectComposer(this.renderer);
    this.ppComposer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.config.bloomIntensity, 0.5, 0.1);
    this.ppComposer.addPass(this.bloomPass);

    this.distortionPass = new ShaderPass(Shaders.SpaceDistortion);
    this.ppComposer.addPass(this.distortionPass);
  }

  private setupMeshes() {
    // 1. Particle System
    this.sparks = new GPUVFXParticles(this.config.particleCount);
    this.scene.add(this.sparks.mesh);

    // 2. The Main Portal Rift
    const portalGeo = new THREE.PlaneGeometry(8, 8);
    const portalMat = new THREE.ShaderMaterial({
      uniforms: Shaders.PortalVortex.uniforms,
      vertexShader: Shaders.PortalVortex.vertexShader,
      fragmentShader: Shaders.PortalVortex.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    portalMat.uniforms.uColorInner.value = new THREE.Color(this.config.coreColors[0]);
    portalMat.uniforms.uColorOuter.value = new THREE.Color(this.config.edgeColors[0]);
    this.portalMesh = new THREE.Mesh(portalGeo, portalMat);
    this.scene.add(this.portalMesh);

    // 3. Shockwave Ring
    const ringGeo = new THREE.TorusGeometry(1, 0.02, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: this.config.edgeColors[0], transparent: true, blending: THREE.AdditiveBlending });
    this.shockwaveMesh = new THREE.Mesh(ringGeo, ringMat);
    this.shockwaveMesh.visible = false;
    this.scene.add(this.shockwaveMesh);
  }

  // --- THE CINEMATIC CHOREOGRAPHY ---
  private buildCinematicSequence() {
    // Phase 1: Anticipation (Energy Gathering)
    this.timeline.addPhase(0, () => {
      this.config.soundHook?.('gather');
      this.config.hapticHook?.('rumble');
      this.targetTimeScale = 0.5; // Slight slow-mo tension
    }, (t) => {
      // Suck particles inward constantly during gather
      if (Math.random() > 0.5) {
        this.sparks.emit(50, MATH.vec3.set(0,0,0), this.globalTime, this.config.edgeColors[1], 3.0, true);
      }
      this.distortionPass.uniforms.uStrength.value = THREE.MathUtils.lerp(0, 0.05, t);
    }, 1500);

    // Phase 2: The Dimensional Tear (Impact)
    this.timeline.addPhase(1500, () => {
      this.config.soundHook?.('tear');
      this.config.hapticHook?.('snap');
      this.targetTimeScale = 0.05; // MATRIX BULLET TIME
      this.cameraShake = 1.0;
      
      this.bloomPass.strength = 6.0; // Flash
      this.distortionPass.uniforms.uStrength.value = this.config.distortionStrength;

      // Massive particle burst outward
      this.sparks.emit(3000, MATH.vec3.set(0,0,0), this.globalTime, this.config.edgeColors[0], 8.0, false);
      
      // Trigger Shockwave
      this.shockwaveMesh.visible = true;
      this.shockwaveMesh.scale.set(0.1, 0.1, 0.1);
      (this.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 1;
    }, (t) => {
      // Spring recovery from impact
      this.bloomPass.strength = THREE.MathUtils.lerp(6.0, this.config.bloomIntensity, t);
      
      // Expand shockwave
      const scale = 1.0 + Math.pow(t, 0.5) * 20.0;
      this.shockwaveMesh.scale.set(scale, scale, scale);
      (this.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 1.0 - t;

      // Tear portal open (Custom shader phase)
      (this.portalMesh.material as THREE.ShaderMaterial).uniforms.uPhase.value = THREE.MathUtils.lerp(0, 1, Math.pow(t, 0.3)); // Fast open, slow settle
    }, 1500); // Bullet time lasts longer in real-time

    // Phase 3: Active Stabilization & Idle
    this.timeline.addPhase(3000, () => {
      this.config.soundHook?.('hum');
      this.targetTimeScale = 1.0; // Return to normal speed
      this.shockwaveMesh.visible = false;
      this.config.onOpen?.();
    }, (t) => {
      // Idle ambient particle emission
      if (Math.random() > 0.7) {
        this.sparks.emit(10, MATH.vec3.set(0,0,0), this.globalTime, this.config.edgeColors[0], 2.0, false);
      }
      // Gentle breathing distortion
      this.distortionPass.uniforms.uStrength.value = (Math.sin(this.globalTime * 2.0) * 0.02) + 0.05;
    }, this.config.duration);

    // Phase 4: Collapse & Implosion
    this.timeline.addPhase(3000 + this.config.duration, () => {
      this.config.soundHook?.('collapse');
      this.config.hapticHook?.('shockwave');
      this.targetTimeScale = 2.0; // Speed up time as it collapses
      this.cameraShake = 0.5;
      this.bloomPass.strength = 8.0; // Final flash
    }, (t) => {
      (this.portalMesh.material as THREE.ShaderMaterial).uniforms.uPhase.value = THREE.MathUtils.lerp(1, 0, Math.pow(t, 2.0));
      this.bloomPass.strength = THREE.MathUtils.lerp(8.0, 0, t);
      this.distortionPass.uniforms.uStrength.value = THREE.MathUtils.lerp(0.05, 0, t);
    }, 1000);

    // Phase 5: Cleanup
    this.timeline.addPhase(4000 + this.config.duration, () => {
      this.dispose();
    });
  }

  public open() {
    this.globalTime = 0;
    this.animFrame = requestAnimationFrame(this.renderLoop);
  }

  private renderLoop = () => {
    this.animFrame = requestAnimationFrame(this.renderLoop);
    const rawDelta = this.clock.getDelta();
    
    // Spring-based Time Dilation interpolation
    this.activeTimeScale += (this.targetTimeScale - this.activeTimeScale) * 5.0 * rawDelta;
    const scaledDelta = rawDelta * this.activeTimeScale;
    this.globalTime += scaledDelta;

    // Orchestrate Systems
    this.timeline.update(rawDelta); // Timeline reads unscaled real-time
    this.sparks.update(this.globalTime);
    
    // Update Shader Uniforms
    const pMat = this.portalMesh.material as THREE.ShaderMaterial;
    pMat.uniforms.uTime.value = this.globalTime;
    this.distortionPass.uniforms.uTime.value = this.globalTime;

    // Harmonic Camera Shake
    if (this.cameraShake > 0.01) {
      this.camera.position.x = Math.sin(this.globalTime * 50) * this.cameraShake * 0.2;
      this.camera.position.y = Math.cos(this.globalTime * 43) * this.cameraShake * 0.2;
      this.cameraShake *= 0.9; // Decay
    } else {
      this.camera.position.set(0, 0, 10);
    }

    this.ppComposer.render();
  };

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.ppComposer.setSize(window.innerWidth, window.innerHeight);
  };

  public dispose() {
    cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this.onResize);
    
    // Rigorous Memory Cleanup
    this.portalMesh.geometry.dispose();
    (this.portalMesh.material as THREE.Material).dispose();
    this.sparks.mesh.geometry.dispose();
    (this.sparks.mesh.material as THREE.Material).dispose();
    this.shockwaveMesh.geometry.dispose();
    (this.shockwaveMesh.material as THREE.Material).dispose();
    
    this.renderer.dispose();
    if (this.container.parentNode) this.container.parentNode.removeChild(this.container);
    this.config.onClose?.();
  }
}

// ============================================================================
// PUBLIC API EXPORT
// ============================================================================

/**
 * Triggers a AAA-quality cinematic portal opening effect.
 * @param customConfig Override default colors, duration, and effects.
 * @returns The PortalEngine instance (allowing manual abort via engine.dispose())
 */
export const triggerDimensionalRift = (customConfig?: Partial<PortalConfig>) => {
  const engine = new PortalEngine(customConfig);
  engine.open();
  return engine;
};
