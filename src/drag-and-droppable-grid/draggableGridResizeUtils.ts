export function getNextResizePointerState(args: {
  previousPointerState: {
    clientX: number;
    clientY: number;
    widthDirection: 'increase' | 'decrease' | null;
    heightDirection: 'increase' | 'decrease' | null;
  } | null;
  clientX: number;
  clientY: number;
  pointerDirectionEpsilonPx: number;
}): {
  clientX: number;
  clientY: number;
  widthDirection: 'increase' | 'decrease' | null;
  heightDirection: 'increase' | 'decrease' | null;
} {
  const { previousPointerState, clientX, clientY, pointerDirectionEpsilonPx } =
    args;

  if (!previousPointerState) {
    return {
      clientX,
      clientY,
      widthDirection: null,
      heightDirection: null,
    };
  }

  return {
    clientX,
    clientY,
    widthDirection: getResizeDirection({
      delta: clientX - previousPointerState.clientX,
      previousDirection: previousPointerState.widthDirection,
      pointerDirectionEpsilonPx,
    }),
    heightDirection: getResizeDirection({
      delta: clientY - previousPointerState.clientY,
      previousDirection: previousPointerState.heightDirection,
      pointerDirectionEpsilonPx,
    }),
  };
}

function getResizeDirection(args: {
  delta: number;
  previousDirection: 'increase' | 'decrease' | null;
  pointerDirectionEpsilonPx: number;
}): 'increase' | 'decrease' | null {
  const { delta, previousDirection, pointerDirectionEpsilonPx } = args;

  if (delta > pointerDirectionEpsilonPx) {
    return 'increase';
  }

  if (delta < -pointerDirectionEpsilonPx) {
    return 'decrease';
  }

  return previousDirection;
}
