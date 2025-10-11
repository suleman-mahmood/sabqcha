'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Page() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">Welcome</h1>
      <p className="text-sm text-muted-foreground mb-6">Use the header to log in (teachers), add invite codes, or log out. Once signed in you will be redirected to the dashboard.</p>
      <div>
        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    </main>
  );
}
