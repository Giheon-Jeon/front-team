import { createContext, useContext } from "react";

export const GameSceneContext = createContext(null);
export const useGameScene = () => useContext(GameSceneContext);
