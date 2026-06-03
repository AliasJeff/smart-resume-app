type EditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <p className="text-sm text-muted">编辑器页面（待实现）</p>
        <p className="mt-2 font-mono text-sm text-foreground">{id}</p>
      </div>
    </div>
  );
}
