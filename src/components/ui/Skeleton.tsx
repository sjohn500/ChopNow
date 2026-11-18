export function FoodCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="soft-card-shadow overflow-hidden rounded-[16px] bg-surface"
    >
      <div className="aspect-[4/3] w-full animate-pulse bg-primary-soft/65" />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-primary-soft/75" />
          <div className="h-4 w-12 animate-pulse rounded-full bg-bg" />
        </div>
        <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-bg" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-20 animate-pulse rounded-full bg-primary-soft/70" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-primary-soft" />
        </div>
      </div>
    </div>
  );
}
