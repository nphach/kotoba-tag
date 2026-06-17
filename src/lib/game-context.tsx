import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useMachine } from "@xstate/react";
import { machine } from "./machine.ts";

type GameContextValue = ReturnType<typeof useMachine<typeof machine>>;

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const value = useMachine(machine);

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
}
