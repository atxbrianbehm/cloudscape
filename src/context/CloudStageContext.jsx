import React, { createContext, useContext, useReducer } from "react";

// Initial state for layers, selection, and assets
const initialState = {
  layers: [
    { id: "background", name: "Background", type: "sky", objects: [] },
    { id: "middleground", name: "Middleground", type: "buildings", objects: [] },
    { id: "foreground", name: "Foreground", type: "objects", objects: [] }
  ],
  selectedLayerId: "background",
  assets: [
    { type: "cloud", label: "Cloud" },
    { type: "building", label: "Building" },
    { type: "tree", label: "Tree" },
    { type: "car", label: "Car" }
  ],
  currentFrame: 0,
  totalFrames: 24
};

function reducer(state, action) {
  switch (action.type) {
    case "SELECT_LAYER":
      return { ...state, selectedLayerId: action.layerId };
    case "ADD_ASSET": {
      const layers = state.layers.map(layer =>
        layer.id === state.selectedLayerId
          ? { ...layer, objects: [...layer.objects, { type: action.assetType }] }
          : layer
      );
      return { ...state, layers };
    }
    case "SET_CURRENT_FRAME":
      return { ...state, currentFrame: action.frame };
    case "SET_TOTAL_FRAMES":
      return { ...state, totalFrames: action.total };
    case "NEW_SCENE":
      return initialState;
    default:
      return state;
  }
}

const CloudStageContext = createContext();

export function CloudStageProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <CloudStageContext.Provider value={{ state, dispatch }}>
      {children}
    </CloudStageContext.Provider>
  );
}

export function useCloudStage() {
  return useContext(CloudStageContext);
}
