import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls, Environment } from '@react-three/drei';

// ==========================================
// TEST COMPONENT: A Simple Plot of Land & Building
// ==========================================
function TestCityBlock() {
  return (
    <group>
      {/* The Ground (Grass/Dirt) */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[10, 1, 10]} />
        <meshStandardMaterial color="#4ade80" /> 
      </mesh>

      {/* Placeholder Building (Level 1 House) */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#fcd34d" /> 
      </mesh>

      {/* Placeholder Water Tank on Roof */}
      <mesh position={[0.5, 2.3, -0.5]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 16]} />
        <meshStandardMaterial color="#000000" /> 
      </mesh>
    </group>
  );
}

// ==========================================
// MAIN ENGINE: The 3D Canvas
// ==========================================
export function CityEngine() {
  // 1. Add state to check if we are in the browser
  const [isMounted, setIsMounted] = useState(false);

  // useEffect only runs in the browser, NEVER on the Vercel server
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Show a placeholder while the server is building the page
  if (!isMounted) {
    return (
      <div className="w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#87CEEB]/20 animate-pulse flex items-center justify-center">
        <span className="text-white/50 font-bold uppercase tracking-widest text-xs">Loading City Engine...</span>
      </div>
    );
  }

  // 3. Render the actual 3D Canvas once the browser takes over
  return (
    <div className="w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#87CEEB]">
      <Canvas shadows>
        
        <OrthographicCamera 
          makeDefault 
          position={[20, 20, 20]} 
          zoom={40} 
          near={-100} 
          far={100}
        />
        
        <OrbitControls 
          enableRotate={false} 
          enablePan={true} 
          enableZoom={true} 
          minZoom={20}
          maxZoom={100}
        />

        <ambientLight intensity={0.4} />
        <directionalLight 
          castShadow 
          position={[10, 15, 10]} 
          intensity={1.5} 
          shadow-mapSize={[1024, 1024]}
        >
          <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10]} />
        </directionalLight>
        
        <Environment preset="city" />

        <TestCityBlock />

      </Canvas>
    </div>
  );
}
