"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { LogOut, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearProfile, getProfile, type CommunityProfile } from "@/lib/community";

export default function ProfilePage() {
  const router = useRouter();
  const [profile] = useState<CommunityProfile | null>(() => getProfile());

  useEffect(() => {
    if (!profile) {
      router.replace("/signup");
    }
  }, [profile, router]);

  function onSignOut() {
    clearProfile();
    router.push("/");
  }

  if (!profile) {
    return null;
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="panel panel-strong rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-center gap-2 text-sm text-[color:var(--accent-cool)]">
          <UserCircle2 className="h-4 w-4" />
          Your profile
        </div>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Welcome back, {profile.name}</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
            <p className="text-xs text-[color:var(--muted)]">Email</p>
            <p className="mt-1 text-base font-medium">{profile.email}</p>
          </article>
          <article className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
            <p className="text-xs text-[color:var(--muted)]">Signed up</p>
            <p className="mt-1 text-base font-medium">{format(new Date(profile.createdAt), "MMM d, yyyy")}</p>
          </article>
          <article className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
            <p className="text-xs text-[color:var(--muted)]">Sign-in method</p>
            <p className="mt-1 text-base font-medium capitalize">{profile.provider ?? "local"}</p>
          </article>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/studio">Open studio</Link>
          </Button>
          <Button variant="outline" onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </section>
    </main>
  );
}
