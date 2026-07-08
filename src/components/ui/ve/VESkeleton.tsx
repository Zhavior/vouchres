const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type VESkeletonProps = {
  className?: string;
};

export function VESkeleton({ className }: VESkeletonProps) {
  return <div className={cx('animate-pulse rounded-xl bg-white/[0.06]', className)} />;
}
