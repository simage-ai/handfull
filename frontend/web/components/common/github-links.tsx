"use client";

import { Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GITHUB_REPO_URL } from "@/lib/config";

export function GitHubLinks() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <a
              href={`${GITHUB_REPO_URL}/issues/new`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Report an issue"
            >
              <Bug className="h-4 w-4" />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Report an issue</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
