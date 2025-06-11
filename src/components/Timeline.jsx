import React from "react";
import "./Timeline.css";
import { useCloudStage } from "../context/CloudStageContext";

export default function Timeline() {
  const { state, dispatch } = useCloudStage();
  const { currentFrame, totalFrames } = state;

  const setFrame = (frame) => {
    dispatch({ type: "SET_CURRENT_FRAME", frame: Math.max(0, Math.min(frame, totalFrames - 1)) });
  };

  return (
    <div className="timeline-root">
      <button onClick={() => setFrame(currentFrame - 1)} disabled={currentFrame <= 0}>&lt;</button>
      <span className="timeline-label">Frame {currentFrame + 1} / {totalFrames}</span>
      <button onClick={() => setFrame(currentFrame + 1)} disabled={currentFrame >= totalFrames - 1}>&gt;</button>
      <input
        type="range"
        min={0}
        max={totalFrames - 1}
        value={currentFrame}
        onChange={e => setFrame(Number(e.target.value))}
        className="timeline-slider"
      />
    </div>
  );
}
