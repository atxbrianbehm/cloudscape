import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// SceneSetup component responsible for configuring Three.js scene environment
const SceneSetup = () => {
  const { scene, camera } = useThree();
  
  useEffect(() => {
    // Configure scene
    scene.background = new THREE.Color(0xf0f0f0);
    scene.fog = new THREE.Fog(0xf0f0f0, 10, 50);
    
    // Configure shadow settings
    scene.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    
    // Set up physics world settings (placeholder for future implementation)
    scene.userData.physicsWorld = {
      gravity: -9.8,
      enabled: true
    };
    
    // Configure renderer-independent settings
    camera.layers.enable(0);
    camera.layers.enable(1);
    
    return () => {
      // Clean up scene-specific settings on unmount
      scene.background = null;
      scene.fog = null;
      scene.userData.physicsWorld = null;
    };
  }, [scene, camera]);
  
  return <></>;
};

export default SceneSetup;
