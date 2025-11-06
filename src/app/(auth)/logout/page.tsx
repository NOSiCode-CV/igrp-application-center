"use client";

import { signOut } from "@igrp/framework-next-auth/client";
import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    (async () => {
      await signOut({ redirect: false });
    })();
  }, []);

  // TODO: apply design
  return <div>Logout in progress</div>;
}
