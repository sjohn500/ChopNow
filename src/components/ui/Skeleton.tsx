export function FoodCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="soft-card-shadow overflow-hidden rounded-[16px] border border-border-soft/75 bg-primary-soft"
    >
      <div className="aspect-[4/3] w-full animate-pulse bg-border-soft/80" />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-bg" />
          <div className="h-4 w-12 animate-pulse rounded-full bg-bg" />
        </div>
        <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-bg/80" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-20 animate-pulse rounded-full bg-bg" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-primary/40" />
        </div>
      </div>
    </div>
  );
}
