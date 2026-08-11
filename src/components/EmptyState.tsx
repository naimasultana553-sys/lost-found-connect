import { Icon } from "@/components/Icon";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-tertiary-fixed-dim bg-surface-container-lowest/60 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
        <Icon name="search_off" className="text-[28px]" />
      </div>
      <h3 className="font-label-bold text-label-bold text-on-surface">{title}</h3>
      {description && <p className="max-w-sm text-sm text-on-surface-variant">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
