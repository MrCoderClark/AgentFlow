"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TokenResponse } from "@/types";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found.");
      return;
    }

    api.post<TokenResponse>("/api/auth/verify-email", { token })
      .then((res) => {
        localStorage.setItem("access_token", res.access_token);
        localStorage.setItem("refresh_token", res.refresh_token);
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Verification failed");
      });
  }, [token]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        {status === "verifying" && (
          <>
            <CardTitle className="text-2xl">Verifying your email…</CardTitle>
            <CardDescription>Please wait a moment.</CardDescription>
          </>
        )}
        {status === "success" && (
          <>
            <CardTitle className="text-2xl">Email verified!</CardTitle>
            <CardDescription>Your account is ready.</CardDescription>
            <Button className="mt-4" onClick={() => router.push("/inbox")}>Go to inbox</Button>
          </>
        )}
        {status === "error" && (
          <>
            <CardTitle className="text-2xl">Verification failed</CardTitle>
            <CardDescription className="text-destructive">{errorMsg}</CardDescription>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/login")}>Back to login</Button>
          </>
        )}
      </CardHeader>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="text-muted-foreground">Verifying…</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
