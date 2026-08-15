import { describe, expect, it } from 'vitest';
import {
  CARD_CLOSED_PX,
  CARD_RECEIPT_PX,
  QUEUE_CLOSED_PX,
  QUEUE_RECEIPT_PX,
  TABLE_ROW_PX,
  estimateCardRowSize,
  estimateQueueRowSize,
  estimateTableRowSize,
} from '../src/features/hr-max/estimateDeskRowSize';

describe('estimateDeskRowSize', () => {
  it('sizes a closed tactical ticket independently of photos', () => {
    expect(CARD_CLOSED_PX).toBe(86);
    expect(estimateCardRowSize({ receiptOpen: false, evidenceCount: 3 })).toBe(CARD_CLOSED_PX);
    expect(estimateCardRowSize({ receiptOpen: false, evidenceCount: 0 })).toBe(CARD_CLOSED_PX);
  });

  it('adds receipt height before measureElement runs', () => {
    const closed = estimateCardRowSize({ receiptOpen: false, evidenceCount: 2 });
    const open = estimateCardRowSize({ receiptOpen: true, evidenceCount: 2 });
    expect(open).toBe(closed + CARD_RECEIPT_PX);
    expect(open).toBeGreaterThan(closed);
  });

  it('sizes queue rows from receiptOpen only', () => {
    expect(estimateQueueRowSize({ receiptOpen: false })).toBe(QUEUE_CLOSED_PX);
    expect(estimateQueueRowSize({ receiptOpen: true })).toBe(QUEUE_CLOSED_PX + QUEUE_RECEIPT_PX);
  });

  it('keeps table rows uniform', () => {
    expect(estimateTableRowSize()).toBe(TABLE_ROW_PX);
  });
});
