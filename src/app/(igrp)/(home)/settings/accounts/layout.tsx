import { PageHeader } from "@/components/page-header";
import { AccountsTabs } from "@/features/accounts/components/accounts-tabs";

export default function AccountsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contas e Serviços"
        description="Identidades que acedem às APIs do iGRP: clientes OAuth e as contas de serviço que os envolvem."
        showBackButton
        linkBackButton="/settings"
      />
      <AccountsTabs />
      {children}
    </div>
  );
}
