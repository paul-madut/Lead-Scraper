"use client";
import React from 'react'

import { Sidebar, SidebarBody, SidebarLink, SidebarButton } from "@/components/ui/sidebar";
import { useAuth } from '@/components/AuthProvider';
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconList,
  IconSearch

} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useState } from "react";
 
export default function layout({ children: children }: { children: React.ReactNode }) {

    const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Search",
      href: "/dashboard/search",
      icon: (
        <IconSearch className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Leads",
      href: "/dashboard/leads",
      icon: (
        <IconList className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    
  ];
  
  

  return (
    <div
      className={cn(
        " flex w-full max-w-screen flex-1 flex-col overflow-hidden rounded-md border border-neutral-200  bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800",
        "h-screen", 
      )}
    >
        <div className="cointainer border-r-2 z-10">

      <Sidebar  open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 z-30">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
              ))}
              <SidebarButton
                link={{ label: "Logout", href: "#", icon: <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200 cursor-pointer"  /> }}>
                

              </SidebarButton>
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                  label: user?.displayName,
                href: "#",
                icon: (
                    <img
                    src={user?.providerData[0].photoURL}
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                    />
                ),
            }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
            </div>
      <Dashboard children={children} />
    </div>
  );
}
export const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        B2Lead
      </motion.span>
    </a>
  );
};
export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </a>
  );
};
 
// Dummy dashboard component with content
const Dashboard = ({ children: children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);
  return (
    <>
    {
      isLoading ? (
          <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex gap-2">
          {[...new Array(4)].map((i, idx) => (
            <div
              key={"first-array-demo-1" + idx}
              className="h-20 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800"
            ></div>
        ))}
        </div>
        <div className="flex flex-1 gap-2">
          {[...new Array(2)].map((i, idx) => (
              <div
              key={"second-array-demo-1" + idx}
              className="h-full w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800"
              ></div>
            ))}
        </div>
      </div>
    </div>
        )
   : <div className="content absolute flex w-full justify-center items-center z--10">
     <div className="children">
        {children}
        </div>
     </div>  }                     
            </>
  );
};


