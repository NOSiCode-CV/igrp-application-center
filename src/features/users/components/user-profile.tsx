"use client";

import {
  IGRPButtonPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardPrimitive,
  IGRPCardTitlePrimitive,
  IGRPIcon,
  IGRPTabsContentPrimitive,
  IGRPTabsListPrimitive,
  IGRPTabsPrimitive,
  IGRPTabsTriggerPrimitive,
  IGRPUserAvatar,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { ButtonLink } from "@/components/button-link";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { PageHeader } from "@/components/page-header";
import {
  useCurrentUser,
  useRemoveUserRole,
  useUserRoles,
} from "@/features/users/use-users";
import { ROUTES } from "@/lib/constants";
import { getInitials } from "@/lib/utils";

export function UserProfile() {
  const { data: user, isLoading, error: userError } = useCurrentUser();
  const { data: userRoles } = useUserRoles(user?.username);

  const { mutateAsync: removeUserRole } = useRemoveUserRole();

  const { igrpToast } = useIGRPToast();

  if (isLoading && !user) {
    return <AppCenterLoading descrption="Carregando utilizador..." />;
  }

  if (userError) throw userError;

  if (!user) {
    return (
      <AppCenterNotFound
        iconName="User"
        title="Nenhum utilizador encontrada."
      />
    );
  }

  const handleName = (value: string) => {
    const SENTINEL = "§§§"; // safe placeholder

    return value
      .replace(/iGRP/g, SENTINEL)
      .replace(/[_\-.]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map((w) => (w.includes(SENTINEL) ? "iGRP" : w.toLowerCase()))
      .join(" ");
  };

  const handleRevokeRole = async (name: string) => {
    if (!name) return;

    try {
      await removeUserRole({ username: user.username, roleNames: [name] });
      igrpToast({
        type: "success",
        title: "Perfil removido com sucesso.",
      });
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Não foi possivel remover o perfil.",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      <PageHeader
        title="Perfil do Utilizador"
        showBackButton
        linkBackButton={ROUTES.USERS}
        showActions
      >
        <ButtonLink
          href={`${ROUTES.USER_PROFILE}/${ROUTES.EDIT}`}
          icon="UserPen"
          label="Editar"
        />
      </PageHeader>

      <div className="flex flex-col gap-6">
        <IGRPCardPrimitive>
          <IGRPCardHeaderPrimitive>
            <IGRPCardTitlePrimitive>
              Informações do Utilizador
            </IGRPCardTitlePrimitive>
            <IGRPCardDescriptionPrimitive>
              Informação Básica
            </IGRPCardDescriptionPrimitive>
          </IGRPCardHeaderPrimitive>
          <IGRPCardContentPrimitive>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 text-sm gap-4">
              <div>
                <dt className="font-medium text-muted-foreground">
                  Nome Completo
                </dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Username</dt>
                <dd>{user.username}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div className="flex flex-col gap-3">
                <dt className="font-medium text-muted-foreground">Avatar</dt>
                <dd>
                  <IGRPUserAvatar
                    alt={user.name}
                    fallbackContent={getInitials(user.name)}
                    className="size-12 bg-white/50"
                    fallbackClass="text-base"
                  />
                </dd>
              </div>
              <div className="flex flex-col gap-3">
                <dt className="font-medium text-muted-foreground">
                  Assinatura
                </dt>
                <dd>
                  {/* {getSignature?.link ? (
                          <Image
                            src={getSignature.link}
                            alt='Signature preview'
                            className='object-contain h-30 max-w-50 w-full bg-white/80 rounded-md'
                            width={300}
                            height={100}
                          />
                        ) : (
                          'N/A'
                        )} */}
                </dd>
              </div>
            </dl>
          </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>

        {userRoles && userRoles.length > 0 && (
          <div className="flex flex-col gap-6">
            <IGRPTabsPrimitive defaultValue="permissions" className="w-full">
              <IGRPTabsListPrimitive className="dark:bg-slate-900/50">
                <IGRPTabsTriggerPrimitive
                  value="permissions"
                  className="dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white"
                >
                  Permissões
                </IGRPTabsTriggerPrimitive>
              </IGRPTabsListPrimitive>

              {userRoles && userRoles.length > 0 && (
                <IGRPTabsContentPrimitive value="permissions" className="mt-4">
                  <IGRPCardPrimitive className="py-3">
                    <IGRPCardContentPrimitive>
                      <div className="space-y-4">
                        {userRoles.map((role) => (
                          <div
                            key={role.id}
                            className="flex items-center justify-between rounded-lg border-b p-4"
                          >
                            <div className="flex items-center gap-4">
                              <div className="rounded-full bg-primary/10 p-2">
                                <IGRPIcon
                                  iconName="Shield"
                                  className="text-primary"
                                />
                              </div>
                              <div>
                                <p className="capitalize">
                                  {handleName(role.description || role.name)}
                                </p>
                              </div>
                            </div>
                            <IGRPButtonPrimitive
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeRole(role.name)}
                            >
                              Revogar
                            </IGRPButtonPrimitive>
                          </div>
                        ))}
                      </div>
                    </IGRPCardContentPrimitive>
                  </IGRPCardPrimitive>
                </IGRPTabsContentPrimitive>
              )}
            </IGRPTabsPrimitive>
          </div>
        )}
      </div>
    </div>
  );
}
