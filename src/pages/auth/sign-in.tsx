import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Eye, EyeOff, Loader2, Shield, Zap, Users, BarChart3, Mail, User } from 'lucide-react'

type AuthTab = 'email' | 'username'

export default function SignIn() {
  const { signIn, signInWithUsername, resetPassword } = useAuth()
  const { toast } = useToast()

  const [tab, setTab] = useState<AuthTab>('email')

  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [username, setUsername] = useState('')
  const [usernamePwd, setUsernamePwd] = useState('')

  const [error, setError] = useState('')

  function showError(msg: string) {
    setError(msg)
    toast({ variant: 'destructive', title: 'Erreur', description: msg })
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim()) { showError("Email requis"); return }
    if (!password) { showError("Mot de passe requis"); return }
    setSubmitting(true)
    const { error: err } = await signIn(email, password)
    setSubmitting(false)
    if (err) showError(err.message)
  }

  async function handleUsernameLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!username.trim()) { showError("Identifiant requis"); return }
    if (!usernamePwd) { showError("Mot de passe requis"); return }
    setSubmitting(true)
    const { error: err } = await signInWithUsername(username, usernamePwd)
    setSubmitting(false)
    if (err) showError(err.message)
  }

  async function handleEmailForgot() {
    if (!email.trim()) { showError("Entre d'abord ton email"); return }
    const { error: err } = await resetPassword(email)
    if (err) showError(err.message)
    else toast({ title: "Email envoyé", description: "Vérifie ta boîte de réception" })
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0" style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1600&q=80)',
        backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) saturate(1.2)',
      }} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 via-[#0a0a12]/50 to-[#0a0a12]/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/15 via-transparent to-transparent" />
      <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-[#D4AF37]/15 rounded-full blur-[150px]" />
      <motion.div animate={{ x: [0, -30, 0], y: [0, 40, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-[150px]" />

      <div className="hidden lg:flex lg:w-1/2 relative z-10">
        <div className="flex flex-col justify-between p-16 w-full">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="flex items-center gap-3">
            <img src="/logo-qlf.png" alt="QLF GYM" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-white">QLF GYM</span>
          </motion.div>
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}>
              <h1 className="text-5xl font-bold leading-tight text-white">
                <span className="stroke-text text-6xl block mb-2">QLF GYM</span>
                <span>Votre salle.</span>
                <span className="text-gradient block text-5xl mt-2 pb-1">Exigez l'excellence.</span>
              </h1>
              <p className="mt-6 text-lg text-white/50 max-w-md leading-relaxed">
                Plateforme de gestion complète pour votre salle de sport — membres, abonnements, staff, inventaire et analyses.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="space-y-4">
              {[
                { icon: Shield, text: "Contrôle d'accès par rôle" },
                { icon: Zap, text: "Présence & pointage en temps réel" },
                { icon: Users, text: "Gestion des membres & abonnements" },
                { icon: BarChart3, text: "Analytiques de revenus & performance" },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-white/60">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1 }} className="text-xs text-white/20">&copy; 2026 QLF GYM. All rights reserved.</motion.p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative bg-transparent">
        <div className="absolute inset-0 pointer-events-none lg:hidden">
          <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <motion.div animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-20 right-10 w-[30rem] h-[30rem] bg-secondary/15 rounded-full blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="w-full max-w-lg relative">
          <div className="hidden lg:flex items-center gap-2 mb-6">
            <img src="/logo-qlf.png" alt="QLF GYM" className="h-8 w-8 object-contain" />
            <span className="text-base font-bold text-white/80">QLF GYM</span>
          </div>
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <img src="/logo-qlf.png" alt="QLF GYM" className="h-14 w-14 object-contain" />
            <span className="text-xl font-bold text-white">QLF GYM</span>
          </div>
          <Card className="shadow-2xl glass-card gradient-border">
            <CardHeader className="text-center space-y-4 pb-4 pt-6">
              <div className="mx-auto flex items-center justify-center">
                <img src="/logo-qlf.png" alt="QLF GYM" className="h-16 w-16 object-contain" />
              </div>
              <CardTitle className="text-2xl font-bold">
                <span className="text-gradient">Connexion</span>
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Accède à ton espace
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6 px-6">
              <Tabs value={tab} onValueChange={(v) => { setTab(v as AuthTab) }} className="w-full">
                <TabsList className="grid grid-cols-2 mb-5">
                  <TabsTrigger value="email" className="gap-1.5 text-xs"><Mail className="h-3.5 w-3.5" /> Email</TabsTrigger>
                  <TabsTrigger value="username" className="gap-1.5 text-xs"><User className="h-3.5 w-3.5" /> ID</TabsTrigger>
                </TabsList>

                <TabsContent value="email">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" className="h-11 text-base mt-1" autoFocus />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Mot de passe</Label>
                      <div className="relative mt-1">
                        <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 text-base pr-10" />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-11 px-3" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </div>
                    {error && <p className="text-xs text-destructive">{error}</p>}
                    <div className="flex items-center justify-end">
                      <button type="button" onClick={handleEmailForgot} className="text-xs text-primary hover:underline font-medium">
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <Button type="submit" size="lg" className="w-full h-11 text-base font-semibold" disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      Se connecter
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="username">
                  <form onSubmit={handleUsernameLogin} className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Identifiant</Label>
                      <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="MonIdentifiant" className="h-11 text-base mt-1" autoFocus />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Mot de passe</Label>
                      <Input type="password" value={usernamePwd} onChange={e => setUsernamePwd(e.target.value)} placeholder="••••••••" className="h-11 text-base mt-1" />
                    </div>
                    {error && <p className="text-xs text-destructive">{error}</p>}
                    <Button type="submit" size="lg" className="w-full h-11 text-base font-semibold" disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      Se connecter
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                <Link to="/auth/sign-up" className="font-semibold text-primary hover:underline">
                  Inscris-toi
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
