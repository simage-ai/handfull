"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Home,
  UtensilsCrossed,
  ClipboardList,
  Settings,
  PlusCircle,
  BookOpen,
  Dumbbell,
  Rss,
} from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/config";

// Dynamic import to avoid SSR issues with the GitHub button
const GitHubButton = dynamic(() => import("react-github-btn"), { ssr: false });

// Extract owner and repo from URL
const getRepoInfo = () => {
  const match = GITHUB_REPO_URL.match(/github\.com\/([^/]+)\/([^/]+)/);
  return match ? { owner: match[1], repo: match[2] } : null;
};
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const menuItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Feed", url: "/feed", icon: Rss },
  { title: "Meals", url: "/meals", icon: UtensilsCrossed },
  { title: "Workouts", url: "/workouts", icon: Dumbbell },
  { title: "Plans", url: "/plans", icon: ClipboardList },
  { title: "Portion Guide", url: "/guide", icon: BookOpen },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { setOpenMobile, isMobile } = useSidebar();

  const handleAddOption = (type: "meal" | "workout") => {
    setAddDialogOpen(false);
    if (isMobile) setOpenMobile(false);
    router.push(type === "meal" ? "/add-meal" : "/add-work");
  };

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" onClick={handleNavClick}>
            <Logo width={50} height={50} showName={false} />
          </Link>
          <div className="flex flex-col">
            <Link href="/dashboard" onClick={handleNavClick} className="text-xl font-bold tracking-tight hover:text-primary transition-colors">
              HandFull
            </Link>
            <span className="text-xs text-muted-foreground">
              by{" "}
              <a
                href="https://simage.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Simage
              </a>
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        {getRepoInfo() && (
          <div className="flex flex-col items-center justify-center border-b pb-2">
          <div className="flex items-center justify-center">
            <GitHubButton
              href={GITHUB_REPO_URL}
              data-color-scheme="no-preference: light; light: light; dark: dark;"
              data-size="small"
              data-show-count="true"
              aria-label={`Star ${getRepoInfo()!.owner}/${getRepoInfo()!.repo} on GitHub`}
            >
              Star
            </GitHubButton>
          </div>
        <span className="text-xs text-muted-foreground">Send us a GitHub star!</span>
          </div>
        )}
        <Button className="w-full" onClick={() => setAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </SidebarFooter>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>What would you like to log?</DialogTitle>
            <DialogDescription>
              Choose to log a meal or a workout session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleAddOption("meal")}
            >
              <UtensilsCrossed className="h-8 w-8" />
              <span>Log Meal</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleAddOption("workout")}
            >
              <Dumbbell className="h-8 w-8" />
              <span>Log Workout</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
