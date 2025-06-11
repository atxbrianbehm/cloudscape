import React from "react";
import "./ExportPanel.css";

export default function ExportPanel() {
  const handleExport = async (type) => {
    switch (type) {
      case "GLTF":
        // TODO: Implement GLTF export logic
        alert("Export GLTF (not implemented yet)");
        break;
      case "PNG Sequence":
        // TODO: Implement PNG sequence export logic
        alert("Export PNG Sequence (not implemented yet)");
        break;
      case "JSON Scene":
        // TODO: Implement JSON export logic
        alert("Export JSON Scene (not implemented yet)");
        break;
      case "Flipbook":
        // TODO: Implement Flipbook export logic
        alert("Export Flipbook (not implemented yet)");
        break;
      default:
        alert(`Unknown export type: ${type}`);
    }
  };
  return (
    <div className="export-panel-root">
      <button onClick={() => handleExport("GLTF")}>Export GLTF</button>
      <button onClick={() => handleExport("PNG Sequence")}>Export PNG Sequence</button>
      <button onClick={() => handleExport("JSON Scene")}>Export JSON Scene</button>
      <button onClick={() => handleExport("Flipbook")}>Export Flipbook</button>
    </div>
  );
}
