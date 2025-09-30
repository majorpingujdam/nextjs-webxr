// This directive tells Next.js that this component runs on the client-side
// It's needed because we're using browser-specific features like 3D graphics
'use client';

// Import required components
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Stars, Sparkles, Cloud } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Model as PottedPlant } from './components/PottedPlant';
import { Cube } from './components/Cube';

// Create the XR store - this manages the XR session state
// The store handles entering/exiting AR/VR modes and tracks session status
const store = createXRStore();

// Global state for galaxy controls
const GalaxyControls = {
  speedMultiplier: 1,
  showParticles: true,
  showTrails: true,
  showSparkles: true,
  showNebula: true,
  showGlow: true
};

// Cosmic dust particle system
function CosmicDust() {
  const pointsRef = useRef<THREE.Points>(null!);
  
  // Create particle geometry
  const particleCount = 2000;
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // Random positions in a large sphere around the galaxy
      const radius = Math.random() * 15 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, []);
  
  useFrame((state) => {
    if (pointsRef.current) {
      // Slow rotation of the particle field
      pointsRef.current.rotation.y += 0.001;
      pointsRef.current.rotation.x += 0.0005;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Glowing trail component for orbital cubes
function GlowTrail({ orbitRadius, orbitSpeed, color, orbitOffset = 0 }: {
  orbitRadius: number;
  orbitSpeed: number;
  color: string;
  orbitOffset?: number;
}) {
  const trailRef = useRef<THREE.Mesh>(null!);
  const trailPoints = useMemo(() => {
    const points = [];
    const segments = 20;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * orbitRadius;
      const z = Math.sin(angle) * orbitRadius;
      points.push(new THREE.Vector3(x, 0, z));
    }
    return points;
  }, [orbitRadius]);
  
  useFrame((state) => {
    if (trailRef.current) {
      const time = state.clock.elapsedTime;
      const angle = time * orbitSpeed + orbitOffset;
      
      // Update trail position
      trailRef.current.position.x = Math.cos(angle) * orbitRadius;
      trailRef.current.position.z = Math.sin(angle) * orbitRadius;
      
      // Rotate the trail
      trailRef.current.rotation.y = angle;
    }
  });
  
  return (
    <mesh ref={trailRef}>
      <ringGeometry args={[orbitRadius - 0.1, orbitRadius + 0.1, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Pulsing glow effect for the plant
function PulsingGlow() {
  const glowRef = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    if (glowRef.current) {
      const time = state.clock.elapsedTime;
      // Pulsing scale and opacity
      const scale = 1 + Math.sin(time * 2) * 0.1;
      const opacity = 0.3 + Math.sin(time * 3) * 0.2;
      
      glowRef.current.scale.setScalar(scale);
      if (glowRef.current.material instanceof THREE.MeshBasicMaterial) {
        glowRef.current.material.opacity = opacity;
      }
    }
  });
  
  return (
    <mesh ref={glowRef}>
      <sphereGeometry args={[2, 16, 16]} />
      <meshBasicMaterial
        color="#00ff88"
        transparent
        opacity={0.3}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

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
      // Apply speed multiplier from global controls
      const angle = time * orbitSpeed * GalaxyControls.speedMultiplier + orbitOffset;
      const x = Math.cos(angle) * orbitRadius;
      const z = Math.sin(angle) * orbitRadius;
      const y = orbitHeight + Math.sin(time * 2) * 0.3; // Subtle vertical floating
      
      // Set orbital position
      meshRef.current.position.set(x, y, z);
      
      // Rotate the cube itself for spinning effect
      meshRef.current.rotation.x += 0.01 * rotationSpeed * GalaxyControls.speedMultiplier;
      meshRef.current.rotation.y += 0.01 * rotationSpeed * GalaxyControls.speedMultiplier;
      meshRef.current.rotation.z += 0.01 * rotationSpeed * 0.5 * GalaxyControls.speedMultiplier;
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


// Galaxy control panel component
function GalaxyControlPanel() {
  const [session, setSession] = useState<XRSession | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Listen for session changes
  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      setSession(state.session || null);
    });
    return unsubscribe;
  }, []);
  
  const buttonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '2px',
    transition: 'all 0.3s ease'
  };
  
  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4CAF50',
    color: 'white'
  };
  
  const inactiveButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#666',
    color: 'white'
  };
  
  return (
    <div style={{ 
      position: 'absolute', 
      top: '20px', 
      left: '20px', 
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Main control buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {/* AR Button */}
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
        
        {/* Galaxy Controls Toggle */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '10px 20px',
            backgroundColor: isExpanded ? '#2196F3' : '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isExpanded ? 'Hide Controls' : 'Galaxy Controls'}
        </button>
        
        {/* Exit XR Button */}
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
      
      {/* Expanded Galaxy Controls */}
      {isExpanded && (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '15px',
          borderRadius: '10px',
          border: '2px solid #4CAF50',
          minWidth: '300px'
        }}>
          <h3 style={{ color: '#4CAF50', margin: '0 0 10px 0', fontSize: '16px' }}>
            🌌 Galaxy Controls
          </h3>
          
          {/* Speed Controls */}
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '14px' }}>
              ⚡ Speed Control
            </h4>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => { GalaxyControls.speedMultiplier = 0.1; }}
                style={GalaxyControls.speedMultiplier === 0.1 ? activeButtonStyle : inactiveButtonStyle}
              >
                Slow
              </button>
              <button 
                onClick={() => { GalaxyControls.speedMultiplier = 0.5; }}
                style={GalaxyControls.speedMultiplier === 0.5 ? activeButtonStyle : inactiveButtonStyle}
              >
                Half
              </button>
              <button 
                onClick={() => { GalaxyControls.speedMultiplier = 1; }}
                style={GalaxyControls.speedMultiplier === 1 ? activeButtonStyle : inactiveButtonStyle}
              >
                Normal
              </button>
              <button 
                onClick={() => { GalaxyControls.speedMultiplier = 2; }}
                style={GalaxyControls.speedMultiplier === 2 ? activeButtonStyle : inactiveButtonStyle}
              >
                Fast
              </button>
              <button 
                onClick={() => { GalaxyControls.speedMultiplier = 5; }}
                style={GalaxyControls.speedMultiplier === 5 ? activeButtonStyle : inactiveButtonStyle}
              >
                Turbo
              </button>
            </div>
          </div>
          
          {/* Effect Toggles */}
          <div>
            <h4 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '14px' }}>
              ✨ Visual Effects
            </h4>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => { GalaxyControls.showParticles = !GalaxyControls.showParticles; }}
                style={GalaxyControls.showParticles ? activeButtonStyle : inactiveButtonStyle}
              >
                Dust
              </button>
              <button 
                onClick={() => { GalaxyControls.showTrails = !GalaxyControls.showTrails; }}
                style={GalaxyControls.showTrails ? activeButtonStyle : inactiveButtonStyle}
              >
                Trails
              </button>
              <button 
                onClick={() => { GalaxyControls.showSparkles = !GalaxyControls.showSparkles; }}
                style={GalaxyControls.showSparkles ? activeButtonStyle : inactiveButtonStyle}
              >
                Sparkles
              </button>
              <button 
                onClick={() => { GalaxyControls.showNebula = !GalaxyControls.showNebula; }}
                style={GalaxyControls.showNebula ? activeButtonStyle : inactiveButtonStyle}
              >
                Nebula
              </button>
              <button 
                onClick={() => { GalaxyControls.showGlow = !GalaxyControls.showGlow; }}
                style={GalaxyControls.showGlow ? activeButtonStyle : inactiveButtonStyle}
              >
                Glow
              </button>
            </div>
          </div>
        </div>
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
        GALAXY CONTROL PANEL
        Interactive controls for speed and visual effects
      */}
      <GalaxyControlPanel />
      
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
          COSMIC EFFECTS
          Amazing visual effects for the galaxy system
        */}
        
        {/* Starfield background */}
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1}
        />
        
        {/* Conditional cosmic effects based on user controls */}
        {GalaxyControls.showParticles && <CosmicDust />}
        
        {GalaxyControls.showSparkles && (
          <Sparkles count={100} scale={10} size={2} speed={0.4} color="#ffffff" />
        )}
        
        {GalaxyControls.showNebula && (
          <>
            <Cloud
              position={[0, 0, -10]}
              speed={0.1}
              opacity={0.3}
              color="#ff6b9d"
            />
            <Cloud
              position={[5, 2, 5]}
              speed={0.05}
              opacity={0.2}
              color="#4dabf7"
            />
          </>
        )}
        
        {/* 
          ENHANCED LIGHTING SETUP
          Dynamic lighting system for the galaxy
        */}
        
        {/* Ambient light provides soft, overall illumination */}
        <ambientLight intensity={0.3} color="#404080" />
        
        {/* Central galaxy light - emanates from the plant */}
        <pointLight 
          position={[0, 0, 0]}  // Center of the galaxy
          intensity={2.0}       // Strong central light
          color="#00ff88"       // Green glow
          distance={20}
          decay={2}
        />
        
        {/* Orbital lights that follow the cubes */}
        <pointLight 
          position={[0, 0, 0]}  // Will be animated
          intensity={1.5}
          color="#ff4080"
          distance={15}
        />
        
        {/* Directional light for depth */}
        <directionalLight 
          position={[10, 10, 5]}
          intensity={0.8}
          color="#ffffff"
          castShadow
        />
        
        {/* Rim lighting for dramatic effect */}
        <directionalLight 
          position={[-10, 5, -10]}
          intensity={0.5}
          color="#4dabf7"
        />
        
        {/* 
          3D OBJECTS
          These are our interactive 3D elements in the scene
        */}
        
        {/* GALAXY SYSTEM - All cubes orbit around the plant */}
        
        {/* Conditional glow trails for each orbital ring */}
        {GalaxyControls.showTrails && (
          <>
            <GlowTrail orbitRadius={2} orbitSpeed={1.5} color="#FF4080" orbitOffset={0} />
            <GlowTrail orbitRadius={3.5} orbitSpeed={1} color="#0080FF" orbitOffset={Math.PI/3} />
            <GlowTrail orbitRadius={5} orbitSpeed={0.7} color="#00FF80" orbitOffset={0} />
            <GlowTrail orbitRadius={7} orbitSpeed={0.4} color="#8A2BE2" orbitOffset={Math.PI/4} />
          </>
        )}
        
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
        
        {/* Conditional galaxy center - Pulsing glow around the plant */}
        {GalaxyControls.showGlow && <PulsingGlow />}
        
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
