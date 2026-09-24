"use client";

import { useId, useState } from "react";

import { Badge, Button } from "@igrp/igrp-framework-react-design-system";
import type { RoleDTO } from "@igrp/platform-access-management-client-ts";

import { computeEffectivePermissions } from "../lib/service-account-utils";

export function EffectivePermissionsCard({
  roles,
  directNames,
  isLoading,
  isError,
}: {
  roles: readonly Pick<RoleDTO, "code" | "permissions">[];
  directNames: readonly string[];
  isLoading: boolean;
  isError: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const result = computeEffectivePermissions(roles, directNames);
  const unknown = isLoading || isError;
  const count = (n: number) => (unknown ? "—" : String(n));

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id={`${id}-title`} className="font-semibold">
          Permissões efetivas
        </h3>
        <Button
          variant="outline"
          size="sm"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          disabled={unknown}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Ocultar lista" : "Ver lista completa"}
        </Button>
      </div>
      <dl className="grid grid-cols-3 gap-3">
        {[
          { key: "from-roles", label: "De perfis", value: result.fromRoles },
          { key: "direct", label: "Diretas", value: result.direct },
          { key: "total", label: "Total únicas", value: result.total },
        ].map((s) => (
          <div
            key={s.key}
            className="flex flex-col gap-1 rounded-lg bg-muted p-3"
          >
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd
              data-testid={`effective-${s.key}`}
              className="text-2xl font-semibold"
            >
              {count(s.value)}
            </dd>
          </div>
        ))}
      </dl>
      {isError ? (
        <p className="text-sm text-destructive">
          Não foi possível carregar os perfis, por isso as contagens estão
          incompletas.
        </p>
      ) : null}
      {open && !unknown ? (
        <ul
          id={`${id}-list`}
          className="flex flex-col divide-y divide-border rounded-lg border border-border"
        >
          {result.items.map((p) => (
            <li
              key={p.name}
              className="flex flex-wrap items-center gap-2 p-3 text-sm"
            >
              <span className="font-mono">{p.name}</span>
              {p.direct ? <Badge variant="secondary">direta</Badge> : null}
              {p.roleCodes.length ? (
                <span className="text-muted-foreground">
                  via {p.roleCodes.join(", ")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
