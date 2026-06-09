import { IgrpConfigError } from "@igrp/framework-next/errors";
import { redirect } from "next/navigation";

export default function Home() {
  const root = process.env.NEXT_PUBLIC_IGRP_APP_HOME_SLUG || "/";

  // Fail fast with a typed, translatable error rather than a raw `Error`
  // string. Caught by `(igrp)/error.tsx` → `IGRPSegmentError` → copy lookup
  // by `code` in `src/config/error-messages.ts`.
  if (!root.startsWith("/")) {
    throw new IgrpConfigError(
      "IGRP_APP_HOME_SLUG_INVALID",
      `NEXT_PUBLIC_IGRP_APP_HOME_SLUG must start with "/" — received "${root}".`,
      { receivedValue: root },
    );
  }

  if (root === "/") {
    return <div className="text-3xl font-bold">IGRP NEXT.js Template</div>;
  }

  redirect(root as Parameters<typeof redirect>[0]);
}
