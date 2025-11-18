import { useFiles, useUploadPublicFiles } from '@/features/files/use-files';
import { cn, IGRPCardContentPrimitive, IGRPCardPrimitive, IGRPIcon, useIGRPToast } from '@igrp/igrp-framework-react-design-system'
import { IGRPUserDTO } from '@igrp/platform-access-management-client-ts';
import React, { useEffect, useRef, useState } from 'react'

export default function UserSignature({
    user,
    refetch
}: {
    user: IGRPUserDTO;
    refetch: any
}) {
    
  const { igrpToast } = useIGRPToast();
  
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
 const [uploadedSignaturePath, setUploadedSignaturePath] = useState<
    string | null
  >(null);
  
  const { data: signatureUrl } = useFiles(uploadedSignaturePath || "");

const uploadFile = useUploadPublicFiles();
     const signatureInputRef = useRef<HTMLInputElement>(null);

    const handleSignatureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadFile.mutateAsync({
        file: formData,
        options: {
          folder: `users/${user.id}/signature`,
        },
      });

      setUploadedSignaturePath(result);
      refetch();
      igrpToast({
        type: "success",
        title: "Assinatura atualizada com sucesso",
        duration: 4000,
      });
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro ao atualizar assinatura",
        description: (err as Error).message,
        duration: 4000,
      });
    }
  };

   useEffect(() => {
      if (signatureUrl) {
        setSignaturePreview(signatureUrl.url);
        setUploadedSignaturePath(null);
      }
    }, [signatureUrl]);

  const currentSignatureUrl = signaturePreview || user.signature || null;

  return (
    <IGRPCardPrimitive>
        <IGRPCardContentPrimitive className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IGRPIcon
                      iconName="PenTool"
                      className="w-4 h-4 text-primary"
                    />
                  </div>
                  Assinatura Digital
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Carregue sua assinatura para documentos oficiais
                </p>
              </div>
            </div>

            <div
              className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-all bg-muted/20 hover:bg-muted/30"
              onClick={() => signatureInputRef.current?.click()}
            >
              {currentSignatureUrl ? (
                <div className="relative p-6 min-h-[100px] flex items-center justify-center">
                  <img
                    src={currentSignatureUrl}
                    alt="Assinatura"
                    className="max-h-20 max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-full p-3 shadow-lg">
                      <IGRPIcon
                        iconName={
                          uploadFile.isPending ? "LoaderCircle" : "Upload"
                        }
                        className={cn(
                          "w-5 h-5 text-primary",
                          uploadFile.isPending && "animate-spin"
                        )}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <IGRPIcon
                      iconName="Upload"
                      className="w-6 h-6 text-primary"
                    />
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
                disabled={uploadFile.isPending}
              />
            </div>
          </div>
        </IGRPCardContentPrimitive>
      </IGRPCardPrimitive>

  )
}
