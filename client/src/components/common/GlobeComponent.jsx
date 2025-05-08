// src/components/common/GlobeComponent.jsx
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber'; // Removed useLoader as useTexture handles it
import { OrbitControls, Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// --- Keep the import from src/assets ---
import img from '../../assets/texture.jpeg'; // <<< KEEP THIS IMPORT
// --- End Import ---

const GlobeComponent = () => {
    // --- Texture Loading ---
    // REMOVED: const texturePath = '/textures/texture.jpeg';
    // --- Use the imported variable 'img' directly with useTexture ---
    const earthTexture = useTexture('https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg'); // <<< CHANGED THIS LINE
    // --- End Texture Loading ---

    // Optional Auto-Rotation
    const globeRef = useRef();
    // useFrame(...)

    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} />

             <Sphere ref={globeRef} args={[2, 64, 64]}>
                <meshStandardMaterial
                    map={earthTexture} // Apply the loaded texture
                />
             </Sphere>

            <OrbitControls enableDamping dampingFactor={0.05} rotateSpeed={0.4} />
        </>
    );
};

// Wrapper component remains the same
const GlobeCanvasWrapper = (props) => {
    return (
        <div className="globe-canvas-container">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }} >
                 <React.Suspense fallback={null}> {/* Keep Suspense */}
                    <GlobeComponent {...props} />
                 </React.Suspense>
            </Canvas>
        </div>
    );
};

export default GlobeCanvasWrapper;