export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted">
      {message}
    </div>
  );
}
