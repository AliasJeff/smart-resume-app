import { EditorWorkbench } from "./EditorWorkbench";

type EditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params;
  return <EditorWorkbench resumeId={id} />;
}
