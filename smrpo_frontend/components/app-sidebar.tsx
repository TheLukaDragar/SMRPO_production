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
import { useProject } from "@/lib/contexts/project-context"
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

// Navigation data generator function
const getNavData = (projectId?: string, isAdmin?: boolean) => {
  const navItems = {
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
            url: projectId ? `/dashboard/project/${projectId}/settings` : "/dashboard/settings/project",
          },
          {
            title: "Team Members",
            url: projectId ? `/dashboard/project/${projectId}/settings/team` : "/settings/team",
          },
          {
            title: "Permissions",
            url: projectId ? `/dashboard/project/${projectId}/settings/permissions` : "/dashboard/settings/permissions",
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
        //url: "/dashboard/boards/sprint",
        url: projectId ? `/dashboard/project/${projectId}/sprintBoard` : "/dashboard/settings/sprintBoard",
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
  };

  if (isAdmin) {
    navItems.navMain.push({
      title: "Admin",
      url: "/dashboard/admin",
      icon: Settings2,
      items: [
        {
          title: "User Management",
          url: "/dashboard/admin/users",
        },
        {
          title: "System Settings",
          url: "/dashboard/admin/system_settings",
        },
        {
          title: "Audit Logs",
          url: "/dashboard/admin/audit_logs",
        },
      ],
    });
  }

  return navItems;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { activeProject } = useProject();
  const isAdmin = user.role === "Administrator";
  const navData = getNavData(activeProject?._id, isAdmin);

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


