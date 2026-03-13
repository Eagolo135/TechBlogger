import { LandingPage } from "@/components/site/landing-page";
import { getSiteContent } from "@/lib/content";

export default function Home() {
  const content = getSiteContent();

  return <LandingPage content={content} />;
}
