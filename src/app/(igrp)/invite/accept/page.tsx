"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  IGRPCardPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPCardContentPrimitive,
  IGRPCardFooterPrimitive,
  IGRPButton,
  IGRPIcon,
  IGRPBadgePrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { AppCenterLoading } from "@/components/loading";
import {
  useGetUserInvitationByToken,
  useRespondUserInvitation,
} from "@/features/users/use-users";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession({
    required: false,
  });
  const respondMutation = useRespondUserInvitation();
  const { igrpToast } = useIGRPToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const hasShownPage = useRef(false);
  const token = searchParams.get("token");

  const {
    data: invitation,
    isLoading: isLoadingInvitation,
    error,
  } = useGetUserInvitationByToken(token || "");

  useEffect(() => {
    if (!token) {
      router.push("/");
    }
  }, [token, router]);

  useEffect(() => {
    if (
      sessionStatus === "authenticated" &&
      !isLoadingInvitation &&
      session &&
      invitation &&
      (session as any)?.email
    ) {
      const userEmail = (session as any).email;
      if (userEmail !== invitation.email) {
        router.replace(`/invite/invite-error?token=${token}`);
      }
    }
  }, [session, sessionStatus, invitation, isLoadingInvitation, token, router]);

  useEffect(() => {
    if (error) {
      igrpToast({
        type: "error",
        title: "Convite inválido",
        description: "O convite não foi encontrado ou expirou",
        duration: 4000,
      });
      setTimeout(() => router.push("/"), 2000);
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
          router.push("/");
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
    if (!token) return;

    setIsAccepting(true);
    respondMutation.mutate(
      {
        response: {
          email: invitation.email,
          accept: false,
        },
        token,
      },
      {
        onSuccess: () => {
          router.push("/");
        },
        onError: (error) => {
          igrpToast({
            type: "error",
            title: "Erro ao rejeitar convite",
            description: (error as Error).message,
            duration: 4000,
          });
          setIsAccepting(false);
        },
      },
    );
  };

  const isReady = 
    token &&
    !error &&
    !isLoadingInvitation &&
    invitation &&
    sessionStatus === "authenticated" &&
    session &&
    (session as any)?.email === invitation.email;

  if (isReady) {
    hasShownPage.current = true;
  }

  if (hasShownPage.current && invitation && !error && sessionStatus !== "unauthenticated") {
  } else if (!token || error || isLoadingInvitation || !invitation || 
             (session && (session as any)?.email !== invitation?.email)) {
    return <AppCenterLoading descrption="Validando convite..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <IGRPCardPrimitive className="w-full max-w-md">
        <IGRPCardHeaderPrimitive className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 bg- rounded-full flex items-center justify-center mb-4">
            <IGRPIcon iconName="Mail" className="w-6 h-6 text-primary" />
          </div>
          <IGRPCardTitlePrimitive>Aceitar convite</IGRPCardTitlePrimitive>
          {/* <IGRPCardDescriptionPrimitive>
            Você foi convidado para 
          </IGRPCardDescriptionPrimitive> */}
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

            {invitation.department && invitation.department.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <IGRPIcon
                    iconName="Shield"
                    className="w-4 h-4 text-muted-foreground"
                  />
                  <span className="text-muted-foreground">Departamento:</span>
                </div>
                <div className="flex gap-2">
                  {invitation.department.map((role: any, index: number) => (
                    <IGRPBadgePrimitive key={index} variant="secondary">
                      {role.description || role.code}
                    </IGRPBadgePrimitive>
                  ))}
                </div>
              </div>
            )}

            {invitation.roles && invitation.roles.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <IGRPIcon
                    iconName="Shield"
                    className="w-4 h-4 text-muted-foreground"
                  />
                  <span className="text-muted-foreground">Perfis:</span>
                </div>
                <div className="flex gap-2">
                  {invitation.roles.map((role: any, index: number) => (
                    <IGRPBadgePrimitive key={index} variant="secondary">
                      {role.description || role.code}
                    </IGRPBadgePrimitive>
                  ))}
                </div>
              </div>
            )}
          </div>
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
            {isAccepting ? "Aguarde..." : "Rejeitar Convite"}
          </IGRPButton>
          <IGRPButton
            className="flex-1 bg-green-600 hover:bg-green-700 text-white hover:text-white"
            onClick={handleAccept}
            disabled={isAccepting}
            showIcon
            iconName={isAccepting ? "LoaderCircle" : "Check"}
            iconPlacement="start"
          >
            {isAccepting ? "Aguarde..." : "Aceitar Convite"}
          </IGRPButton>
        </IGRPCardFooterPrimitive>
      </IGRPCardPrimitive>
    </div>
  );
}
