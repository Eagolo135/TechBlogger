"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PROFILE_CHANGED_EVENT,
  getProfile,
  type CommunityProfile,
} from "@/lib/community";

export function HeaderAuthControls() {
  const [profile, setProfile] = useState<CommunityProfile | null>(null);

  useEffect(() => {
    const syncProfile = () => {
      setProfile(getProfile());
    };

    syncProfile();
    window.addEventListener(PROFILE_CHANGED_EVENT, syncProfile);
    window.addEventListener("storage", syncProfile);

    return () => {
      window.removeEventListener(PROFILE_CHANGED_EVENT, syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, []);

  if (profile) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/profile">Profile</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/studio">Studio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/signup">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/latest">Read now</Link>
      </Button>
    </div>
  );
}
