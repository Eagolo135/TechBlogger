"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile, saveProfile } from "@/lib/community";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function decodeGoogleCredential(credential: string): {
  name?: string;
  email?: string;
  picture?: string;
} {
  const tokenPart = credential.split(".")[1];
  if (!tokenPart) {
    return {};
  }

  try {
    const normalized = tokenPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as { name?: string; email?: string; picture?: string };
  } catch {
    return {};
  }
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (getProfile()) {
      router.replace("/profile");
    }
  }, [router]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleReady) {
      return;
    }

    if (!window.google?.accounts.id || !googleButtonRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        const payload = decodeGoogleCredential(response.credential);

        if (!payload.name || !payload.email) {
          setGoogleError("Google sign-in did not return a valid profile.");
          return;
        }

        saveProfile({
          name: payload.name,
          email: payload.email,
          createdAt: new Date().toISOString(),
          provider: "google",
          avatarUrl: payload.picture,
        });

        router.push("/studio");
      },
    });

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "pill",
      width: 320,
    });
  }, [googleReady, router]);

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
      provider: "local",
    });

    router.push("/studio");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
      />
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

        <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-white/75 p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LogIn className="h-4 w-4 text-[color:var(--accent-cool)]" />
            Quick sign-in with Google
          </div>
          {GOOGLE_CLIENT_ID ? (
            <>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Use your Google account and jump straight into the writing studio.
              </p>
              <div ref={googleButtonRef} className="mt-4 min-h-11" />
              {googleError ? <p className="mt-2 text-sm text-red-600">{googleError}</p> : null}
            </>
          ) : (
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Add <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in your environment to enable Google sign-in.
            </p>
          )}
        </div>

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