"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  IGRPCardPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardFooterPrimitive,
  IGRPButton,
  IGRPIcon,
  IGRPBadgePrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { AppCenterLoading } from "@/components/loading";
import { ROUTES } from "@/lib/constants";
import {
  useGetUserInvitationByToken,
  useRespondUserInvitation,
} from "@/features/users/use-users";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const respondMutation = useRespondUserInvitation();
  const { igrpToast } = useIGRPToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const token = searchParams.get("token");

  const {
    data: invitation,
    isLoading,
    error,
  } = useGetUserInvitationByToken(token || "");

  useEffect(() => {
    if (!token) {
      router.push(ROUTES.APPLICATIONS);
    }
  }, [token, router]);

  useEffect(() => {
    if (error) {
      igrpToast({
        type: "error",
        title: "Convite inválido",
        description: "O convite não foi encontrado ou expirou",
        duration: 4000,
      });
      setTimeout(() => router.push(ROUTES.APPLICATIONS), 2000);
    }
  }, [error, router, igrpToast]);

  const handleAccept = async () => {
    if (!token) return;

    setIsAccepting(true);

    respondMutation.mutate(
      {
        response: {
          email: invitation.email,
          accept: true,
        },
        token,
      },
      {
        onSuccess: () => {
          igrpToast({
            type: "success",
            title: "Convite aceito",
            description: "Você agora tem acesso à aplicação",
            duration: 4000,
          });
          router.push(ROUTES.APPLICATIONS);
        },
        onError: (error) => {
          igrpToast({
            type: "error",
            title: "Erro ao aceitar convite",
            description: (error as Error).message,
            duration: 4000,
          });
          setIsAccepting(false);
        },
      },
    );
  };

  const handleDecline = () => {
    router.push(ROUTES.APPLICATIONS);
  };

  if (!token || isLoading) {
    return <AppCenterLoading descrption="Carregando convite..." />;
  }

  if (error || !invitation) {
    return <AppCenterLoading descrption="Redirecionando..." />;
  }

  const isExpired = new Date(invitation.expiry) < new Date();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <IGRPCardPrimitive className="w-full max-w-md">
        <IGRPCardHeaderPrimitive className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <IGRPIcon iconName="Mail" className="w-6 h-6 text-primary" />
          </div>
          <IGRPCardTitlePrimitive>Aceitar convite</IGRPCardTitlePrimitive>
          <IGRPCardDescriptionPrimitive>
            Você foi convidado para participar da aplicação
          </IGRPCardDescriptionPrimitive>
        </IGRPCardHeaderPrimitive>

        <IGRPCardContentPrimitive className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <IGRPIcon
                iconName="Mail"
                className="w-4 h-4 text-muted-foreground"
              />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{invitation.email}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <IGRPIcon
                iconName="Calendar"
                className="w-4 h-4 text-muted-foreground"
              />
              <span className="text-muted-foreground">Data do convite:</span>
              <span className="font-medium">
                {new Date(invitation.invitationDate).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <IGRPIcon
                iconName="Clock"
                className="w-4 h-4 text-muted-foreground"
              />
              <span className="text-muted-foreground">Expira em:</span>
              <span
                className={`font-medium ${isExpired ? "text-destructive" : ""}`}
              >
                {new Date(invitation.expiry).toLocaleDateString()}
              </span>
            </div>

            {invitation.roles && invitation.roles.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <IGRPIcon
                    iconName="Shield"
                    className="w-4 h-4 text-muted-foreground"
                  />
                  <span className="text-muted-foreground">Perfis:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {invitation.roles.map((role: any, index: number) => (
                    <IGRPBadgePrimitive key={index} variant="secondary">
                      {role.description || role.code}
                    </IGRPBadgePrimitive>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isExpired && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
              <IGRPIcon
                iconName="AlertTriangle"
                className="w-4 h-4 text-destructive mt-0.5"
              />
              <div className="text-sm text-destructive">
                <p className="font-medium">Convite expirado</p>
                <p className="text-xs mt-1">
                  Este convite não está mais válido. Entre em contato com o
                  administrador.
                </p>
              </div>
            </div>
          )}
        </IGRPCardContentPrimitive>

        <IGRPCardFooterPrimitive className="flex gap-3">
          <IGRPButton
            className="flex-1 bg-red-500 hover:bg-red-600 text-white hover:text-white"
            onClick={handleDecline}
            showIcon
            iconName="X"
            iconPlacement="start"
            disabled={isAccepting}
          >
            Recusar
          </IGRPButton>
          <IGRPButton
            className="flex-1 bg-green-600 hover:bg-green-700 text-white hover:text-white"
            onClick={handleAccept}
            disabled={isAccepting || isExpired}
            showIcon
            iconName={isAccepting ? "LoaderCircle" : "Check"}
            iconPlacement="start"
          >
            {isAccepting ? "Aceitando..." : "Aceitar Convite"}
          </IGRPButton>
        </IGRPCardFooterPrimitive>
      </IGRPCardPrimitive>
    </div>
  );
}
