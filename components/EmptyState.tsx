export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-2">
      {message}
    </div>
  );
}
