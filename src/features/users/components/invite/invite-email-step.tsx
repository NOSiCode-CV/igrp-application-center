"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPButton,
  IGRPIcon,
  Input,
} from "@igrp/igrp-framework-react-design-system";
import { useForm } from "react-hook-form";
import {
  type InviteEmailFormArgs,
  InviteEmailFormSchema,
} from "../../user-schema";

interface InviteEmailStepProps {
  defaultEmail?: string;
  error?: string;
  isSubmitting: boolean;
  onSubmit: (email: string) => void;
}

export function InviteEmailStep({
  defaultEmail,
  error,
  isSubmitting,
  onSubmit,
}: InviteEmailStepProps) {
  const form = useForm<InviteEmailFormArgs>({
    resolver: zodResolver(InviteEmailFormSchema),
    mode: "onChange",
    defaultValues: { email: defaultEmail ?? "" },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values.email.trim());
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <IGRPIcon iconName="Mail" className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Bem-vindo</h2>
        <p className="text-sm text-muted-foreground">
          Introduza o seu email para aceder ao convite
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <IGRPIcon
                      iconName="Mail"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="exemplo@email.com"
                      className="h-12 rounded-xl pl-12"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
                {error && !form.formState.errors.email ? (
                  <p
                    role="alert"
                    className="text-sm font-medium text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
              </FormItem>
            )}
          />

          <IGRPButton
            type="submit"
            className="h-12 w-full rounded-xl"
            disabled={isSubmitting || !form.formState.isValid}
            showIcon
            iconName="ArrowRight"
            iconPlacement="end"
          >
            {isSubmitting ? "A enviar..." : "Enviar Código"}
          </IGRPButton>
        </form>
      </Form>
    </div>
  );
}
