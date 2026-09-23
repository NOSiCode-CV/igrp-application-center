"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Input } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

export function UserListFilters() {
  const t = useTranslations("users.list.filters");
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex items-center gap-2">
      <Input
        type="search"
        aria-label={t("searchByName")}
        placeholder={t("searchByNamePlaceholder")}
        defaultValue={searchParams.get("name") ?? ""}
        onChange={(e) => updateParam("name", e.target.value)}
        className="w-64"
      />
      <Input
        type="search"
        aria-label={t("searchByEmail")}
        placeholder={t("searchByEmailPlaceholder")}
        defaultValue={searchParams.get("email") ?? ""}
        onChange={(e) => updateParam("email", e.target.value)}
        className="w-64"
      />
    </div>
  );
}
