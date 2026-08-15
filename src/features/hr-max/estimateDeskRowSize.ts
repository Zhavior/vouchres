/**
 * Reddit-style size-from-data for HR Max virtualizers.
 * First-paint guess only — TanStack still measures the painted node (L029).
 * Prefer slightly tall estimates (gaps) over short ones (overlap / stolen clicks).
 */

/** Closed tactical ticket (~78px content). Slightly tall first guess (L031). */
export const CARD_CLOSED_PX = 86;
export const CARD_RECEIPT_PX = 176;

export const QUEUE_CLOSED_PX = 76;
export const QUEUE_RECEIPT_PX = 176;

export const TABLE_ROW_PX = 52;

export function estimateCardRowSize(input: {
  receiptOpen: boolean;
  evidenceCount: number;
}): number {
  void input.evidenceCount;
  return input.receiptOpen ? CARD_CLOSED_PX + CARD_RECEIPT_PX : CARD_CLOSED_PX;
}

export function estimateQueueRowSize(input: { receiptOpen: boolean }): number {
  return input.receiptOpen ? QUEUE_CLOSED_PX + QUEUE_RECEIPT_PX : QUEUE_CLOSED_PX;
}

export function estimateTableRowSize(): number {
  return TABLE_ROW_PX;
}
