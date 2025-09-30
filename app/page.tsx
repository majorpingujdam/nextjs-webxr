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

// Animated cube component that rotates continuously
function AnimatedCube({ position, color, size = 1 }: { position: [number, number, number], color: string, size?: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  // Animation loop - runs every frame
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Rotate the cube on all axes for a complex spinning motion
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.z += delta * 0.2;
      
      // Add a subtle floating motion
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });
  
  return (
    <mesh ref={meshRef} position={position}>
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
        
        {/* Collection of interesting cubes with different properties */}
        
        {/* Main orange cube at the center */}
        <Cube position={[0, 0, 0]} />
        
        {/* Floating metallic cube */}
        <mesh position={[3, 2, -2]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial 
            color="#C0C0C0" 
            metalness={0.9} 
            roughness={0.1}
            emissive="#444444"
          />
        </mesh>
        
        {/* Glowing blue cube */}
        <mesh position={[-3, 1, 1]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color="#0080FF" 
            metalness={0.2} 
            roughness={0.3}
            emissive="#004080"
          />
        </mesh>
        
        {/* Translucent purple cube */}
        <mesh position={[2, -0.5, 3]}>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial 
            color="#8000FF" 
            metalness={0.1} 
            roughness={0.4}
            transparent={true}
            opacity={0.7}
          />
        </mesh>
        
        {/* Animated rotating cube with floating motion */}
        <AnimatedCube position={[-2, 1.5, -3]} color="#FF4080" size={0.8} />
        
        {/* Large emerald cube */}
        <mesh position={[0, -1, -5]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial 
            color="#00FF80" 
            metalness={0.1} 
            roughness={0.6}
            emissive="#004020"
          />
        </mesh>
        
        {/* Small golden cube */}
        <mesh position={[4, 0.5, 0]}>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial 
            color="#FFD700" 
            metalness={0.8} 
            roughness={0.2}
            emissive="#664400"
          />
        </mesh>
        
        {/* Another animated cube with different animation */}
        <AnimatedCube position={[1, 2.5, -1]} color="#00FFFF" size={0.5} />
        
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
