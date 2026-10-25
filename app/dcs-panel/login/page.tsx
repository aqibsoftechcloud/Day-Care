"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ShieldPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, status } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  // Already authenticated? Don't show the login form.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dcs-panel");
    }
  }, [status, router]);

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    try {
      await login(values.email, values.password);
      router.push("/dcs-panel");
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    }
  };

  if (status === "authenticated" || status === "loading") {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldPlus className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Day Care Surgeries
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">CMS Admin Sign In</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
            {apiError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {apiError}
              </div>
            )}

            <Field data-invalid={!!errors.email || undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                aria-invalid={!!errors.email || undefined}
                placeholder="you@example.com"
                className="h-10"
                {...register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={!!errors.password || undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password || undefined}
                  placeholder="••••••••"
                  className="h-10 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              <FieldError errors={[errors.password]} />
            </Field>

            <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
