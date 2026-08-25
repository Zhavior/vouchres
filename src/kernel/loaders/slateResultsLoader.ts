import { vouchedgeApi } from '../../api/vouchedgeApi';
import type { SlateResultsContract } from '../contracts/slateResults';

export async function loadSlateResults(date: string): Promise<SlateResultsContract> {
  return vouchedgeApi.slateResults(date);
}
