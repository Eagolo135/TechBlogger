"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-3", className)} {...props} />;
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn("inline-flex items-center", className)} {...props} />;
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-[color:var(--line)] bg-white/75 px-4 py-2 text-sm font-medium text-[color:var(--muted)] transition data-[state=active]:bg-slate-950 data-[state=active]:text-slate-50",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger };