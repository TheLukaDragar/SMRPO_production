"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavBoards } from "@/components/nav-boards"
import { NavUser } from "@/components/nav-user"
import { ProjectSwitcher } from "@/components/project-switcher"
import { User } from "@/lib/types/user-types"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User
}

// Navigation data
const navData = {
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "#",
        },
        {
          title: "Analytics",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Sprint Planning",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Current Sprint",
          url: "#",
        },
        {
          title: "Backlog",
          url: "#",
        },
        {
          title: "Planning",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Project Wiki",
          url: "#",
        },
        {
          title: "Guidelines",
          url: "#",
        },
        {
          title: "API Docs",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Project Settings",
          url: "#",
        },
        {
          title: "Team Members",
          url: "#",
        },
        {
          title: "Permissions",
          url: "#",
        },
      ],
    },
  ],
  boards: [
    {
      name: "Sprint Board",
      url: "#",
      icon: Frame,
    },
    {
      name: "Backlog Board",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Roadmap",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ProjectSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
        <NavBoards boards={navData.boards} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
