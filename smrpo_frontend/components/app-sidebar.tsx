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
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
        },
        {
          title: "Settings",
          url: "/dashboard/settings",
        },
      ],
    },
    {
      title: "Sprint Planning",
      url: "/dashboard/sprints",
      icon: Bot,
      items: [
        {
          title: "Current Sprint",
          url: "/dashboard/sprints/current",
        },
        {
          title: "Backlog",
          url: "/dashboard/sprints/backlog",
        },
        {
          title: "Planning",
          url: "/dashboard/sprints/planning",
        },
      ],
    },
    {
      title: "Documentation",
      url: "/dashboard/docs",
      icon: BookOpen,
      items: [
        {
          title: "Project Wiki",
          url: "/dashboard/docs/wiki",
        },
        {
          title: "Guidelines",
          url: "/dashboard/docs/guidelines",
        },
        {
          title: "API Docs",
          url: "/dashboard/docs/api",
        },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        {
          title: "Project Settings",
          url: "/dashboard/settings/project",
        },
        {
          title: "Team Members",
          url: "/dashboard/settings/team",
        },
        {
          title: "Permissions",
          url: "/dashboard/settings/permissions",
        },
        {
          title: "User Settings",
          url: "/profile",
        },
      ],
    },
  ],
  boards: [
    {
      name: "Sprint Board",
      url: "/dashboard/boards/sprint",
      icon: Frame,
    },
    {
      name: "Backlog Board",
      url: "/dashboard/boards/backlog",
      icon: PieChart,
    },
    {
      name: "Roadmap",
      url: "/dashboard/boards/roadmap",
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


