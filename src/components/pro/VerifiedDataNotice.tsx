type VerifiedDataNoticeProps = {
  message?: string;
};

export function VerifiedDataNotice({
  message = 'VouchEdge only shows verified or connected data. Missing research modules stay locked instead of showing fake stats.',
}: VerifiedDataNoticeProps) {
  return (
    <div className="rounded-2xl border border-amber-400/15 bg-amber-400/8 p-3">
      <p className="text-xs leading-relaxed text-amber-100">{message}</p>
    </div>
  );
}
