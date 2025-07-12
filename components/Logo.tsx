import { cn } from "@/lib/utils";
import { SquareDashedMousePointer } from "lucide-react";
import Link from "next/link";
import React from "react";

function Logo({
  fontSize = "2xl",
  iconSize = 20,
}: {
  fontSize?: string;
  iconSize?: number;
}) {
  return (
    <Link
      className={cn(
        "text-2xl font-extrabold flex items-center gap-2",
        fontSize
      )}
      href="/"
    >
     <div className="rounded-xl bg-gradient-to-r from-slate-400 to-slate-500 p-2">
  <SquareDashedMousePointer size={iconSize} className="stroke-black" />
</div>
<div>
  <span className="bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">
    auto
  </span>
  <span className="text-neutral-700 dark:text-neutral-300">scrape</span>
</div>

    </Link>
  );
}

export default Logo;
