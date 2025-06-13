import React, { memo, useRef, useCallback, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CameraControls from 'camera-controls';

// Advanced camera controls using camera-controls library
const CustomCameraControls = memo(({ viewMode, toolActive }) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef(null);
  const isInitialMount = useRef(true);
  
  // Store camera positions for different view modes
  const cameraPositions = useRef({
    '3D': { 
      position: new THREE.Vector3(5, 5, 5), 
      target: new THREE.Vector3(0, 0, 0),
      fov: 50
    },
    '2D': { 
      position: new THREE.Vector3(0, 10, 0.001), 
      target: new THREE.Vector3(0, 0, 0),
      fov: 50,
      orthographic: true
    },
    'Wireframe': { 
      position: new THREE.Vector3(5, 5, 5), 
      target: new THREE.Vector3(0, 0, 0),
      fov: 50
    }
  });
  
  // Track previous view mode
  const prevViewMode = useRef(viewMode);
  
  // Delta time for smooth animations
  const clock = useRef(new THREE.Clock());
  
  // Update controls every frame for smooth camera movement
  useFrame(() => {
    if (controlsRef.current) {
      const delta = clock.current.getDelta();
      controlsRef.current.update(delta);
    }
  });
  
  // Configure controls based on view mode
  const configureControls = useCallback((controls) => {
    if (!controls) return;
    
    // Reset all settings to default first
    controls.reset();
    
    // Common settings for all modes
    controls.dampingFactor = 0.1;
    controls.draggingDampingFactor = 0.15;
    controls.azimuthRotateSpeed = 0.5;
    controls.polarRotateSpeed = 0.5;
    controls.dollySpeed = 1.2;
    controls.truckSpeed = 0.8;
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controls.infinityDolly = false;
    controls.restThreshold = 0.01;
    controls.colliderMeshes = [];
    
    // Default mouse button mappings
    controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
    controls.mouseButtons.middle = CameraControls.ACTION.TRUCK;
    controls.mouseButtons.right = CameraControls.ACTION.DOLLY;
    controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
    
    // Touch settings for mobile
    controls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
    controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY_TRUCK;
    controls.touches.three = CameraControls.ACTION.TOUCH_TRUCK;
    
    // View mode specific settings
    const modeConfig = cameraPositions.current[viewMode];
    if (modeConfig.orthographic) {
      // 2D mode settings
      controls.mouseButtons.left = CameraControls.ACTION.TRUCK;
      controls.mouseButtons.right = CameraControls.ACTION.DOLLY;
      controls.mouseButtons.middle = CameraControls.ACTION.TRUCK;
      controls.minPolarAngle = Math.PI / 2 - 0.01;
      controls.maxPolarAngle = Math.PI / 2 + 0.01;
      controls.minAzimuthAngle = -Infinity;
      controls.maxAzimuthAngle = Infinity;
      controls.minDistance = 1;
      controls.maxDistance = 1000;
    } else if (viewMode === 'Wireframe') {
      // Wireframe mode settings
      controls.minPolarAngle = 0.1;
      controls.maxPolarAngle = Math.PI - 0.1;
    } else {
      // 3D mode settings (default)
      controls.minPolarAngle = 0.1;
      controls.maxPolarAngle = Math.PI / 2 - 0.1;
    }
    
    // When transform tools are active, adjust controls
    if (toolActive) {
      controls.mouseButtons.left = CameraControls.ACTION.NONE;
      controls.mouseButtons.middle = CameraControls.ACTION.NONE;
      controls.mouseButtons.right = CameraControls.ACTION.DOLLY;
    }
    
    // Apply FOV if specified
    if (modeConfig.fov !== undefined) {
      camera.fov = modeConfig.fov;
      camera.updateProjectionMatrix();
    }
    
    return controls;
  }, [viewMode, toolActive, camera]);
  
  // Handle camera position transitions
  const transitionCamera = useCallback((controls) => {
    if (!controls) return Promise.resolve();
    
    const modeConfig = cameraPositions.current[viewMode];
    const targetPos = modeConfig.position;
    const targetLookAt = modeConfig.target;
    
    // If this is the initial mount, set position immediately
    if (isInitialMount.current) {
      controls.setLookAt(
        targetPos.x, targetPos.y, targetPos.z,
        targetLookAt.x, targetLookAt.y, targetLookAt.z,
        false // No animation on initial mount
      );
      isInitialMount.current = false;
      return Promise.resolve();
    }
    
    // For 2D view, make sure we're looking straight down
    if (modeConfig.orthographic) {
      targetPos.y = Math.max(1, targetPos.y); // Ensure we're above the ground
      targetLookAt.y = 0;
    }
    
    // Smooth transition to new position
    return new Promise((resolve) => {
      // First move to look at the target from current position
      controls.setLookAt(
        camera.position.x, camera.position.y, camera.position.z,
        targetLookAt.x, targetLookAt.y, targetLookAt.z,
        true
      ).then(() => {
        // Then move to the final position
        return controls.setLookAt(
          targetPos.x, targetPos.y, targetPos.z,
          targetLookAt.x, targetLookAt.y, targetLookAt.z,
          true
        );
      }).then(resolve);
    });
  }, [viewMode, camera.position]);
  
  // Set up camera controls
  useEffect(() => {
    // Only create controls if they don't exist
    if (!controlsRef.current) {
      // Initialize camera controls
      CameraControls.install({ THREE });
      controlsRef.current = new CameraControls(camera, gl.domElement);
      
      // Initial configuration
      configureControls(controlsRef.current);
      
      // Initial camera position
      transitionCamera(controlsRef.current).then(() => {
        // After initial transition, update the camera position in our state
        const currentPos = new THREE.Vector3();
        camera.getWorldPosition(currentPos);
        
        if (controlsRef.current) {
          cameraPositions.current[viewMode].position.copy(currentPos);
          
          if (controlsRef.current._target) {
            cameraPositions.current[viewMode].target.copy(controlsRef.current._target);
          }
        }
      });
    }
    
    // Cleanup function
    return () => {
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
    };
  }, [camera, gl, viewMode, configureControls, transitionCamera]);
  
  // Update controls when view mode or tool active state changes
  useEffect(() => {
    if (!controlsRef.current) return;
    
    // Configure controls for the current mode
    const updateControls = () => {
      // Save current position before changing modes
      if (prevViewMode.current && prevViewMode.current !== viewMode) {
        const currentPos = new THREE.Vector3();
        camera.getWorldPosition(currentPos);
        cameraPositions.current[prevViewMode.current].position.copy(currentPos);
        
        if (controlsRef.current?._target) {
          cameraPositions.current[prevViewMode.current].target.copy(controlsRef.current._target);
        }
        
        console.log(`Transitioning from ${prevViewMode.current} to ${viewMode}`);
      }
      
      // Reconfigure controls for the new mode
      configureControls(controlsRef.current);
      
      // Transition camera to new position
      transitionCamera(controlsRef.current).then(() => {
        // After transition, update the camera position in our state
        const currentPos = new THREE.Vector3();
        camera.getWorldPosition(currentPos);
        cameraPositions.current[viewMode].position.copy(currentPos);
        
        if (controlsRef.current?._target) {
          cameraPositions.current[viewMode].target.copy(controlsRef.current._target);
        }
      });
      
      // Update previous view mode
      prevViewMode.current = viewMode;
    };
    
    updateControls();
    
    // Handle window resize
    const handleResize = () => {
      if (controlsRef.current) {
        controlsRef.current.updateCameraUp();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [viewMode, toolActive, configureControls, transitionCamera, camera]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!controlsRef.current) return;
    
    const handleKeyDown = (event) => {
      if (!controlsRef.current) return;
      
      // Skip if we're typing in an input
      if (event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA' || 
          event.target.isContentEditable) {
        return;
      }
      
      // Handle specific navigation keys
      switch (event.code) {
        case 'Home':
          event.preventDefault();
          const target = cameraPositions.current[viewMode];
          controlsRef.current.setLookAt(
            target.position.x, target.position.y, target.position.z,
            target.target.x, target.target.y, target.target.z,
            true
          );
          break;
        case 'PageUp':
          event.preventDefault();
          camera.position.y += 0.5;
          break;
        case 'PageDown':
          event.preventDefault();
          camera.position.y -= 0.5;
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, camera.position]);
  
  return null;
});

// Add display name for debugging
CustomCameraControls.displayName = 'CustomCameraControls';

export default CustomCameraControls;
