"use client";

import {
  Badge,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  IGRPButton,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";

// Mirrors the SDK's `CodeDescriptionDTO`, which is not re-exported from
// `@igrp/platform-access-management-client-ts`. Used as the shape for
// invitation department/role entries.
interface CodeDescriptionLike {
  code?: string;
  description?: string;
}

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
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
      session.user?.email
    ) {
      if (session.user.email !== invitation.email) {
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
    session.user?.email === invitation.email;

  if (isReady) {
    hasShownPage.current = true;
  }

  if (
    hasShownPage.current &&
    invitation &&
    !error &&
    sessionStatus !== "unauthenticated"
  ) {
  } else if (
    !token ||
    error ||
    isLoadingInvitation ||
    !invitation ||
    (session && session.user?.email !== invitation?.email)
  ) {
    return <AppCenterLoading descrption="Validando convite..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 bg- rounded-full flex items-center justify-center mb-4">
            <IGRPIcon iconName="Mail" className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Aceitar convite</CardTitle>
          {/* <CardDescription>
            Você foi convidado para 
          </CardDescription> */}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <IGRPIcon
                iconName="Mail"
                className="w-4 h-4 text-muted-foreground"
              />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{invitation.email}</span>
            </div>

            {(() => {
              // SDK declares `department` as a single CodeDescriptionDTO,
              // but the runtime returns an array. Cast at the access boundary.
              const departments = (invitation.department ??
                []) as unknown as CodeDescriptionLike[];
              if (departments.length === 0) return null;
              return (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <IGRPIcon
                      iconName="Shield"
                      className="w-4 h-4 text-muted-foreground"
                    />
                    <span className="text-muted-foreground">Departamento:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {departments.map((dept: CodeDescriptionLike) => (
                      <Badge
                        key={dept.code ?? dept.description}
                        variant="outline"
                      >
                        {dept.description || dept.code}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })()}

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
                  {invitation.roles.map((role: CodeDescriptionLike) => (
                    <Badge
                      key={role.code ?? role.description}
                      variant="outline"
                    >
                      {role.description || role.code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-3 pt-6">
          <IGRPButton
            variant="ghost"
            className="flex-1"
            onClick={handleDecline}
            disabled={isAccepting}
          >
            Recusar
          </IGRPButton>
          <IGRPButton
            className="flex-1"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? "Processando..." : "Aceitar Convite"}
          </IGRPButton>
        </CardFooter>
      </Card>
    </div>
  );
}
