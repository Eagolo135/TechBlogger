import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("rounded-[1.5rem] border border-[color:var(--line)]", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn(className)} {...props} />;
}

export { Card, CardContent };