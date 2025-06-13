import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import CameraControls from 'camera-controls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import CustomCameraControls from './CustomCameraControls';
import { useCloudStage } from '../context/CloudStageContext';
import SceneSetup from './SceneSetup';
import './ThreeCanvas.css';

// Initialize camera-controls
CameraControls.install({ THREE });

// Reusable error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ThreeCanvas error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          background: '#f8d7da', 
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          margin: '10px'
        }}>
          <h3>Canvas Error</h3>
          <p>Something went wrong with the 3D canvas.</p>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              background: '#f5c6cb',
              border: '1px solid #f1b0b7',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Canvas
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Grid component to visualize the workspace
const Grid = ({ visible = true, size = 10, divisions = 10, color = "#666666" }) => {
  const gridHelper = new THREE.GridHelper(size, divisions, color, color);
  gridHelper.position.y = -0.01; // Slightly below objects to prevent z-fighting
  return (
    <primitive 
      object={gridHelper} 
      visible={visible}
      receiveShadow
    />
  );
};

// Selection indicator component
const SelectionOutline = ({ object, visible }) => {
  const ref = useRef();
  
  useFrame(() => {
    if (ref.current && object) {
      // Match the position and rotation of the target object
      ref.current.position.copy(object.position);
      ref.current.rotation.copy(object.rotation);
      ref.current.scale.set(1.1, 1.1, 1.1);
    }
  });

  if (!object) return null;

  return (
    <mesh ref={ref} visible={visible}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial 
        color="#00ff00" 
        wireframe 
        transparent 
        opacity={0.8}
      />
    </mesh>
  );
};

// TransformControls wrapper for manipulating objects
const ObjectTransformControls = ({ mode, object, enabled }) => {
  const { camera, gl } = useThree();
  const transformRef = useRef();
  
  useEffect(() => {
    if (transformRef.current) {
      transformRef.current.setMode(mode.toLowerCase());
    }
  }, [mode]);

  if (!object) return null;

  return (
    <TransformControls
      ref={transformRef}
      object={object}
      enabled={enabled}
      camera={camera}
      mode={mode.toLowerCase()}
    />
  );
};

// Selection manager component using ray casting
const SelectionManager = ({ toolMode, onSelect }) => {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  
  const handleCanvasClick = useCallback((event) => {
    if (toolMode !== 'Select') return;
    
    // Calculate pointer position in normalized device coordinates
    const rect = gl.domElement.getBoundingClientRect();
    pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update the raycaster with the new pointer position
    raycaster.current.setFromCamera(pointer.current, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      // Find the first object with userData.objectId
      const clickedObject = intersects.find(
        (item) => item.object.userData.objectId
      );
      
      if (clickedObject) {
        onSelect(clickedObject.object.userData.objectId);
      } else {
        onSelect(null);
      }
    } else {
      onSelect(null);
    }
  }, [camera, gl.domElement, onSelect, scene.children, toolMode]);
  
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleCanvasClick);
    
    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [gl.domElement, handleCanvasClick]);
  
  return null;
};

// Main ThreeCanvas component
const ThreeCanvas = memo(function ThreeCanvas({ 
  objects, 
  viewMode = "3D", 
  toolMode = "Select",
  showGrid = true,
}) {
  const { state, dispatch } = useCloudStage();
  const { selectedObjectId } = state;
  const canvasContainerRef = useRef(null);
  const canvasId = useRef(`three-canvas-${Math.random().toString(36).substr(2, 9)}`);
  const [errorMsg, setErrorMsg] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [remountKey, setRemountKey] = useState(Date.now());
  
  // Refs for cleanup and state management
  const rendererRef = useRef(null);
  const cleanupQueue = useRef([]);
  const isMounted = useRef(true);
  
  // Clean up WebGL context and resources on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      
      // Execute all cleanup functions in reverse order
      while (cleanupQueue.current.length > 0) {
        const cleanupFn = cleanupQueue.current.pop();
        if (typeof cleanupFn === 'function') {
          try {
            cleanupFn();
          } catch (e) {
            console.error('Error during cleanup:', e);
          }
        }
      }
      
      // Clean up renderer if it exists
      if (rendererRef.current) {
        const renderer = rendererRef.current;
        try {
          // Get WebGL context
          const canvas = renderer.domElement;
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          
          // Clear renderer resources
          renderer.clear();
          renderer.forceContextLoss();
          
          // Clear render targets and materials
          renderer.dispose();
          
          // Force WebGL context loss
          if (gl) {
            try {
              const loseContext = gl.getExtension('WEBGL_lose_context');
              if (loseContext) {
                loseContext.loseContext();
              }
              
              const internalExtension = gl.getExtension('WEBGL_lose_context_INTERNAL');
              if (internalExtension) {
                internalExtension.loseContext();
              }
              
              // Clear WebGL state
              gl.getError(); // Clear any existing errors
              gl.finish(); // Wait for all commands to complete
            } catch (e) {
              console.warn('Error during WebGL context cleanup:', e);
            }
          }
          
          // Remove canvas from DOM
          if (canvas.parentNode) {
            try {
              canvas.parentNode.removeChild(canvas);
            } catch (e) {
              console.warn('Error removing canvas from DOM:', e);
            }
          }
          
          // Clear references
          rendererRef.current = null;
          
          // Force garbage collection if available
          if (window.gc) {
            window.gc();
          }
          
          console.log('WebGL renderer and context cleaned up successfully');
          
        } catch (e) {
          console.error('Error during WebGL cleanup:', e);
        }
      }
    };
  }, []);
  
  // Handle canvas mount success
  const handleCreated = useCallback(({ gl, scene, camera }) => {
    if (!isMounted.current) return;
    
    console.log("Canvas mounted successfully");
    
    // Store the renderer reference for cleanup
    rendererRef.current = gl;
    
    try {
      // Configure renderer with more aggressive cleanup settings
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      gl.autoClear = true;
      gl.autoClearColor = true;
      gl.autoClearDepth = true;
      gl.autoClearStencil = true;
      gl.setClearColor(0x000000, 0);
      
      // Disable renderer features we don't need
      gl.info.autoReset = false;
      gl.xr.enabled = false;
      
      // Set initial size
      const updateSize = () => {
        if (canvasContainerRef.current) {
          const { width, height } = canvasContainerRef.current.getBoundingClientRect();
          gl.setSize(width, height, false);
          
          // Update camera if it exists
          if (camera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
          }
          
          // Force a render to update the viewport
          gl.setViewport(0, 0, width, height);
          gl.render(scene, camera);
        }
      };
      
      // Initial size update
      updateSize();
      
      // Handle window resize with debounce
      let resizeTimeout;
      const handleResize = () => {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        
        resizeTimeout = setTimeout(() => {
          if (isMounted.current) {
            updateSize();
          }
        }, 100);
      };
      
      // Add event listeners
      window.addEventListener('resize', handleResize, { passive: true });
      
      // Add cleanup to queue
      cleanupQueue.current.push(() => {
        window.removeEventListener('resize', handleResize);
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
      });
      
      // Mark as loaded
      setHasLoaded(true);
      
      console.log('Three.js renderer initialized successfully');
      
    } catch (error) {
      console.error('Error initializing Three.js renderer:', error);
      setErrorMsg('Failed to initialize 3D renderer. Please try refreshing the page.');
    }
    
    // Cleanup function
    return () => {
      // Cleanup is handled by the main effect
    };
  }, []);
  
  // Handle errors
  const handleError = useCallback((e) => {
    console.error("Canvas error:", e);
    setErrorMsg(e.message || "An error occurred while loading the 3D canvas.");
  }, []);
  
  // Handle object selection
  const handleSelectObject = useCallback((objectId) => {
    dispatch({ type: 'SET_SELECTED_OBJECT', payload: objectId });
  }, [dispatch]);
  
  // Reset canvas if errors occur
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setRemountKey(Date.now());
        setErrorMsg(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);
  
  // Spread objects horizontally for demo
  const baseY = 0.75;
  
  return (
    <ErrorBoundary>
      <div 
        ref={canvasContainerRef}
        id={canvasId.current}
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%',
          overflow: 'hidden'
        }}
      >
        {errorMsg && (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            zIndex: 10, 
            background: 'rgba(255,0,0,0.8)', 
            color: 'white', 
            padding: '10px',
            maxWidth: '100%'
          }}>
            Error: {errorMsg}
          </div>
        )}
        
        {!hasLoaded && (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            zIndex: 10, 
            background: 'rgba(0,0,255,0.8)', 
            color: 'white', 
            padding: '10px' 
          }}>
            Loading canvas...
          </div>
        )}
        
        <Canvas 
          key={`canvas-${remountKey}`}
          camera={{ position: [5, 5, 5], fov: 50, near: 0.1, far: 1000 }}
          style={{ width: "100%", height: "100%", touchAction: 'none' }}
          onCreated={handleCreated}
          onError={handleError}
          dpr={Math.min(window.devicePixelRatio, 2)}
          frameloop="always"
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true
          }}
          shadows
          legacy={false}
        >
          <SceneSetup />
          <CustomCameraControls viewMode={viewMode} toolActive={toolMode !== "Select"} />
          <SelectionManager toolMode={toolMode} onSelect={handleSelectObject} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 2]} intensity={0.7} castShadow />
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={1} 
            castShadow 
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <Grid visible={showGrid} />
          
          {/* Floor plane for better shadows */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#f0f0f0" />
          </mesh>
          
          <group>
            {/* Default cube if no objects */}
            {(!objects || objects.length === 0) ? (
              <mesh position={[0, 0.5, 0]} castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#4a86e8" />
              </mesh>
            ) : (
              objects.map((obj, i) => {
                const isSelected = obj.id === selectedObjectId;
                const objPosition = obj.position || [-2 + i * 1.5, baseY, 0];

                return (
                  <group 
                    key={`asset-group-${obj.id || i}-${remountKey}`}
                    userData={{ objectId: obj.id }}
                  >
                    <mesh
                      key={`asset-${obj.id || i}-${remountKey}`}
                      position={objPosition}
                      onClick={() => handleSelectObject(obj.id)}
                    >
                      <boxGeometry args={[1, 1, 1]} />
                      <meshStandardMaterial 
                        color={isSelected ? "#ff0000" : "#666666"} 
                        wireframe={viewMode === 'Wireframe'}
                      />
                    </mesh>

                    {isSelected && (
                      <>
                        <SelectionOutline object={obj} visible={isSelected && toolMode === "Select"} />
                        <ObjectTransformControls 
                          mode={toolMode} 
                          object={obj} 
                          enabled={isSelected && toolMode !== "Select"}
                        />
                      </>
                    )}
                  </group>
                );
              })
            )}
          </group>
        </Canvas>
      </div>
    </ErrorBoundary>
  );
});

export default ThreeCanvas;
