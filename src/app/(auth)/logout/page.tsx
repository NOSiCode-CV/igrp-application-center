'use client';

import { useEffect } from 'react';
import { signOut } from '@igrp/framework-next-auth/client';
import Cookies from 'js-cookie';

export default function LogoutPage() {
  console.log("::: LOGOUT :::")
  console.log({ Cookies })
  useEffect(() => {
    Cookies.remove('userToken');
    signOut({ callbackUrl: '/login' });
  }, []);

  return null;
}
