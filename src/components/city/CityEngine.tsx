import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  useGLTF, 
  PerspectiveCamera,
  ContactShadows
} from '@react-three/drei';

// ==========================================
// 1. THE 3D MODEL LOADER
// ==========================================
function DetailedHouse() {
  // This line loads your exact downloaded file from the public folder
  const { scene } = useGLTF('/models/modern_luxury_villa_house_building_with_pool.glb');

  return (
    <primitive 
      object={scene} 
      // SCALING TIP: If the house is too big, change this to 0.1 or 0.01. If too small, change to 10.
      scale={1} 
      // POSITION TIP: The middle number (Y-axis) moves it up and down. 
      position={[0, 0, 0]} 
    />
  );
}

// ==========================================
// 2. THE MAIN ENGINE
// ==========================================
export function EstateEngine() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[500px] md:h-[600px] rounded-[2.5rem] overflow-hidden border border-white/10 bg-[#0a0f1a] animate-pulse flex items-center justify-center">
        <span className="text-white/50 font-bold uppercase tracking-widest text-xs">Loading Estate Engine...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] md:h-[600px] rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] border border-white/10 bg-gradient-to-b from-[#1e293b] to-[#0f172a] relative">
      
      {/* Decorative Vignette Overlay for a premium UI feel */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.6)] z-10" />

      <Canvas shadows>
        
        {/* CAMERA: Adjusted slightly higher to see the pool and roof */}
        <PerspectiveCamera 
          makeDefault 
          position={[15, 12, 15]} 
          fov={45} 
        />
        
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          minDistance={1} // Allows you to zoom all the way inside the rooms
          maxDistance={50} // Allows you to zoom out and see the whole villa
          maxPolarAngle={Math.PI / 2 - 0.05} // Stops the camera from going under the grass
        />

        {/* LIGHTING */}
        <ambientLight intensity={0.6} />
        
        <directionalLight 
          castShadow 
          position={[15, 20, 10]} 
          intensity={2} 
          shadow-bias={-0.0001}
          shadow-mapSize={[2048, 2048]}
        />
        
        {/* This Environment tag adds realistic glass reflections and bounces light into the interior rooms */}
        <Environment preset="apartment" /> 

        <group position={[0, -1, 0]}>
          
          {/* Ground Plane - Lowered slightly to -0.1 to prevent glitching with the villa's pool/floor */}
          <mesh position={[0, -0.1, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>

          {/* Fake soft grounding shadow */}
          <ContactShadows position={[0, -0.05, 0]} opacity={0.6} scale={25} blur={2.5} far={4} />

          {/* Suspense waits for the GLB file to download before rendering it */}
          <Suspense fallback={
            <mesh position={[0, 1, 0]}>
              <boxGeometry args={[2, 2, 2]} />
              <meshBasicMaterial color="#38bdf8" wireframe />
            </mesh>
          }>
            <DetailedHouse />
          </Suspense>

        </group>
      </Canvas>
    </div>
  );
}

// Preloads the specific model into the browser cache
useGLTF.preload('/models/modern_luxury_villa_house_building_with_pool.glb');
