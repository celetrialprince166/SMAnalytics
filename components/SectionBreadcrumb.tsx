'use client'

import { ChevronRight, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface SectionBreadcrumbProps {
  items: BreadcrumbItem[];
}

export const SectionBreadcrumb = ({ items }: SectionBreadcrumbProps) => {
  const router = useRouter();

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard")}
        className="h-8 px-2"
      >
        <Home className="h-4 w-4" />
      </Button>
      {items.map((item, index) => (
        <div key={item.path} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {index === items.length - 1 ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(item.path)}
              className="h-8 px-2 hover:text-foreground"
            >
              {item.label}
            </Button>
          )}
        </div>
      ))}
    </nav>
  );
};
