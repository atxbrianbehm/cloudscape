import React from "react";
import { Canvas } from "@react-three/fiber";

function AssetMesh({ type, position }) {
  // Simple visual for each asset type
  switch (type) {
    case "cloud":
      return (
        <mesh position={position}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#b3e5fc" />
        </mesh>
      );
    case "building":
      return (
        <mesh position={position}>
          <boxGeometry args={[1, 1.5, 1]} />
          <meshStandardMaterial color="#90caf9" />
        </mesh>
      );
    case "tree":
      return (
        <mesh position={position}>
          <cylinderGeometry args={[0.2, 0.5, 1.2, 16]} />
          <meshStandardMaterial color="#81c784" />
        </mesh>
      );
    case "car":
      return (
        <mesh position={position}>
          <boxGeometry args={[0.8, 0.3, 0.4]} />
          <meshStandardMaterial color="#f06292" />
        </mesh>
      );
    default:
      return null;
  }
}

export default function ThreeCanvas({ objects }) {
  // Spread objects horizontally for demo
  const baseY = 0.75;
  return (
    <Canvas camera={{ position: [0, 2, 5], fov: 50 }} style={{ width: "100%", height: "100%" }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 2]} intensity={0.7} />
      <group>
        {objects && objects.length > 0 ? (
          objects.map((obj, i) => (
            <AssetMesh
              key={i}
              type={obj.type}
              position={[-2 + i * 1.5, baseY, 0]}
            />
          ))
        ) : (
          <mesh position={[0, 0.8, 0]}>
            <textGeometry args={["No objects", { size: 0.3, height: 0.02 }]} />
            <meshStandardMaterial color="#888" />
          </mesh>
        )}
      </group>
    </Canvas>
  );
}
