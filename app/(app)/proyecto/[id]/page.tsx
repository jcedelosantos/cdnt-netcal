import ProjectDetailClient from './_components/project-detail-client';

export const dynamic = 'force-dynamic';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return <ProjectDetailClient projectId={params?.id ?? ''} />;
}
