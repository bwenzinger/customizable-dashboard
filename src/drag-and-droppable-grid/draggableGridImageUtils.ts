import { normalizeLayoutPositions } from './gridMath';
import type { DraggableGridItem } from './types';

type AddDroppedImageItemsToLayoutArgs = {
  files: File[];
  layout: DraggableGridItem[];
  row: number;
  column: number;
  columns: number;
  createdImageUrls: Set<string>;
  onLayoutChanged: (nextLayout: DraggableGridItem[]) => void;
  onLayoutCommitted: (
    nextLayout: DraggableGridItem[],
    previousLayout: DraggableGridItem[],
    reason: 'drop'
  ) => void;
};

export async function addDroppedImageItemsToLayout(
  args: AddDroppedImageItemsToLayoutArgs
): Promise<void> {
  const {
    files,
    layout,
    row,
    column,
    columns,
    createdImageUrls,
    onLayoutChanged,
    onLayoutCommitted,
  } = args;
  const imageItems = await Promise.all(
    files.map(async (file, index) => {
      const imageSrc = URL.createObjectURL(file);

      createdImageUrls.add(imageSrc);

      try {
        const dimensions = await readImageDimensions(imageSrc);
        const size = calculateSmartImageItemSize({
          imageWidth: dimensions.width,
          imageHeight: dimensions.height,
          totalColumns: columns,
          startColumn: column,
        });

        return {
          id: createImageGridItemId(),
          title: file.name,
          imageSrc,
          row: row + index,
          column,
          ...size,
        };
      } catch {
        return {
          id: createImageGridItemId(),
          title: file.name,
          imageSrc,
          width: 2,
          minWidth: 1,
          maxWidth: Math.max(2, Math.min(6, columns)),
          height: 2,
          minHeight: 1,
          maxHeight: 6,
          row: row + index,
          column,
        };
      }
    })
  );
  const nextLayout = normalizeLayoutPositions([...layout, ...imageItems], columns);

  onLayoutChanged(nextLayout);
  onLayoutCommitted(nextLayout, layout, 'drop');
}

export function cleanupRemovedImageObjectUrls(args: {
  previousLayout: DraggableGridItem[];
  nextLayout: DraggableGridItem[];
  createdImageUrls: Set<string>;
}): void {
  const { previousLayout, nextLayout, createdImageUrls } = args;
  const currentImageUrls = new Set(
    nextLayout.flatMap((item) => (item.imageSrc ? [item.imageSrc] : []))
  );

  previousLayout.forEach((item) => {
    if (
      item.imageSrc &&
      createdImageUrls.has(item.imageSrc) &&
      !currentImageUrls.has(item.imageSrc)
    ) {
      URL.revokeObjectURL(item.imageSrc);
      createdImageUrls.delete(item.imageSrc);
    }
  });
}

export function hasImageFiles(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) {
    return false;
  }

  if (
    Array.from(dataTransfer.items).some(
      (item) =>
        item.kind === 'file' &&
        (item.type === '' || item.type.startsWith('image/'))
    )
  ) {
    return true;
  }

  return Array.from(dataTransfer.types).includes('Files');
}

export function getImageFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) {
    return [];
  }

  return Array.from(dataTransfer.files).filter((file) => isImageFile(file));
}

function isImageFile(file: File): boolean {
  return (
    file.type.startsWith('image/') ||
    /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)$/i.test(file.name)
  );
}

async function readImageDimensions(
  imageSrc: string
): Promise<{ width: number; height: number }> {
  return await new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      reject(new Error('Failed to load image dimensions.'));
    };
    image.src = imageSrc;
  });
}

function calculateSmartImageItemSize(args: {
  imageWidth: number;
  imageHeight: number;
  totalColumns: number;
  startColumn: number;
}): Pick<
  DraggableGridItem,
  'width' | 'minWidth' | 'maxWidth' | 'height' | 'minHeight' | 'maxHeight'
> {
  const { imageWidth, imageHeight, totalColumns, startColumn } = args;
  const imageAspectRatio = imageWidth / Math.max(1, imageHeight);
  const maxWidthAtDropSlot = Math.max(1, totalColumns - startColumn + 1);
  const maxWidth = Math.max(1, Math.min(maxWidthAtDropSlot, totalColumns, 6));
  const maxHeight = 6;
  const targetArea = imageAspectRatio > 1.45 || imageAspectRatio < 0.7 ? 6 : 4;
  let bestCandidate = {
    width: 2,
    height: 2,
    score: Number.POSITIVE_INFINITY,
  };

  for (let width = 1; width <= maxWidth; width += 1) {
    for (let height = 1; height <= maxHeight; height += 1) {
      const candidateAspectRatio = width / height;
      const aspectPenalty = Math.abs(
        Math.log(candidateAspectRatio / imageAspectRatio)
      );
      const areaPenalty = Math.abs(width * height - targetArea) * 0.35;
      const extremeShapePenalty = width === 1 || height === 1 ? 0.2 : 0;
      const score = aspectPenalty * 5 + areaPenalty + extremeShapePenalty;

      if (score < bestCandidate.score) {
        bestCandidate = {
          width,
          height,
          score,
        };
      }
    }
  }

  return {
    width: bestCandidate.width,
    minWidth: 1,
    maxWidth,
    height: bestCandidate.height,
    minHeight: 1,
    maxHeight,
  };
}

function createImageGridItemId(): string {
  const randomId = globalThis.crypto?.randomUUID?.();

  if (randomId) {
    return `image-${randomId}`;
  }

  return `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
