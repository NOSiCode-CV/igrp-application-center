'use client';

import { useEffect } from 'react';
import { signOut } from '@igrp/framework-next-auth/client';

export default function LogoutPage() {
  useEffect(() => {
    (async () => {
      let endSessionUrl = process.env.IGRP_LOGIN_URL || '/login';
      try {
        const res = await fetch('/api/auth/end-session-url', { cache: 'no-store' });
        const data = await res.json();
        if (typeof data?.url === 'string') endSessionUrl = data.url;
      } catch {}

      await signOut({ redirect: false });

      window.location.href = endSessionUrl;
    })();
  }, []);

  // TODO: apply design
  return <div>Logout in progress</div>;
}
