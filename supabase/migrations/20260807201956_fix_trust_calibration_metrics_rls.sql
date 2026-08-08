-- This migration was already applied to the linked production project, but
-- its source file was missing from the repository. Keep local resets and the
-- remote migration ledger aligned by making the view honor underlying RLS.
alter view public.trust_calibration_metrics
  set (security_invoker = true);
