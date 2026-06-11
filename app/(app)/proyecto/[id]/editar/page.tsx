import EditProjectClient from './_components/edit-project-client';

export const dynamic = 'force-dynamic';

export default function EditProjectPage({ params }: { params: { id: string } }) {
  return <EditProjectClient projectId={params?.id ?? ''} />;
}
