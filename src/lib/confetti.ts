import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';

export const triggerXpConfetti = () => {
  const duration = 6500;
  
  // --- UI SETUP ---
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  document.body.appendChild(container);

  // --- HAPTIC FEEDBACK ---
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([40, 60, 100]); // Pre-launch rumble
  }

  // --- CORE THREE.JS SETUP ---
  const scene = new THREE.Scene();
  const fov = 75;
  const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 10;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // --- POST-PROCESSING STACK ---
  const renderScene = new RenderPass(scene, camera);
  const composer = new EffectComposer(renderer);
  composer.addPass(renderScene);

  // 1. Bloom
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 3.0, 0.5, 0.2);
  composer.addPass(bloomPass);

  // 2. Chromatic Aberration
  const rgbShiftPass = new ShaderPass(RGBShiftShader);
  rgbShiftPass.uniforms['amount'].value = 0.0015;
  composer.addPass(rgbShiftPass);

  // 3. Vignette (Cinematic borders)
  const vignettePass = new ShaderPass(VignetteShader);
  vignettePass.uniforms['offset'].value = 1.0;
  vignettePass.uniforms['darkness'].value = 1.2;
  composer.addPass(vignettePass);

  // --- LIGHTING ---
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const pointLight = new THREE.PointLight(0xffffff, 4);
  pointLight.position.set(0, 5, 10);
  scene.add(pointLight);

  // --- CAMERA FLASH ---
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending });
  const flashMesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), flashMat);
  flashMesh.position.z = 9;
  scene.add(flashMesh);

  // --- MEMORY OPTIMIZATION: ZERO-ALLOCATION MATH ---
  // Pre-allocate objects used in the animation loop to prevent garbage collection spikes
  const dummy = new THREE.Object3D();
  const colorObj = new THREE.Color();
  const tempVec = new THREE.Vector3();
  const fovRad = (fov / 2) * (Math.PI / 180);

  // --- SYSTEM STATES & TIMELINE ---
  let timeScaleMultiplier = 1.0;
  let targetTimeScale = 1.0;
  let shakeIntensity = 0;
  let shakeDecay = 0;
  let shakeTime = 0;
  let hasTriggeredImpact = false;

  const colors = [0x00f3ff, 0x9d00ff, 0xff00b3, 0xffea00, 0x00ff66];
  const crystalGeo = new THREE.OctahedronGeometry(0.5, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.0, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 1,
  });

  // --- INSTANCED MESHES (DRAW CALL OPTIMIZATION) ---
  const MAX_CRYSTALS = 80;
  const MAX_SHARDS = MAX_CRYSTALS * 4;

  const mainCrystals = new THREE.InstancedMesh(crystalGeo, crystalMat, MAX_CRYSTALS);
  const shards = new THREE.InstancedMesh(crystalGeo, crystalMat, MAX_SHARDS);
  
  // Create Physics data arrays
  type PhysicsState = { active: boolean; pos: THREE.Vector3; vel: THREE.Vector3; rot: THREE.Vector3; rotVel: THREE.Vector3; scale: THREE.Vector3 };
  
  const mainPhysics: PhysicsState[] = Array.from({ length: MAX_CRYSTALS }, () => ({
    active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3(), scale: new THREE.Vector3()
  }));
  
  const shardPhysics: PhysicsState[] = Array.from({ length: MAX_SHARDS }, () => ({
    active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: new THREE.Vector3(), rotVel: new THREE.Vector3(), scale: new THREE.Vector3()
  }));

  scene.add(mainCrystals);
  scene.add(shards);

  // Hide all instances initially
  dummy.position.set(0, -999, 0);
  dummy.updateMatrix();
  for (let i = 0; i < MAX_CRYSTALS; i++) mainCrystals.setMatrixAt(i, dummy.matrix);
  for (let i = 0; i < MAX_SHARDS; i++) shards.setMatrixAt(i, dummy.matrix);

  // --- OBJECT POOLING SPWANERS ---
  let shardIndex = 0;

  const spawnBurst = (originX: number, velocityDirectionX: number, startIndex: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const idx = startIndex + i;
      const p = mainPhysics[idx];
      p.active = true;
      p.scale.set(Math.random() * 0.5 + 0.3, Math.random() * 2.0 + 0.8, Math.random() * 0.5 + 0.3);
      p.pos.set(originX + (Math.random() - 0.5) * 2, -12, (Math.random() - 0.5) * 2);
      p.vel.set((Math.random() * 0.4 + 0.2) * velocityDirectionX, Math.random() * 0.6 + 0.7, (Math.random() - 0.5) * 0.5);
      p.rotVel.set((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4);
      
      mainCrystals.setColorAt(idx, colorObj.setHex(colors[Math.floor(Math.random() * colors.length)]));
    }
    mainCrystals.instanceColor!.needsUpdate = true;
  };

  const spawnShatter = (sourcePos: THREE.Vector3, sourceColor: THREE.Color) => {
    for (let i = 0; i < 4; i++) {
      if (shardIndex >= MAX_SHARDS) shardIndex = 0; // Recycle older shards (Ring buffer)
      const p = shardPhysics[shardIndex];
      p.active = true;
      p.scale.set(Math.random() * 0.2 + 0.05, Math.random() * 0.4 + 0.1, Math.random() * 0.2 + 0.05);
      p.pos.copy(sourcePos);
      p.vel.set((Math.random() - 0.5) * 0.6, Math.random() * 0.4 + 0.1, (Math.random() - 0.5) * 0.6);
      p.rotVel.set((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5);
      
      shards.setColorAt(shardIndex, sourceColor);
      shardIndex++;
    }
    shards.instanceColor!.needsUpdate = true;
  };

  // Launch initial bursts
  spawnBurst(-8, 1, 0, 40);
  spawnBurst(8, -1, 40, 40);

  // --- ANIMATION LOOP ---
  let animationFrameId: number;
  const clock = new THREE.Clock();

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    // 1. Cinematic Easing (Spring-like recovery for slow motion)
    timeScaleMultiplier += (targetTimeScale - timeScaleMultiplier) * 8.0 * delta;
    const timeScale = delta * 60 * timeScaleMultiplier;

    // 2. Timeline Effects (Fades, Pulses, Shakes)
    if (flashMat.opacity > 0) flashMat.opacity -= 3.0 * delta; // Flash fades quickly
    
    // Dynamic Bloom Pulse based on time dilation
    bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, timeScaleMultiplier < 0.5 ? 4.5 : 2.0, 5.0 * delta);
    rgbShiftPass.uniforms['amount'].value = THREE.MathUtils.lerp(rgbShiftPass.uniforms['amount'].value, shakeIntensity > 0.1 ? 0.008 : 0.0015, 10.0 * delta);

    // Smooth Spring Camera Shake
    if (shakeIntensity > 0.01) {
      shakeTime += delta * 30;
      camera.position.x = Math.sin(shakeTime) * Math.cos(shakeTime * 0.8) * shakeIntensity;
      camera.position.y = Math.cos(shakeTime * 1.2) * Math.sin(shakeTime * 0.9) * shakeIntensity;
      shakeIntensity *= shakeDecay;
    } else {
      camera.position.set(0, 0, 10); // Reset
    }

    // 3. Physics & Matrix Updates (Zero Allocation)
    const updatePhysics = (physicsData: PhysicsState[], instancedMesh: THREE.InstancedMesh, isShard: boolean) => {
      let matrixNeedsUpdate = false;
      
      for (let i = 0; i < physicsData.length; i++) {
        const p = physicsData[i];
        if (!p.active) continue;
        
        matrixNeedsUpdate = true;

        p.vel.y -= 0.012 * timeScale; // Gravity
        p.vel.x *= 0.99; // Drag
        p.vel.z *= 0.99;

        p.pos.addScaledVector(p.vel, timeScale);
        p.rot.addScaledVector(p.rotVel, timeScale);

        const depth = camera.position.z - p.pos.z;
        const floorY = -(Math.tan(fovRad) * depth) + 0.5;

        // Collision logic
        if (p.pos.y <= floorY && p.vel.y < 0) {
          if (!isShard) {
            // First Major Impact Timeline Triggers
            if (!hasTriggeredImpact) {
              hasTriggeredImpact = true;
              targetTimeScale = 0.05; // Drop to 5% speed (Matrix bullet time)
              shakeIntensity = 0.8;
              shakeDecay = 0.92;
              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);
              
              // Schedule recovery
              setTimeout(() => { targetTimeScale = 1.0; }, 600);
            }

            p.active = false;
            dummy.position.set(0, -999, 0); // Hide main crystal
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
            
            instancedMesh.getColorAt(i, colorObj);
            spawnShatter(p.pos, colorObj);
            continue; // Skip matrix update below since it's hidden
          } else {
            // Shard Bounce
            p.pos.y = floorY;
            p.vel.y *= -0.5;
            p.vel.x *= 0.7;
            p.vel.z *= 0.7;
          }
        }

        // Apply matrix transformation
        dummy.position.copy(p.pos);
        dummy.rotation.set(p.rot.x, p.rot.y, p.rot.z);
        dummy.scale.copy(p.scale);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      
      if (matrixNeedsUpdate) instancedMesh.instanceMatrix.needsUpdate = true;
    };

    updatePhysics(mainPhysics, mainCrystals, false);
    updatePhysics(shardPhysics, shards, true);

    composer.render();
  };

  animate();

  // --- CLEANUP ---
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);

  setTimeout(() => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', handleResize);
    crystalGeo.dispose();
    crystalMat.dispose();
    flashMat.dispose();
    renderer.dispose();
    if (document.body.contains(container)) document.body.removeChild(container);
  }, duration);
};
  
