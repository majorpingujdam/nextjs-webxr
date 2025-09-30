// This directive tells Next.js that this component runs on the client-side
// It's needed because we're using browser-specific features like 3D graphics
'use client';

// Import required components
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Model as PottedPlant } from './components/PottedPlant';
import { Cube } from './components/Cube';

// Create the XR store - this manages the XR session state
// The store handles entering/exiting AR/VR modes and tracks session status
const store = createXRStore();

// Orbital cube component that orbits around the plant (galaxy center)
function OrbitalCube({ 
  orbitRadius, 
  orbitSpeed, 
  color, 
  size = 1, 
  orbitHeight = 0,
  rotationSpeed = 1,
  orbitOffset = 0 
}: { 
  orbitRadius: number, 
  orbitSpeed: number, 
  color: string, 
  size?: number,
  orbitHeight?: number,
  rotationSpeed?: number,
  orbitOffset?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  // Animation loop - runs every frame
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      
      // Calculate orbital position around the plant (galaxy center at [0, 0, 0])
      const angle = time * orbitSpeed + orbitOffset;
      const x = Math.cos(angle) * orbitRadius;
      const z = Math.sin(angle) * orbitRadius;
      const y = orbitHeight + Math.sin(time * 2) * 0.3; // Subtle vertical floating
      
      // Set orbital position
      meshRef.current.position.set(x, y, z);
      
      // Rotate the cube itself for spinning effect
      meshRef.current.rotation.x += 0.01 * rotationSpeed;
      meshRef.current.rotation.y += 0.01 * rotationSpeed;
      meshRef.current.rotation.z += 0.01 * rotationSpeed * 0.5;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.3} 
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}


// Component to handle XR control buttons outside the Canvas
// This component renders HTML buttons that float over the 3D scene
function XRControlsOverlay() {
  // We need to track session state manually since we're outside the XR context
  const [session, setSession] = useState<XRSession | null>(null);
  
  // Listen for session changes
  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      setSession(state.session || null);
    });
    return unsubscribe;
  }, []);
  
  return (
    <div style={{ 
      position: 'absolute', 
      top: '20px', 
      left: '20px', 
      zIndex: 1000,
      display: 'flex',
      gap: '10px'
    }}>
      {/* Button to enter AR mode - places 3D objects in the real world */}
      <button 
        onClick={() => store.enterAR()}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        Enter AR
      </button>
      
      {/* Button to exit XR mode and return to normal view */}
      {/* Only show this button when there's an active XR session */}
      {session && (
        <button 
          onClick={() => session.end()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Exit XR
        </button>
      )}
    </div>
  );
}

// Main homepage component that renders our 3D scene
export default function Home() {
  return (
    // Container div that takes up the full viewport (100% width and height)
    // Beautiful gradient background for the entire page
    <div style={{ 
      width: '100vw', 
      height: '100vh',
      background: 'linear-gradient(45deg, #0c0c0c 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #0c0c0c 100%)',
      overflow: 'hidden'
    }}>
      {/* 
        XR CONTROL BUTTONS OVERLAY
        These HTML buttons float over the 3D scene and are rendered outside the Canvas
        This prevents React Three Fiber from trying to render them as 3D objects
      */}
      <XRControlsOverlay />
      
      {/* 
        Canvas is the main React Three Fiber component that creates a 3D scene
        It sets up WebGL context and handles rendering
        camera prop sets the initial camera position [x, y, z]
      */}
      <Canvas 
        camera={{ position: [5, 5, 5] }}
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      >
        {/* 
          XR COMPONENT WRAPPER
          This wraps all 3D content and enables XR functionality
          The store prop connects to our XR store for session management
        */}
        <XR store={store}>
        
        {/* 
          LIGHTING SETUP
          We use multiple light sources to create depth and visual interest
        */}
        
        {/* Ambient light provides soft, overall illumination without direction */}
        <ambientLight intensity={0.4} />
        
        {/* Directional light simulates sunlight - comes from one direction */}
        <directionalLight 
          position={[10, 10, 5]}  // Position in 3D space [x, y, z]
          intensity={1.0}         // How bright the light is
          castShadow              // Enable this light to cast shadows
        />
        
        {/* Point light radiates in all directions from a single point */}
        <pointLight 
          position={[-10, -10, -5]}  // Positioned opposite to main light
          intensity={0.5}            // Dimmer than main light
          color="#ffffff"            // Pure white light
        />
        
        {/* Spot light creates a cone of light, like a flashlight */}
        <spotLight
          position={[0, 10, 0]}  // Directly above the scene
          angle={0.3}            // Width of the light cone
          penumbra={1}           // Softness of light edges (0 = sharp, 1 = very soft)
          intensity={0.3}        // Gentle fill light
          castShadow             // Enable shadow casting
        />
        
        {/* 
          3D OBJECTS
          These are our interactive 3D elements in the scene
        */}
        
        {/* GALAXY SYSTEM - All cubes orbit around the plant */}
        
        {/* Inner orbit - Fast moving small cubes */}
        <OrbitalCube orbitRadius={2} orbitSpeed={1.5} color="#FF4080" size={0.6} orbitHeight={0.5} rotationSpeed={2} orbitOffset={0} />
        <OrbitalCube orbitRadius={2} orbitSpeed={1.5} color="#00FFFF" size={0.5} orbitHeight={-0.3} rotationSpeed={1.5} orbitOffset={Math.PI} />
        
        {/* Middle orbit - Medium cubes */}
        <OrbitalCube orbitRadius={3.5} orbitSpeed={1} color="#C0C0C0" size={1.2} orbitHeight={0.8} rotationSpeed={1.2} orbitOffset={Math.PI/3} />
        <OrbitalCube orbitRadius={3.5} orbitSpeed={1} color="#0080FF" size={1} orbitHeight={-0.2} rotationSpeed={1.8} orbitOffset={Math.PI + Math.PI/3} />
        <OrbitalCube orbitRadius={3.5} orbitSpeed={1} color="#8000FF" size={0.8} orbitHeight={0.3} rotationSpeed={1.3} orbitOffset={2*Math.PI/3} />
        
        {/* Outer orbit - Larger cubes */}
        <OrbitalCube orbitRadius={5} orbitSpeed={0.7} color="#00FF80" size={1.5} orbitHeight={0.5} rotationSpeed={0.8} orbitOffset={0} />
        <OrbitalCube orbitRadius={5} orbitSpeed={0.7} color="#FFD700" size={1} orbitHeight={-0.5} rotationSpeed={1.5} orbitOffset={Math.PI} />
        <OrbitalCube orbitRadius={5} orbitSpeed={0.7} color="#FF6B35" size={1.3} orbitHeight={0.2} rotationSpeed={1.1} orbitOffset={Math.PI/2} />
        
        {/* Distant orbit - Slow moving large cubes */}
        <OrbitalCube orbitRadius={7} orbitSpeed={0.4} color="#8A2BE2" size={1.8} orbitHeight={1} rotationSpeed={0.6} orbitOffset={Math.PI/4} />
        <OrbitalCube orbitRadius={7} orbitSpeed={0.4} color="#FF1493" size={1.4} orbitHeight={-0.8} rotationSpeed={0.9} orbitOffset={Math.PI + Math.PI/4} />
        
        {/* Interactive potted plant that can be clicked to teleport */}
        <PottedPlant scale={10} />
        
        {/* 
          SCENE HELPERS
          Visual aids that help users understand the 3D space
        */}
        
        {/* Grid floor provides spatial reference and depth perception */}
        <Grid 
          args={[20, 20]}           // Grid dimensions: 20x20 units
          position={[0, -1, 0]}     // Positioned 1 unit below origin
          cellSize={1}              // Each cell is 1x1 unit
          cellThickness={0.5}       // Thin lines for individual cells
          cellColor="#6f6f6f"       // Gray color for cell lines
          sectionSize={5}           // Major grid lines every 5 cells
          sectionThickness={1}      // Thicker lines for major sections
          sectionColor="#9d4b4b"    // Reddish color for section lines
          fadeDistance={25}         // Grid fades out at this distance
          fadeStrength={1}          // How quickly the fade happens
        />
        
        {/* 
          CAMERA CONTROLS
          OrbitControls allows users to navigate around the 3D scene
          - Left click + drag: Rotate camera around the scene
          - Right click + drag: Pan the camera
          - Scroll wheel: Zoom in and out
        */}
        <OrbitControls 
          enablePan={true}      // Allow panning (moving the camera)
          enableZoom={true}     // Allow zooming in/out
          enableRotate={true}   // Allow rotating around the scene
        />
        
        {/* Close the XR component wrapper */}
        </XR>
      </Canvas>
    </div>
  );
}
