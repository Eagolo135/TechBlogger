"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveProfile } from "@/lib/community";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    saveProfile({
      name: name.trim(),
      email: email.trim(),
      createdAt: new Date().toISOString(),
    });

    router.push("/studio");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="panel panel-strong w-full rounded-[2rem] p-8 sm:p-10">
        <div className="flex items-center gap-3 text-sm text-[color:var(--muted)]">
          <UserPlus className="h-4 w-4" />
          Contributor onboarding
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Sign up to publish your own tech and AI posts
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[color:var(--muted)]">
          This static demo stores contributor accounts in your browser local storage. After signup,
          head to the studio and publish posts into the live feed on this device.
        </p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:max-w-xl">
          <label className="text-sm font-medium">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 outline-none ring-[color:var(--accent)] transition focus:ring-2"
              placeholder="Alex Morgan"
            />
          </label>
          <label className="text-sm font-medium">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 outline-none ring-[color:var(--accent)] transition focus:ring-2"
              placeholder="alex@example.com"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg">
              Continue to studio
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Back to homepage</Link>
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}