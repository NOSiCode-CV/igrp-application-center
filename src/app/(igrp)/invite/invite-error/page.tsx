"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AppCenterLoading } from "@/components/loading";

export default function InviteErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      router.replace(`/invite/accept?token=${encodeURIComponent(token)}`);
    } else {
      router.replace("/invite/accept");
    }
  }, [token, router]);

  return <AppCenterLoading description="A redireccionar..." />;
}
