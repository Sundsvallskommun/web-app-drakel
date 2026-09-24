import { SsbtekPageClient } from '@components/ssbtek/ssbtek-page-client';
import React from 'react';

interface SsbtekPageProps {
  params: Promise<{ errandId: string }>;
}

const SsbtekPage: React.FC<SsbtekPageProps> = async ({ params }) => {
  const { errandId } = await params;
  return <SsbtekPageClient errandId={errandId} />;
};

export default SsbtekPage;
