import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls, Environment } from '@react-three/drei';

// ==========================================
// 1. DATA MODELS & CONFIG
// ==========================================
type TileType = 'empty' | 'road' | 'building' | 'tree';
type BuildingType = 'house_lv1' | 'house_lv2' | 'shop';

interface CityTile {
  id: string;
  x: number;
  z: number;
  type: TileType;
  buildingType?: BuildingType;
  color?: string;
  rotation?: number;
}

const INDIAN_COLORS = [
  '#2dd4bf', // Teal (Very common in Indian plaster)
  '#fcd34d', // Warm Ochre/Yellow
  '#f472b6', // Faded Pink
  '#f8fafc', // Whitewash
  '#93c5fd', // Sky Blue
];

// ==========================================
// 2. PROCEDURAL CITY GENERATOR
// ==========================================
function generateCityState(size: number): CityTile[] {
  const tiles: CityTile[] = [];
  const half = Math.floor(size / 2);

  for (let x = -half; x <= half; x++) {
    for (let z = -half; z <= half; z++) {
      let type: TileType = 'empty';
      let buildingType: BuildingType | undefined;
      let color: string | undefined;
      let rotation = 0;

      // 1. Carve the Roads (Main cross intersection)
      const isMainRoad = x === 0;
      const isCrossRoad = z === 0;
      
      if (isMainRoad || isCrossRoad) {
        type = 'road';
      } 
      // 2. Zone Buildings (Must be adjacent to a road)
      else if (Math.abs(x) === 1 || Math.abs(z) === 1) {
        // 60% chance to spawn a building on a valid lot
        if (Math.random() > 0.4) {
          type = 'building';
          color = INDIAN_COLORS[Math.floor(Math.random() * INDIAN_COLORS.length)];
          
          // Face the road
          if (x === 1) rotation = -Math.PI / 2;
          else if (x === -1) rotation = Math.PI / 2;
          else if (z === 1) rotation = 0;
          else if (z === -1) rotation = Math.PI;

          // Determine building type
          const rand = Math.random();
          if (rand > 0.8) buildingType = 'shop';
          else if (rand > 0.4) buildingType = 'house_lv2';
          else buildingType = 'house_lv1';
        }
      } 
      // 3. Zone Greenery (Behind houses)
      else {
        if (Math.random() > 0.85) {
          type = 'tree';
        }
      }

      tiles.push({ id: `${x},${z}`, x, z, type, buildingType, color, rotation });
    }
  }
  return tiles;
}

// ==========================================
// 3. 3D COMPONENTS
// ==========================================

// Indian Signature: The Black Sintex Water Tank
const WaterTank = ({ position }: { position: [number, number, number] }) => (
  <mesh position={position} castShadow>
    <cylinderGeometry args={[0.15, 0.15, 0.35, 16]} />
    <meshStandardMaterial color="#111111" roughness={0.6} />
  </mesh>
);

const Building = ({ tile }: { tile: CityTile }) => {
  const isShop = tile.buildingType === 'shop';
  const isLv2 = tile.buildingType === 'house_lv2';

  return (
    <group position={[tile.x, 0, tile.z]} rotation={[0, tile.rotation || 0, 0]}>
      {/* Ground Floor */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.8, 0.9]} />
        <meshStandardMaterial color={tile.color} roughness={0.9} />
      </mesh>

      {/* Shop Awning (If it's a shop) */}
      {isShop && (
        <mesh position={[0, 0.5, 0.46]} castShadow>
          <boxGeometry args={[0.9, 0.05, 0.4]} />
          <meshStandardMaterial color="#ef4444" roughness={0.7} /> {/* Red Awning */}
        </mesh>
      )}

      {/* Second Floor (If Level 2) */}
      {isLv2 && (
        <mesh position={[0, 1.1, -0.1]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.6, 0.7]} />
          <meshStandardMaterial color={tile.color} roughness={0.9} />
        </mesh>
      )}

      {/* Water Tank */}
      <WaterTank position={[0.25, isLv2 ? 1.5 : 0.9, isLv2 ? -0.2 : 0]} />
    </group>
  );
};

const Tree = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    {/* Trunk */}
    <mesh position={[0, 0.3, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.08, 0.6]} />
      <meshStandardMaterial color="#78350f" />
    </mesh>
    {/* Leaves */}
    <mesh position={[0, 0.8, 0]} castShadow>
      <sphereGeometry args={[0.35, 7, 7]} />
      <meshStandardMaterial color="#15803d" roughness={0.8} />
    </mesh>
  </group>
);

// ==========================================
// 4. MAIN ENGINE COMPONENT
// ==========================================
export function CityEngine() {
  const [isMounted, setIsMounted] = useState(false);

  // Generate the city data once (11x11 grid)
  const cityTiles = useMemo(() => generateCityState(11), []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[500px] rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-900 animate-pulse flex items-center justify-center">
        <span className="text-white/50 font-bold uppercase tracking-widest text-xs">Initializing City Grid...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] md:h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-b from-[#87CEEB] to-[#e0f2fe] relative">
      
      {/* Decorative Overlay Frame */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.2)] z-10" />

      <Canvas shadows>
        
        {/* CAMERA: Zoomed out slightly to fit the 11x11 grid */}
        <OrthographicCamera 
          makeDefault 
          position={[25, 25, 25]} 
          zoom={25} 
          near={-100} 
          far={100}
        />
        
        <OrbitControls 
          enableRotate={false} 
          enablePan={true} 
          enableZoom={true} 
          minZoom={15}
          maxZoom={60}
        />

        {/* LIGHTING */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          castShadow 
          position={[15, 20, 10]} 
          intensity={1.2} 
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <Environment preset="city" />

        {/* THE CITY GRID */}
        <group position={[0, -0.5, 0]}>
          
          {/* Main Base Plate (Dirt/Grass foundation) */}
          <mesh position={[0, -0.1, 0]} receiveShadow>
            <boxGeometry args={[11, 0.2, 11]} />
            <meshStandardMaterial color="#86efac" roughness={1} /> {/* Light grassy green */}
          </mesh>

          {/* Render Tiles */}
          {cityTiles.map((tile) => {
            if (tile.type === 'road') {
              return (
                <mesh key={tile.id} position={[tile.x, 0.01, tile.z]} receiveShadow>
                  <planeGeometry args={[1, 1]} />
                  <meshStandardMaterial color="#475569" roughness={0.9} /> {/* Asphalt Grey */}
                </mesh>
              );
            }
            if (tile.type === 'building') {
              return <Building key={tile.id} tile={tile} />;
            }
            if (tile.type === 'tree') {
              return <Tree key={tile.id} position={[tile.x, 0, tile.z]} />;
            }
            return null; // Empty lot
          })}
        </group>

      </Canvas>
    </div>
  );
      }
