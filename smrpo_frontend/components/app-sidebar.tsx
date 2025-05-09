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
  ShieldUser,
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
  console.log("projectId", projectId);
  const navItems = {
    navMain: [
      {
        title: "Projects",
        url: "/dashboard",
        icon: SquareTerminal,
        isActive: true,
        items: [
          {
            title: "Overview",
            url: "/dashboard",
          },
          {
            title: "Project Backlog",
            url: projectId ? `/dashboard/project/${projectId}/projectBacklog` : "/dashboard/projectBacklog",
          },
          {
            title: "Burndown",
            url: projectId ? `/dashboard/project/${projectId}/burndown` : "/dashboard/burndown",
          },
          {
            title: "Project Wall",
            url: projectId ? `/dashboard/project/${projectId}/projectWall` : "/dashboard/projectWall",
          },
        ],
      },
      // {
      //   title: "Sprint Planning",
      //   url: "/dashboard/sprints",
      //   icon: Bot,
      //   items: [
      //     {
      //       title: "Current Sprint",
      //       url: "/dashboard/sprints/current",
      //     },
      //     {
      //       title: "Backlog",
      //       url: "/dashboard/sprints/backlog",
      //     },
      //     {
      //       title: "Planning",
      //       url: "/dashboard/sprints/planning",
      //     },
      //   ],
      // },
      // {
      //   title: "Documentation",
      //   url: "/dashboard/docs",
      //   icon: BookOpen,
      //   items: [
      //     {
      //       title: "Project Wiki",
      //       url: "/dashboard/docs/wiki",
      //     },
      //     {
      //       title: "Guidelines",
      //       url: "/dashboard/docs/guidelines",
      //     },
      //     {
      //       title: "API Docs",
      //       url: "/dashboard/docs/api",
      //     },
      //   ],
      // },



      {
        title: "Project Settings",
        url: projectId ? `/dashboard/project/${projectId}/settings` : "/dashboard/settings/project",
        icon: Settings2,
        isActive: true,
        items: [
          {
            title: "Settings",
            url: projectId ? `/dashboard/project/${projectId}/settings` : "/dashboard/settings/project",
          }
        ],
      },
      {
        title: "Documentation",
        url: "/documentation",
        icon: BookOpen,
        isActive: true,
        items: [
          {
            title: "Documentation",
            url: "/documentation",
          },
        ],
      },

      // {
      //   title: "Documentation",
      //   url: "/documentation",
      //   icon: BookOpen,
      //   items: [
      //     // {
      //     //   title: "Project Settings",
      //     //   url: projectId ? `/dashboard/project/${projectId}/settings` : "/dashboard/settings/project",
      //     // },
      //     {
      //       title: "Documentation",
      //       url: "/documentation",
      //     },
      //     // {
      //     //   title: "Permissions",
      //     //   url: projectId ? `/dashboard/project/${projectId}/settings/permissions` : "/dashboard/settings/permissions",
      //     // },

      //   ],
      // },
    ],
    boards: [
      {
        name: "Sprint Board",
        //url: "/dashboard/boards/sprint",
        url: projectId ? `/dashboard/project/${projectId}/sprintBoard` : "/dashboard",
        icon: Frame,
      },
      {
        name: "Sprint Management",
        url: projectId ? `/dashboard/project/${projectId}/sprintList` : "/dashboard",
        icon: Settings2,
      },
      {
        name: "Sprint Backlog",
        url: projectId ? `/dashboard/project/${projectId}/sprintBacklog` : "/dashboard",
        icon: PieChart,
      },
      {
        name: "Archive Board",
        url: projectId ? `/dashboard/project/${projectId}/archive` : "/dashboard",
        icon: BookOpen,
      },
      // {
      //   name: "Roadmap",
      //   url: "/dashboard/boards/roadmap",
      //   icon: Map,
      // },
    ],
  };

  if (isAdmin) {
    navItems.navMain.push({
      title: "Admin",
      url: "/dashboard/admin",
      icon: ShieldUser,
      isActive: true,
      items: [
        {
          title: "User Management",
          url: "/dashboard/admin/user_managment",
        },
        // {
        //   title: "System Settings",
        //   url: "/dashboard/admin/system_settings",
        // },
        // {
        //   title: "Audit Logs",
        //   url: "/dashboard/admin/audit_logs",
        // },
      ],
    });
  }

  return navItems;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { activeProject } = useProject();
  const isAdmin = user.role === "Administrator";
  const navData = React.useMemo(() => getNavData(activeProject?._id, isAdmin), [activeProject?._id, isAdmin]);

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


