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
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
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