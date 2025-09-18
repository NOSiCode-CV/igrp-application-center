'use client';

import { signOut } from "@igrp/framework-next-auth/client";
import { useEffect } from "react";

export default function LogoutPage() {
   useEffect(() => {
    signOut({ redirect: false }).finally(() => {
      const callbackUrl = window.location.origin;
      window.location.href = `/api/auth/keycloak-logout?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    });
  }, []);

  return null;
}
