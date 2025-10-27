import { NextApiRequest } from 'next';
import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';

export async function getAccessToken() {
  const cookieStore = await cookies();

  const token = await getToken({
    req: {
      cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value])),
    } as NextApiRequest,
    secret: process.env.NEXTAUTH_SECRET || '',
  });

  return token;
}
