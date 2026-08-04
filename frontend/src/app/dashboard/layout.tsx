"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarButton,
} from "@/components/ui/sidebar";
import { useAuth } from "@/components/AuthProvider";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconList,
  IconSearch,
  IconUsers,
  IconMessage,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-sidebar-foreground/70" />
      ),
    },
    {
      label: "Search",
      href: "/dashboard/search",
      icon: (
        <IconSearch className="h-5 w-5 shrink-0 text-sidebar-foreground/70" />
      ),
    },
    {
      label: "Leads",
      href: "/dashboard/leads",
      icon: (
        <IconList className="h-5 w-5 shrink-0 text-sidebar-foreground/70" />
      ),
    },
    {
      label: "Contacts",
      href: "/dashboard/contacts",
      icon: (
        <IconUsers className="h-5 w-5 shrink-0 text-sidebar-foreground/70" />
      ),
    },
    {
      label: "Inbox",
      href: "/dashboard/inbox",
      icon: (
        <IconMessage className="h-5 w-5 shrink-0 text-sidebar-foreground/70" />
      ),
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-sidebar-foreground/70" />
      ),
    },
  ];

  const avatarUrl =
    user?.providerData?.[0]?.photoURL ?? user?.photoURL ?? null;

  return (
    <WorkspaceProvider>
    <div
      className={cn(
        "flex h-screen w-screen flex-1 flex-col overflow-hidden bg-background md:flex-row"
      )}
    >
      <div className="z-10 border-r border-sidebar-border">
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10 bg-sidebar text-sidebar-foreground">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-hidden">
              {open ? <Logo /> : <LogoIcon />}
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
                <SidebarButton
                  link={{
                    label: "Logout",
                    href: "#",
                    icon: (
                      <IconArrowLeft className="h-5 w-5 shrink-0 cursor-pointer text-sidebar-foreground/70" />
                    ),
                  }}
                />
              </div>
            </div>
            <div>
              {loading ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-muted" />
                </div>
              ) : (
                <SidebarLink
                  link={{
                    label: user?.displayName ?? "Account",
                    href: "/dashboard/settings",
                    icon: avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        className="h-7 w-7 shrink-0 rounded-full object-cover"
                        alt="Avatar"
                      />
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {(user?.displayName ?? "A").charAt(0).toUpperCase()}
                      </div>
                    ),
                  }}
                />
              )}
            </div>
          </SidebarBody>
        </Sidebar>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-background">
          {loading ? <DashboardSkeleton /> : children}
        </main>
      </div>
    </div>
    </WorkspaceProvider>
  );
}

export const Logo = () => {
  return (
    <span className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-sidebar-foreground">
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-primary" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-sidebar-foreground"
      >
        B2Lead
      </motion.span>
    </span>
  );
};

export const LogoIcon = () => {
  return (
    <span className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-sidebar-foreground">
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-primary" />
    </span>
  );
};

const DashboardSkeleton = () => {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-6">
      <div className="flex gap-2">
        {[...new Array(4)].map((_, idx) => (
          <div
            key={`stat-${idx}`}
            className="h-20 w-full animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
      <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
};
