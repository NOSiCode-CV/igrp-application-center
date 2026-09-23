import type { Metadata } from "next";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@igrp/igrp-framework-react-design-system";

export const metadata: Metadata = { title: "Contas de Serviço" };

export default function ServiceAccountsPage() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Contas de serviço ainda não disponíveis</EmptyTitle>
        <EmptyDescription>
          A gestão de contas de serviço chega numa próxima versão. Os clientes
          OAuth já podem ser geridos no separador ao lado.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
