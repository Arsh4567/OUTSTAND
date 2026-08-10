import React from 'react';
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
        <meshStandardMaterial color="#4ade80" /> {/* Emerald green */}
      </mesh>

      {/* Placeholder Building (Level 1 House) */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#fcd34d" /> {/* Warm plaster yellow */}
      </mesh>

      {/* Placeholder Water Tank on Roof */}
      <mesh position={[0.5, 2.3, -0.5]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 16]} />
        <meshStandardMaterial color="#000000" /> {/* Black Sintex tank */}
      </mesh>
    </group>
  );
}

// ==========================================
// MAIN ENGINE: The 3D Canvas
// ==========================================
export function CityEngine() {
  return (
    // The Canvas acts as our window into the 3D world
    <div className="w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#87CEEB]">
      <Canvas shadows>
        
        {/* 1. ISOMETRIC CAMERA */}
        {/* Positioned high up and zoomed in, looking at the center (0,0,0) */}
        <OrthographicCamera 
          makeDefault 
          position={[20, 20, 20]} 
          zoom={40} 
          near={-100} 
          far={100}
        />
        
        {/* 2. CAMERA CONTROLS */}
        {/* We disable rotation to keep the perfect isometric angle, but allow panning and zooming */}
        <OrbitControls 
          enableRotate={false} 
          enablePan={true} 
          enableZoom={true} 
          minZoom={20}
          maxZoom={100}
        />

        {/* 3. LIGHTING (Crucial for AAA look) */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          castShadow 
          position={[10, 15, 10]} 
          intensity={1.5} 
          shadow-mapSize={[1024, 1024]}
        >
          <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10]} />
        </directionalLight>
        
        {/* Soft environmental lighting for realistic reflections */}
        <Environment preset="city" />

        {/* 4. THE CITY */}
        <TestCityBlock />

      </Canvas>
    </div>
  );
        }
