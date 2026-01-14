import React, { createContext, useContext, useReducer } from "react";

// Initial state for layers, selection, and assets
const initialState = {
  layers: [
    { id: "background", name: "Background", type: "sky", objects: [] },
    { id: "middleground", name: "Middleground", type: "buildings", objects: [] },
    { id: "foreground", name: "Foreground", type: "objects", objects: [] }
  ],
  selectedLayerId: "background",
  selectedObjectId: null,
  assets: [
    { type: "cloud", label: "Cloud" },
    { type: "building", label: "Building" },
    { type: "tree", label: "Tree" },
    { type: "car", label: "Car" }
  ],
  currentFrame: 0,
  totalFrames: 24
};

// Helper function to generate unique IDs
const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

function reducer(state, action) {
  switch (action.type) {
    case "SELECT_LAYER":
      return { ...state, selectedLayerId: action.layerId };
    case "SET_SELECTED_OBJECT":
      return { ...state, selectedObjectId: action.payload };
    case "ADD_ASSET": {
      const objectId = generateId();
      const newObject = {
        id: objectId,
        type: action.assetType,
        position: [0, 0, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0]
      };
      
      const layers = state.layers.map(layer =>
        layer.id === state.selectedLayerId
          ? { ...layer, objects: [...layer.objects, newObject] }
          : layer
      );
      return { ...state, layers, selectedObjectId: objectId };
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