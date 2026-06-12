import { ErrandDetail } from '@components/support-errand/errand-detail.component';
import React from 'react';

interface ArendePageProps {
  params: Promise<{ errandId: string }>;
}

const ArendePage: React.FC<ArendePageProps> = async ({ params }) => {
  const { errandId } = await params;
  return <ErrandDetail errandId={errandId} />;
};

export default ArendePage;
