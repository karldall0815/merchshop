"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        identifier: String(fd.get("identifier") ?? ""),
        password: String(fd.get("password") ?? ""),
        redirect: false,
      });
      if (res?.error) {
        setError("Login fehlgeschlagen.");
        return;
      }
      // Full reload so the home page re-evaluates session from cookies. A
      // router.push doesn't always pick up the freshly-set httpOnly session
      // cookie in Next 16.
      window.location.assign(params.get("callbackUrl") ?? "/");
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-lg border bg-card p-6">
      <h1 className="text-xl font-semibold">Anmeldung</h1>
      <div className="space-y-2">
        <Label htmlFor="identifier">E-Mail oder Benutzername</Label>
        <Input id="identifier" name="identifier" type="text" required autoFocus autoComplete="username" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "…" : "Anmelden"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
