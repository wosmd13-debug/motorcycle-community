export const BOARD_MAX_IMAGE_COUNT = 10;
export const BOARD_MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export function formatBoardMaxImageSizeMb(): string {
  return String(BOARD_MAX_IMAGE_BYTES / (1024 * 1024));
}
