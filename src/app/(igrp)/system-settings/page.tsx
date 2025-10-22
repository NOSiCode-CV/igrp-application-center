"use client";

import { IGRPTemplateThemeSelector } from "@igrp/framework-next-ui";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>
      <IGRPTemplateThemeSelector />
    </div>
  );
}
