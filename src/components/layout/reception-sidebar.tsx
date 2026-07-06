import { useState } from "react"
import { useLocation, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { UserRound, LogOut, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useT, useLocale } from "@/i18n"
import { useAuth } from "@/stores/auth"

interface NavItem {
  key: string
  path: string
  icon: React.ElementType
}

interface NavGroup {
  groupKey: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    groupKey: "reception",
    items: [
      { key: "reception", icon: UserRound, path: "/reception" },
    ],
  },
]

function SidebarNav({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = useLocation().pathname
  const t = useT()
  const { profile, signOut } = useAuth()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const groups: Record<string, boolean> = {}
    navGroups.forEach((g) => { groups[g.groupKey] = true })
    return groups
  })

  const isActive = (path: string) => {
    return pathname === path
  }

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : profile?.email?.slice(0, 2).toUpperCase() || "RC"

  return (
    <div className="flex h-full flex-col">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex h-14 items-center gap-2 border-b border-border/50 px-4"
      >
        <img src="/logo-qlf.png" alt="QLF GYM" className="h-7 w-7 object-contain" />
        <span className="text-lg font-bold tracking-tight text-[#00BFFF]">QLF GYM</span>
      </motion.div>
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-1">
          {navGroups.map((group) => (
            <div key={group.groupKey}>
              <button
                onClick={() => toggleGroup(group.groupKey)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                {t(`nav.groups.${group.groupKey}`)}
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    openGroups[group.groupKey] ? "rotate-0" : "-rotate-90"
                  )}
                />
              </button>
              {openGroups[group.groupKey] && (
                <ul className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => (
                    <motion.li
                      key={item.path}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Link
                        to={item.path}
                        onClick={onNavClick}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                          isActive(item.path)
                            ? "bg-accent text-accent-foreground nav-active"
                            : "text-muted-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {t(`nav.${item.key}`)}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium">{profile?.full_name || "Réception"}</p>
            <p className="text-xs text-muted-foreground">{profile?.email || "reception@qlfgym.com"}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ReceptionSidebarProps {
  className?: string
}

export function ReceptionSidebar({ className }: ReceptionSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col lg:w-60 lg:border-r lg:bg-card",
        className
      )}
    >
      <SidebarNav />
    </aside>
  )
}

interface ReceptionMobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceptionMobileSidebar({ open, onOpenChange }: ReceptionMobileSidebarProps) {
  const { locale } = useLocale()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={locale === "ar" ? "right" : "left"} className="w-72 p-0">
        <SidebarNav onNavClick={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}
