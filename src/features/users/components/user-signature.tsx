"use client";

import Image from "next/image";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import {
  Card,
  CardContent,
  cn,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";

import { useFiles } from "@/features/files/use-files";
import { useUserProfileActions } from "@/features/users/hooks/use-user-profile-actions";

export default function UserSignature({ user }: { user: IGRPUserDTO }) {
  const { uploadSignature, isUploadingSignature } = useUserProfileActions(user);

  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [uploadedSignaturePath, setUploadedSignaturePath] = useState<
    string | null
  >(null);

  const { data: signatureUrl, isLoading: isLoadingFile } = useFiles(
    user?.signature || uploadedSignaturePath || "",
  );

  const signatureInputRef = useRef<HTMLInputElement>(null);

  const handleSignatureChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const path = await uploadSignature(file);
      setUploadedSignaturePath(path);
    } catch {
      // Errors are surfaced via toast inside uploadSignature.
    } finally {
      if (signatureInputRef.current) signatureInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (signatureUrl) {
      setSignaturePreview(signatureUrl.url);
      setUploadedSignaturePath(null);
    }
  }, [signatureUrl]);

  const currentSignatureUrl = signaturePreview || signatureUrl?.url || null;

  return (
    <Card className="py-2">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                Assinatura Digital
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Carregue sua assinatura para documentos oficiais
              </p>
            </div>
          </div>

          <button
            type="button"
            className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-muted/20 hover:bg-muted/30 w-full p-0 text-left"
            onClick={() => signatureInputRef.current?.click()}
          >
            {currentSignatureUrl ? (
              <div className="relative p-6 min-h-24 flex items-center justify-center">
                <Image
                  src={currentSignatureUrl}
                  alt="Assinatura"
                  width={160}
                  height={80}
                  unoptimized
                  className="max-h-20 max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-full p-3 shadow-lg">
                    <IGRPIcon
                      iconName={
                        isLoadingFile || isUploadingSignature
                          ? "LoaderCircle"
                          : "Upload"
                      }
                      className={cn(
                        "size-5 text-primary",
                        (isLoadingFile || isUploadingSignature) &&
                          "animate-spin",
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center gap-3">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <IGRPIcon iconName="Upload" className="size-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">Clique para carregar</p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG até 5MB
                  </p>
                </div>
              </div>
            )}

            <input
              ref={signatureInputRef}
              type="file"
              accept="image/*"
              onChange={handleSignatureChange}
              className="hidden"
              disabled={isUploadingSignature}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
