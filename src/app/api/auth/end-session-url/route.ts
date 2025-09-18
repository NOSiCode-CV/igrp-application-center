import { NextResponse } from 'next/server';
import { getServerSession } from '@igrp/framework-next-auth';
import { authOptions, buildKeycloakEndSessionUrl } from '@/lib/auth-options';

export async function GET() {
  const session = await getServerSession(authOptions);
  const jwtLike = { idToken: session?.idToken };

  try {
    const url = buildKeycloakEndSessionUrl(jwtLike);
    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ url: `${process.env.NEXTAUTH_URL || ''}/login` }, { status: 200 });
  }
}
