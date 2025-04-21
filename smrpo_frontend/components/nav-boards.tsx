"use client"

import * as React from "react"
import { LucideIcon } from "lucide-react"
import Link from "next/link"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

interface Board {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBoardsProps {
  boards: Board[]
}

export function NavBoards({ boards }: NavBoardsProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Boards</SidebarGroupLabel>
      <SidebarMenu>
        {boards.map((board) => (
          <SidebarMenuItem key={board.name}>
            <SidebarMenuButton asChild>
              <Link href={board.url}>
                <board.icon className="size-4" />
                <span>{board.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
