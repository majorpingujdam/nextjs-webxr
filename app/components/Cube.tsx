// A reusable 3D cube component built with React Three Fiber
// This demonstrates how to create modular 3D objects that can be used anywhere

import React from 'react';

// Define the Cube component as a function that accepts mesh properties
// React.ComponentProps<'mesh'> means it accepts any props that a regular mesh would accept
// This includes position, rotation, scale, onClick handlers, etc.
export function Cube(props: React.ComponentProps<'mesh'>) {
  return (
    // mesh is the fundamental 3D object in Three.js
    // It combines geometry (shape) with material (appearance)
    // {...props} spreads any props passed to this component onto the mesh
    <mesh {...props}>
      
      {/* 
        boxGeometry defines the shape of our cube
        args={[width, height, depth]} - in this case, a 2x2x2 cube
        Geometry defines the vertices and faces that make up the 3D shape
      */}
      <boxGeometry args={[2, 2, 2]} />
      
      {/* 
        meshStandardMaterial defines how the surface looks and reacts to light
        This material responds realistically to lighting in the scene
      */}
      <meshStandardMaterial 
        color="#ff6b35"   // Orange color in hexadecimal
        metalness={0.1}   // How metallic the surface looks (0 = not metallic, 1 = very metallic)
        roughness={0.3}   // How rough the surface is (0 = mirror-like, 1 = very rough)
      />
    </mesh>
  );
}