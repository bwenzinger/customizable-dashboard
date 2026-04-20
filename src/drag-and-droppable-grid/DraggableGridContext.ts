import { createContext, type RefObject } from 'react';

export interface DraggableGridContextType {
  containerRef: RefObject<HTMLDivElement | null>;
}

export const DraggableGridContext = createContext<DraggableGridContextType | null>(
  null
);
