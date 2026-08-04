import * as THREE from 'three';

export const triggerXpConfetti = () => {
  const duration = 4500; // Increased to 4.5s so we can watch them bounce

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.pointerEvents = 'none'; 
  container.style.zIndex = '9999';
  document.body.appendChild(container);

  const scene = new THREE.Scene();
  const fov = 75;
  const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 10;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 2);
  pointLight.position.set(0, 5, 10);
  scene.add(pointLight);

  // Store crystals with an active state and a flag to check if it's already a shard
  type Crystal = { 
    mesh: THREE.Mesh; 
    velocity: THREE.Vector3; 
    rotationSpeed: THREE.Vector3;
    isShard: boolean;
    active: boolean;
  };
  const crystals: Crystal[] = [];
  
  const colors = [0x00f3ff, 0x9d00ff, 0xff00b3, 0xffea00, 0x00ff66];
  const geometry = new THREE.OctahedronGeometry(0.5, 0);

  // OPTIMIZATION: Pre-create materials so we don't drop frames when shattering
  const materials = colors.map(color => new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 1.2,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  }));

  const createBurst = (originX: number, velocityDirectionX: number) => {
    for (let i = 0; i < 40; i++) {
      const material = materials[Math.floor(Math.random() * materials.length)];
      const mesh = new THREE.Mesh(geometry, material);

      mesh.scale.set(
        Math.random() * 0.4 + 0.2,
        Math.random() * 1.5 + 0.5, 
        Math.random() * 0.4 + 0.2
      );

      // Start completely off-screen at the bottom
      mesh.position.set(
        originX + (Math.random() - 0.5) * 2,
        -10, 
        (Math.random() - 0.5) * 2
      );

      const velocity = new THREE.Vector3(
        (Math.random() * 0.3 + 0.1) * velocityDirectionX, 
        Math.random() * 0.4 + 0.6, // Higher upward velocity to clear the screen
        (Math.random() - 0.5) * 0.4 
      );

      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      );

      scene.add(mesh);
      crystals.push({ mesh, velocity, rotationSpeed, isShard: false, active: true });
    }
  };

  // The Shatter Function: Spawns smaller bouncing pieces
  const createShatter = (position: THREE.Vector3, material: THREE.Material) => {
    // Create 3 mini shards
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.scale.set(
        Math.random() * 0.15 + 0.05,
        Math.random() * 0.3 + 0.1,
        Math.random() * 0.15 + 0.05
      );
      
      mesh.position.copy(position);
      
      // Shards burst outward and bounce upward
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        Math.random() * 0.2 + 0.1, 
        (Math.random() - 0.5) * 0.4
      );

      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6
      );

      scene.add(mesh);
      crystals.push({ mesh, velocity, rotationSpeed, isShard: true, active: true });
    }
  };

  createBurst(-8, 1);
  createBurst(8, -1);

  let animationFrameId: number;
  const clock = new THREE.Clock();
  
  // Cache the math needed to calculate the dynamic floor
  const fovRad = (fov / 2) * (Math.PI / 180);

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const timeScale = delta * 60; 

    crystals.forEach((c) => {
      if (!c.active) return;

      c.velocity.y -= 0.008 * timeScale; // Gravity
      c.velocity.x *= 0.99; // Air resistance
      c.velocity.z *= 0.99;

      c.mesh.position.addScaledVector(c.velocity, timeScale);
      c.mesh.rotation.x += c.rotationSpeed.x * timeScale;
      c.mesh.rotation.y += c.rotationSpeed.y * timeScale;
      c.mesh.rotation.z += c.rotationSpeed.z * timeScale;

      // Calculate exactly where the bottom edge of the screen is for this specific Z-depth
      const depth = camera.position.z - c.mesh.position.z;
      // offset by 0.5 so they hit slightly above the absolute bottom edge
      const floorY = -(Math.tan(fovRad) * depth) + 0.5; 

      // Check collision: if below floor AND falling downward
      if (c.mesh.position.y <= floorY && c.velocity.y < 0) {
        if (!c.isShard) {
          // It's a big crystal: Shatter it
          c.active = false;
          c.mesh.visible = false;
          createShatter(c.mesh.position, c.mesh.material);
        } else {
          // It's already a shard: Just bounce it with some friction
          c.mesh.position.y = floorY; 
          c.velocity.y *= -0.5; // Lose half upward momentum
          c.velocity.x *= 0.7;  // Slow horizontal spread
          c.velocity.z *= 0.7;
        }
      }
    });

    renderer.render(scene, camera);
  };

  animate();

  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);

  setTimeout(() => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', handleResize);
    
    geometry.dispose();
    materials.forEach(m => m.dispose()); // Clean up shared materials
    renderer.dispose();
    
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }, duration);
};
      
