import React from "react";
import "./MainContent.css";
import { useCloudStage } from "../context/CloudStageContext";

export default function MainContent() {
  const { state } = useCloudStage();
  const { layers, selectedLayerId } = state;
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <main className="main-content">
      {/* Toolbar/Header */}
      <header className="toolbar">
        <span className="brand">CloudStage</span>
        <span className="subtitle">2.5D Environment Builder</span>
        <div className="selected-layer">
          Selected Layer: <strong>{selectedLayer ? selectedLayer.name : "(none)"}</strong>
        </div>
      </header>

      {/* 3D Canvas */}
      <section className="canvas-container">
        <div style={{ width: "100%", height: 360, background: "#111", borderRadius: 10 }}>
          <ThreeCanvas objects={selectedLayer ? selectedLayer.objects : []} />
        </div>
      </section>

      {/* Bottom Panel: Timeline & Export */}
      <footer className="bottom-panel">
        <section className="timeline-section">
          <Timeline />
        </section>
        <section className="export-section">
          <ExportPanel />
        </section>
      </footer>
    </main>
  );
}


