import React from "react";
import "./Sidebar.css";
import { useCloudStage } from "../context/CloudStageContext";

export default function Sidebar() {
  const { state, dispatch } = useCloudStage();
  const { layers, selectedLayerId, assets } = state;

  const handleNewScene = () => dispatch({ type: "NEW_SCENE" });
  // Export logic is stubbed for now
  const handleExport = () => alert("Export (not implemented yet)");
  const handleLayerSelect = (layerId) => dispatch({ type: "SELECT_LAYER", layerId });
  const handleAddAsset = (assetType) => dispatch({ type: "ADD_ASSET", assetType });

  return (
    <aside className="sidebar">
      <section className="section">
        <h3>Scene Control</h3>
        <div className="scene-buttons">
          <button onClick={handleNewScene}>New Scene</button>
          <button onClick={handleExport}>Export</button>
        </div>
      </section>
      <section className="section">
        <h3>Layers</h3>
        <div className="layers-list">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="layer-item"
              onClick={() => handleLayerSelect(layer.id)}
              style={{
                cursor: "pointer",
                marginBottom: 8,
                background: layer.id === selectedLayerId ? "#333" : undefined,
                borderRadius: 4,
                padding: "4px 8px",
                fontWeight: layer.id === selectedLayerId ? "bold" : undefined,
              }}
            >
              <span>{layer.name}</span>
              <span style={{ color: "#888", marginLeft: 6 }}>({layer.type})</span>
              <span style={{ color: "#4fc3f7", marginLeft: 8 }}>
                {layer.objects.length > 0 ? `(${layer.objects.length})` : ""}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <h3>Asset Palette</h3>
        <div className="asset-palette">
          {assets.map((asset) => (
            <button
              key={asset.type}
              style={{ marginRight: 8, marginBottom: 6 }}
              onClick={() => handleAddAsset(asset.type)}
            >
              {asset.label}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}


