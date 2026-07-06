import { useState, useMemo, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { useSupabase } from "@/hooks/useSupabase"
import { useQuery, useMutation, useQueryClient } from "@/hooks/useQuery"
import { useAuth } from "@/stores/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { getInitials } from "@/lib/utils"
import {
  LogIn, LogOut, Search, Loader2,
  LogOut as LogOutIcon, Eye, Clock, UserCheck, Users, Menu, Scan,
} from "lucide-react"
import { ReceptionSidebar, ReceptionMobileSidebar } from "@/components/layout/sidebar"
import { format } from "date-fns"

export default function ReceptionPage() {
  const supabaseClient = useSupabase()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { profile, organization, isLoading, isAuthenticated, userRole, signOut } = useAuth()
  const orgId = organization?.id

  const [search, setSearch] = useState("")
  const [rfidTag, setRfidTag] = useState("")
  const [rfidMember, setRfidMember] = useState<any>(null)

  const [showMemberDetail, setShowMemberDetail] = useState(false)
  const [detailMember, setDetailMember] = useState<any>(null)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await signOut()
  }

  const { data: activeMembers } = useQuery({
    queryKey: ["active-members-all", orgId],
    queryFn: async () => {
      if (!orgId) return []
      const { data } = await supabaseClient
        .from("members")
        .select("id, first_name, last_name, phone, photo_url, status, last_visit")
        .eq("organization_id", orgId)
        .eq("status", "active")
        .order("first_name")
      return data ?? []
    },
    enabled: isAuthenticated && !!orgId,
  })

  const { data: todayAttendance } = useQuery({
    queryKey: ["attendance-today-reception", orgId],
    queryFn: async () => {
      if (!orgId) return []
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      const { data } = await supabaseClient
        .from("attendance")
        .select("*")
        .eq("organization_id", orgId)
        .gte("check_in", todayStart.toISOString())
        .lte("check_in", todayEnd.toISOString())
        .order("check_in", { ascending: false })
      return data ?? []
    },
    enabled: isAuthenticated && !!orgId,
  })

  const { data: subscriptionTypes } = useQuery({
    queryKey: ["subscription-types", orgId],
    queryFn: async () => {
      if (!orgId) return []
      const { data } = await supabaseClient.from("subscription_types").select("*").eq("is_active", true)
      return data ?? []
    },
    enabled: isAuthenticated && !!orgId,
  })

  const checkInMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!orgId) throw new Error("No organization")
      const { error } = await supabaseClient.from("attendance").insert({
        organization_id: orgId,
        member_id: memberId,
        check_in: new Date().toISOString(),
        type: "check-in",
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-today-reception"] })
      toast({ title: "Check-in enregistré" })
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  })

  const checkOutMutation = useMutation({
    mutationFn: async (attendanceId: string) => {
      const { error } = await supabaseClient
        .from("attendance")
        .update({ check_out: new Date().toISOString() })
        .eq("id", attendanceId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-today-reception"] })
      toast({ title: "Check-out enregistré" })
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  })

  const filteredMembers = useMemo(() => {
    if (!activeMembers) return []
    return activeMembers.filter(m =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone && m.phone.includes(search))
    )
  }, [activeMembers, search])

  const membersWithAttendance = useMemo(() => {
    if (!activeMembers || !todayAttendance) return []
    return activeMembers.map(m => {
      const att = todayAttendance.find((a: any) => a.member_id === m.id)
      return { ...m, attendance: att ?? null }
    })
  }, [activeMembers, todayAttendance])

  const filteredMembersWA = membersWithAttendance.filter(m =>
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (m.phone && m.phone.includes(search))
  )

  const presentCount = membersWithAttendance.filter((m: any) => m.attendance && !m.attendance.check_out).length
  const checkedInToday = todayAttendance?.length ?? 0

  const rfidLookupMutation = useMutation({
    mutationFn: async (tag: string) => {
      if (!orgId) throw new Error("No organization")
      const { data, error } = await supabaseClient
        .from("members")
        .select("id, first_name, last_name, phone, photo_url, status, last_visit")
        .eq("rfid_tag", tag)
        .eq("organization_id", orgId)
        .single()
      if (error) throw new Error("Membre introuvable avec ce badge RFID")
      return data as any
    },
    onSuccess: async (member) => {
      setRfidMember(member)
      const openAttendance = todayAttendance?.find((a: any) => a.member_id === member.id && !a.check_out)
      if (openAttendance) {
        checkOutMutation.mutate(openAttendance.id)
      } else {
        checkInMutation.mutate(member.id)
      }
    },
    onError: (err: Error) => {
      toast({ title: "Erreur RFID", description: err.message, variant: "destructive" })
    },
  })

  function handleRfidScan(value: string) {
    const tag = value.trim()
    if (!tag) return
    rfidLookupMutation.mutate(tag)
  }

  function openMemberDetail(member: any) {
    setDetailMember(member)
    setShowMemberDetail(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ReceptionSidebar />
      <ReceptionMobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 lg:p-6 border-b bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Réception</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <UserCheck className="h-3 w-3" /> {profile?.email || profile?.full_name || "Réception"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Mode Réception</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOutIcon className="h-4 w-4 mr-1" /> Déconnexion
            </Button>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Check-ins aujourd'hui</p>
                <p className="text-2xl font-bold">{checkedInToday}</p>
              </div>
              <LogIn className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dans la salle</p>
                <p className="text-2xl font-bold">{presentCount}</p>
              </div>
              <UserCheck className="h-8 w-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Membres actifs</p>
                <p className="text-2xl font-bold">{activeMembers?.length ?? 0}</p>
              </div>
              <Users className="h-8 w-8 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Check-in / Check-out</h2>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un membre..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredMembersWA.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Aucun membre trouvé</p>
                  ) : (
                    filteredMembersWA.slice(0, 30).map((member: any) => {
                      const isCheckedIn = !!member.attendance
                      const isCheckedOut = member.attendance?.check_out != null
                      const isActive = isCheckedIn && !isCheckedOut
                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            isActive ? "bg-success/5 border-success/20" : "bg-card"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                              isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                            }`}>
                              {getInitials(member.first_name, member.last_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{member.first_name} {member.last_name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {member.phone && <span>{member.phone}</span>}
                                {member.attendance?.check_in && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(member.attendance.check_in), "HH:mm")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button size="sm" variant="ghost" onClick={() => openMemberDetail(member)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isActive ? (
                              <Button
                                size="sm" variant="outline"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => checkOutMutation.mutate(member.attendance!.id)}
                                disabled={checkOutMutation.isPending}
                              >
                                <LogOut className="h-4 w-4" />
                              </Button>
                            ) : !isCheckedIn ? (
                              <Button
                                size="sm"
                                onClick={() => checkInMutation.mutate(member.id)}
                                disabled={checkInMutation.isPending}
                              >
                                <LogIn className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Fait</Badge>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Scan className="h-5 w-5" />
                <h3 className="font-semibold">Accès RFID</h3>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Scanner le badge RFID..."
                    value={rfidTag}
                    onChange={e => setRfidTag(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        handleRfidScan(rfidTag)
                        setRfidTag("")
                      }
                    }}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Passer le badge RFID devant le lecteur ou saisir le code manuellement
                </p>
                {rfidLookupMutation.isPending && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                {rfidMember && !rfidLookupMutation.isPending && (
                  <div className="p-3 rounded-lg border bg-success/5 border-success/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center text-sm font-medium">
                        {getInitials(rfidMember.first_name, rfidMember.last_name)}
                      </div>
                      <div>
                        <p className="font-medium">{rfidMember.first_name} {rfidMember.last_name}</p>
                        <p className="text-xs text-muted-foreground">{rfidMember.phone || "Aucun téléphone"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showMemberDetail} onOpenChange={setShowMemberDetail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du membre</DialogTitle>
          </DialogHeader>
          {detailMember && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                  {getInitials(detailMember.first_name, detailMember.last_name)}
                </div>
                <div>
                  <p className="font-semibold text-lg">{detailMember.first_name} {detailMember.last_name}</p>
                  <p className="text-sm text-muted-foreground">{detailMember.phone || "Aucun téléphone"}</p>
                </div>
              </div>
              <Separator />
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Statut :</span> {detailMember.status === "active" ? "Actif" : "Inactif"}</p>
                {detailMember.last_visit && (
                  <p><span className="text-muted-foreground">Dernière visite :</span> {format(new Date(detailMember.last_visit), "dd/MM/yyyy HH:mm")}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowMemberDetail(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



        </main>
    </div>
  </div>
  )
}
