import { ReactNode } from 'react';
import { Button } from './Button';
import { Card } from './Card';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({
  emoji = '🍲',
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <Card padding="lg" className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-3xl">
        {icon ?? <span aria-hidden="true">{emoji}</span>}
      </div>
      <h3 className="font-heading mt-4 text-lg font-bold text-text-primary">
        {title}
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-text-secondary">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button type="button" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </Card>
  );
}
