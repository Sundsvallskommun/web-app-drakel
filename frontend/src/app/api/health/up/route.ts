import { constantTimeEquals } from '@utils/constant-time-equals';
import axios from 'axios';
import https from 'https';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const requireAuth = process.env.HEALTH_AUTH === 'true';
const authUsername = process.env.HEALTH_USERNAME;
const authPassword = process.env.HEALTH_PASSWORD;

export const GET = async () => {
  const headersList = await headers();
  const authorization = headersList.get('authorization') ?? '';
  const userAuth64 = Buffer.from(`${authUsername}:${authPassword}`).toString('base64');

  if (requireAuth && !constantTimeEquals(authorization, `Basic ${userAuth64}`)) {
    return new NextResponse('NOT_AUTHORIZED', { status: 401 });
  }

  try {
    // Kept as it came from the starter/draken: the probe calls the backend on its internal address, whose
    // certificate is not necessarily issued by a CA Node trusts. Only the backend's own health endpoint is
    // called and nothing sensitive is sent or relied on, so an unverified certificate is accepted here.
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const health = await axios
      .get<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/health/up`, { httpsAgent: agent })
      .then((res) => res.data);

    return new NextResponse(JSON.stringify(health), { status: 200 });
  } catch (error) {
    // The reason stays in the server log; the caller only learns that the backend is not healthy.
    console.error('Health check against the backend failed:', error instanceof Error ? error.message : error);
    return new NextResponse(JSON.stringify({ error: 'Backend health check failed', status: 'ERROR!' }), {
      status: 500,
    });
  }
};
