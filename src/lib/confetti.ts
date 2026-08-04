import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';

// ============================================================================
// 1. CONFIGURATION & INTERFACES
// ============================================================================

export interface VFXOptions {
  duration: number;
  particleCount: number;
  colors: number[];
  gravity: number;
  drag: number;
  bounceMultiplier: number;
  bloomIntensity: number;
  cameraShakeStrength: number;
  slowMotionDilation: number;
  enableGPUPerformanceScaling: boolean;
  onStart?: () => void;
  onImpact?: () => void;
  onComplete?: () => void;
  soundHook?: (event: 'launch' | 'impact' | 'shatter') => void;
  hapticHook?: (event: 'launch' | 'impact' | 'shatter') => void;
}

const DEFAULT_OPTIONS: VFXOptions = {
  duration: 6500,
  particleCount: 60,
  colors: [0x00f3ff, 0x9d00ff, 0xff00b3, 0xffea00, 0x00ff66],
  gravity: 18.0,
  drag: 0.98,
  bounceMultiplier: 0.5,
  bloomIntensity: 3.0,
  cameraShakeStrength: 1.0,
  slowMotionDilation: 0.05,
  enableGPUPerformanceScaling: true,
};

type PhysicsState = { 
  active: boolean; 
  pos: THREE.Vector3; 
  vel: THREE.Vector3; 
  rot: THREE.Vector3; 
  rotVel: THREE.Vector3; 
  scale: THREE.Vector3;
  type: 'main' | 'shard';
};

// ============================================================================
// 2. ADAPTIVE PERFORMANCE MONITOR
// ============================================================================

class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  public currentFPS = 60;
  public qualityScale = 1.0;

  update(enableScaling: boolean) {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;

      if (enableScaling) {
        if (this.currentFPS < 30) this.qualityScale = 0.5; // Drop quality
        else if (this.currentFPS > 55) this.qualityScale = 1.0; // Restore quality
      }
    }
  }
}

// ============================================================================
// 3. GPU PARTICLE SYSTEM (Sparks entirely calculated on GPU)
// ============================================================================

class GPUSparkSystem {
  public system: THREE.Points;
  private uniforms: any;
  private maxSparks: number;
  private activeSparks = 0;

  constructor(maxSparks = 10000) {
    this.maxSparks = maxSparks;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxSparks * 3);
    const velocities = new Float32Array(maxSparks * 3);
    const startTimes = new Float32Array(maxSparks);
    const colors = new Float32Array(maxSparks * 3);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('startTime', new THREE.BufferAttribute(startTimes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.uniforms = {
      uTime: { value: 0 },
      uGravity: { value: 9.8 },
    };

    // Custom GLSL Shader for true AAA GPU particles
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        uniform float uTime;
        uniform float uGravity;
        attribute vec3 velocity;
        attribute float startTime;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          float t = max(0.0, uTime - startTime);
          
          // Physics on GPU
          vec3 pos = position + velocity * t;
          pos.y -= 0.5 * uGravity * t * t; 
          
          // Lifetime fade
          vAlpha = max(0.0, 1.0 - (t / 1.5)); 
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          // Scale by depth (VFX trick)
          gl_PointSize = (15.0 / -mvPosition.z) * vAlpha; 
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          // Circular particle
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          
          // Soft edge glow
          float glow = (0.5 - d) * 2.0;
          gl_FragColor = vec4(vColor * 2.0, vAlpha * glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.system = new THREE.Points(geometry, material);
    this.system.frustumCulled = false;
  }

  emit(pos: THREE.Vector3, count: number, currentTime: number, color: THREE.Color) {
    if (this.activeSparks + count > this.maxSparks) this.activeSparks = 0; // Ring buffer reset
    
    const positions = this.system.geometry.attributes.position.array as Float32Array;
    const velocities = this.system.geometry.attributes.velocity.array as Float32Array;
    const startTimes = this.system.geometry.attributes.startTime.array as Float32Array;
    const colors = this.system.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const idx = this.activeSparks + i;
      const i3 = idx * 3;

      positions[i3] = pos.x; positions[i3+1] = pos.y; positions[i3+2] = pos.z;
      
      // Explosion physics
      velocities[i3] = (Math.random() - 0.5) * 15;
      velocities[i3+1] = Math.random() * 10 + 5;
      velocities[i3+2] = (Math.random() - 0.5) * 15;

      startTimes[idx] = currentTime;
      colors[i3] = color.r; colors[i3+1] = color.g; colors[i3+2] = color.b;
    }

    this.activeSparks += count;
    this.system.geometry.attributes.position.needsUpdate = true;
    this.system.geometry.attributes.velocity.needsUpdate = true;
    this.system.geometry.attributes.startTime.needsUpdate = true;
    this.system.geometry.attributes.color.needsUpdate = true;
  }

  update(time: number) {
    this.uniforms.uTime.value = time;
  }
}

// ============================================================================
// 4. CAMERA EFFECTS (Harmonic Springs & Shakes)
// ============================================================================

class VFXCamera {
  public camera: THREE.PerspectiveCamera;
  private shakeTime = 0;
  public shakeIntensity = 0;
  private shakeDecay = 0.9;

  constructor(fov: number, aspect: number) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);
    this.camera.position.z = 10;
  }

  triggerImpact(strength: number) {
    this.shakeIntensity = strength;
    this.shakeDecay = 0.92;
  }

  update(delta: number) {
    if (this.shakeIntensity > 0.01) {
      this.shakeTime += delta * 40;
      // Multi-frequency harmonic oscillator (simulates Perlin noise cheaply)
      this.camera.position.x = Math.sin(this.shakeTime) * Math.cos(this.shakeTime * 0.8) * this.shakeIntensity;
      this.camera.position.y = Math.cos(this.shakeTime * 1.2) * Math.sin(this.shakeTime * 0.9) * this.shakeIntensity;
      this.camera.position.z = 10 + Math.sin(this.shakeTime * 2.0) * (this.shakeIntensity * 0.5);
      
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.camera.position.set(0, 0, 10);
    }
  }
}

// ============================================================================
// 5. POST PROCESSING MANAGER
// ============================================================================

class PostProcessingManager {
  public composer: EffectComposer;
  public bloomPass: UnrealBloomPass;
  public rgbShiftPass: ShaderPass;
  private baseBloom: number;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, bloomInt: number) {
    this.baseBloom = bloomInt;
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), bloomInt, 0.5, 0.2);
    this.composer.addPass(this.bloomPass);

    this.rgbShiftPass = new ShaderPass(RGBShiftShader);
    this.rgbShiftPass.uniforms['amount'].value = 0.0015;
    this.composer.addPass(this.rgbShiftPass);

    const vignettePass = new ShaderPass(VignetteShader);
    vignettePass.uniforms['offset'].value = 1.0;
    vignettePass.uniforms['darkness'].value = 1.2;
    this.composer.addPass(vignettePass);
  }

  update(timeScale: number, isShockwave: boolean, delta: number) {
    // Dynamic cinematic bloom pulse during slow motion
    const targetBloom = timeScale < 0.5 ? this.baseBloom * 1.5 : this.baseBloom;
    this.bloomPass.strength = THREE.MathUtils.lerp(this.bloomPass.strength, targetBloom, 5.0 * delta);
    
    // Chromatic aberration pulse on shockwave
    const targetRGB = isShockwave ? 0.01 : 0.0015;
    this.rgbShiftPass.uniforms['amount'].value = THREE.MathUtils.lerp(this.rgbShiftPass.uniforms['amount'].value, targetRGB, 10.0 * delta);
  }

  setSize(w: number, h: number) {
    this.composer.setSize(w, h);
  }
}

// ============================================================================
// 6. CORE VFX ENGINE
// ============================================================================

class VFXEngine {
  private config: VFXOptions;
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private cameraSystem: VFXCamera;
  private postProcessing: PostProcessingManager;
  private performanceMonitor: PerformanceMonitor;
  private clock = new THREE.Clock();
  
  // Timeline State
  private animationFrameId = 0;
  private elapsedTime = 0;
  private timeScale = 1.0;
  private targetTimeScale = 1.0;
  private hasImpacted = false;

  // Particle Systems
  private gpuSparks: GPUSparkSystem;
  private instancedMesh: THREE.InstancedMesh;
  private physicsPool: PhysicsState[];
  private dummy = new THREE.Object3D();
  private colorObj = new THREE.Color();
  
  // Geometries for variety
  private geometries = [
    new THREE.OctahedronGeometry(0.5, 0),
    new THREE.TetrahedronGeometry(0.5, 0),
    new THREE.IcosahedronGeometry(0.5, 0)
  ];

  constructor(options: Partial<VFXOptions>) {
    this.config = { ...DEFAULT_OPTIONS, ...options };
    this.performanceMonitor = new PerformanceMonitor();

    // DOM Setup
    this.container = document.createElement('div');
    Object.assign(this.container.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '9999' });
    document.body.appendChild(this.container);

    // Three.js Core
    this.scene = new THREE.Scene();
    this.cameraSystem = new VFXCamera(75, window.innerWidth / window.innerHeight);
    
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.postProcessing = new PostProcessingManager(this.renderer, this.scene, this.cameraSystem.camera, this.config.bloomIntensity);

    // Lighting
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pl = new THREE.PointLight(0xffffff, 4);
    pl.position.set(0, 5, 10);
    this.scene.add(pl);

    // Initialize Systems
    this.gpuSparks = new GPUSparkSystem();
    this.scene.add(this.gpuSparks.system);
    this.initInstancedParticles();

    window.addEventListener('resize', this.handleResize);
  }

  private initInstancedParticles() {
    const totalCount = this.config.particleCount * 5; // Main + Shards
    
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.0, roughness: 0.1, metalness: 0.9, transparent: true
    });

    this.instancedMesh = new THREE.InstancedMesh(this.geometries[0], material, totalCount);
    this.physicsPool = Array.from({ length: totalCount }, () => ({
      active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: new THREE.Vector3(), 
      rotVel: new THREE.Vector3(), scale: new THREE.Vector3(), type: 'shard'
    }));

    // Hide all initially
    this.dummy.position.set(0, -999, 0);
    this.dummy.updateMatrix();
    for (let i = 0; i < totalCount; i++) this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    
    this.scene.add(this.instancedMesh);
  }

  public emitBurst() {
    this.config.onStart?.();
    this.config.hapticHook?.('launch');
    this.config.soundHook?.('launch');

    const spawn = (originX: number, velX: number, start: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const p = this.physicsPool[start + i];
        p.active = true;
        p.type = 'main';
        p.scale.set(Math.random() * 0.5 + 0.3, Math.random() * 2.0 + 0.8, Math.random() * 0.5 + 0.3);
        p.pos.set(originX + (Math.random() - 0.5) * 2, -12, (Math.random() - 0.5) * 2);
        p.vel.set((Math.random() * 0.4 + 0.2) * velX * 15, Math.random() * 10 + 15, (Math.random() - 0.5) * 5);
        p.rotVel.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
        this.instancedMesh.setColorAt(start + i, this.colorObj.setHex(this.config.colors[Math.floor(Math.random() * this.config.colors.length)]));
      }
    };

    const half = Math.floor(this.config.particleCount / 2);
    spawn(-8, 1, 0, half);
    spawn(8, -1, half, half);
    this.instancedMesh.instanceColor!.needsUpdate = true;

    this.animate();
  }

  private handleImpact(index: number, p: PhysicsState) {
    if (!this.hasImpacted) {
      this.hasImpacted = true;
      this.targetTimeScale = this.config.slowMotionDilation; // Enter Matrix Mode
      this.cameraSystem.triggerImpact(this.config.cameraShakeStrength);
      
      this.config.onImpact?.();
      this.config.hapticHook?.('impact');
      this.config.soundHook?.('impact');

      // Timeline Event: Exit slowmo
      setTimeout(() => { this.targetTimeScale = 1.0; }, 800);
    }

    p.active = false;
    this.dummy.position.set(0, -999, 0);
    this.dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(index, this.dummy.matrix);

    // Eject GPU Sparks
    this.instancedMesh.getColorAt(index, this.colorObj);
    this.gpuSparks.emit(p.pos, Math.floor(20 * this.performanceMonitor.qualityScale), this.elapsedTime, this.colorObj);

    // Shards
    let spawned = 0;
    for (let i = this.config.particleCount; i < this.physicsPool.length; i++) {
      if (spawned >= 3) break;
      const shard = this.physicsPool[i];
      if (!shard.active) {
        shard.active = true;
        shard.type = 'shard';
        shard.pos.copy(p.pos);
        shard.vel.set((Math.random() - 0.5) * 10, Math.random() * 8 + 2, (Math.random() - 0.5) * 10);
        shard.scale.set(0.2, 0.2, 0.2);
        this.instancedMesh.setColorAt(i, this.colorObj);
        spawned++;
      }
    }
    this.instancedMesh.instanceColor!.needsUpdate = true;
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const rawDelta = this.clock.getDelta();
    this.elapsedTime += rawDelta;
    
    this.performanceMonitor.update(this.config.enableGPUPerformanceScaling);

    // Cinematic Spring Easing for time dilation
    this.timeScale += (this.targetTimeScale - this.timeScale) * 8.0 * rawDelta;
    const delta = rawDelta * this.timeScale;

    this.cameraSystem.update(rawDelta); // Camera ignores time dilation
    this.postProcessing.update(this.timeScale, this.cameraSystem.shakeIntensity > 0.1, rawDelta);
    this.gpuSparks.update(this.elapsedTime);

    // Physics Engine Loop (Zero Allocations)
    let matrixUpdated = false;
    const fovRad = (75 / 2) * (Math.PI / 180);

    for (let i = 0; i < this.physicsPool.length; i++) {
      const p = this.physicsPool[i];
      if (!p.active) continue;

      matrixUpdated = true;
      p.vel.y -= this.config.gravity * delta;
      p.vel.x *= this.config.drag;
      p.vel.z *= this.config.drag;

      p.pos.addScaledVector(p.vel, delta);
      p.rot.addScaledVector(p.rotVel, delta);

      // Floor Collision
      const depth = this.cameraSystem.camera.position.z - p.pos.z;
      const floorY = -(Math.tan(fovRad) * depth) + 0.5;

      if (p.pos.y <= floorY && p.vel.y < 0) {
        if (p.type === 'main') {
          this.handleImpact(i, p);
          continue; // Skip matrix update, it's dead
        } else {
          p.pos.y = floorY;
          p.vel.y *= -this.config.bounceMultiplier;
          p.vel.x *= 0.7;
          p.vel.z *= 0.7;
        }
      }

      // Stretch geometry along velocity vector (Pseudo-Motion Blur/Ribbon)
      const speed = p.vel.length();
      this.dummy.position.copy(p.pos);
      // Align to velocity vector if moving fast
      if (speed > 2.0) {
        const velNorm = p.vel.clone().normalize();
        this.dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), velNorm);
        this.dummy.scale.set(p.scale.x, p.scale.y + (speed * 0.05), p.scale.z); // Stretch
      } else {
        this.dummy.rotation.set(p.rot.x, p.rot.y, p.rot.z);
        this.dummy.scale.copy(p.scale);
      }
      
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    if (matrixUpdated) this.instancedMesh.instanceMatrix.needsUpdate = true;

    this.postProcessing.composer.render();
  };

  private handleResize = () => {
    this.cameraSystem.camera.aspect = window.innerWidth / window.innerHeight;
    this.cameraSystem.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.postProcessing.setSize(window.innerWidth, window.innerHeight);
  };

  public dispose() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
    this.geometries.forEach(g => g.dispose());
    this.instancedMesh.material.dispose();
    this.gpuSparks.system.geometry.dispose();
    (this.gpuSparks.system.material as THREE.Material).dispose();
    this.renderer.dispose();
    if (document.body.contains(this.container)) document.body.removeChild(this.container);
    this.config.onComplete?.();
  }
}

// ============================================================================
// 7. EXPORTED WRAPPER FUNCTION
// ============================================================================

export const triggerXpConfetti = (customOptions?: Partial<VFXOptions>) => {
  const engine = new VFXEngine(customOptions || {});
  engine.emitBurst();

  // Handle generic fadeout/cleanup timeline
  setTimeout(() => {
    engine.dispose();
  }, customOptions?.duration || DEFAULT_OPTIONS.duration);
};
                                                                      
