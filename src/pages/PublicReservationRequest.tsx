import { Link } from 'react-router-dom'
import { useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Loader2,
  MapPin,
  PackageCheck,
  Send,
  Sparkles,
  Tent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Seo } from '@/components/Seo'
import { useCreateReservationRequest } from '@/hooks/useReservationRequests'
import { calculerPrix, STOCK } from '@/lib/pricing'
import { addJours, fmtDate, today } from '@/lib/dates'
import { site } from '@/lib/site'
import type { Adherent, TypeEmprunteur } from '@/types/database'

interface RequestForm {
  nom: string
  email: string
  telephone: string
  evenement: string
  type: TypeEmprunteur
  adherent: Adherent
  date_debut: string
  date_fin: string
  tables: number
  bancs: number
  tente_marron: number
  tente_blanche: number
  notes: string
}

const steps = ['Contact', 'Dates', 'Matériel', 'Récapitulatif'] as const

function initialForm(): RequestForm {
  const start = today()
  return {
    nom: '',
    email: '',
    telephone: '',
    evenement: '',
    type: 'Particulier',
    adherent: 'Non',
    date_debut: start,
    date_fin: addJours(start, 1),
    tables: 0,
    bancs: 0,
    tente_marron: 0,
    tente_blanche: 0,
    notes: '',
  }
}

export function PublicReservationRequestPage() {
  const createMut = useCreateReservationRequest()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState<RequestForm>(initialForm)

  const adherent: Adherent = form.type === 'Association' ? 'N/A' : form.adherent
  const prix = useMemo(
    () => calculerPrix(form.type, adherent, form.tables, form.tente_marron, form.tente_blanche),
    [adherent, form.tables, form.tente_blanche, form.tente_marron, form.type],
  )
  const progress = ((step + 1) / steps.length) * 100

  function setField<K extends keyof RequestForm>(key: K, value: RequestForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function setTables(value: number) {
    setForm((current) => ({ ...current, tables: value, bancs: value * 2 }))
  }

  function setDateDebut(value: string) {
    setForm((current) => {
      const next = { ...current, date_debut: value }
      if (!current.date_fin || current.date_fin <= value) next.date_fin = addJours(value, 1)
      return next
    })
  }

  function validateCurrentStep() {
    if (step === 0) {
      if (!form.nom.trim() || !form.email.trim() || !form.telephone.trim()) {
        toast.error('Nom, email et téléphone sont obligatoires.')
        return false
      }
    }
    if (step === 1) {
      if (!form.date_debut || !form.date_fin) {
        toast.error('Les deux dates sont obligatoires.')
        return false
      }
      if (form.date_fin < form.date_debut) {
        toast.error('La date de retour doit être après la date de retrait.')
        return false
      }
    }
    if (step === 2 && form.tables === 0 && form.tente_marron === 0 && form.tente_blanche === 0) {
      toast.error('Sélectionnez au moins un article.')
      return false
    }
    return true
  }

  function nextStep() {
    if (!validateCurrentStep()) return
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return
    try {
      await createMut.mutateAsync({
        nom: form.nom.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        evenement: form.evenement.trim() || null,
        type: form.type,
        adherent,
        date_debut: form.date_debut,
        date_fin: form.date_fin,
        tables: form.tables,
        bancs: form.bancs,
        tente_marron: form.tente_marron,
        tente_blanche: form.tente_blanche,
        prix,
        notes: form.notes.trim() || null,
      })
      setSubmitted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible d’envoyer la demande.')
    }
  }

  if (submitted) {
    return (
      <PublicShell>
        <Seo
          title="Demande de réservation envoyée"
          description="Confirmation d’envoi du formulaire public de demande de réservation."
          path="/"
          jsonLd={organizationJsonLd()}
        />
        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle>Demande envoyée</CardTitle>
            <CardDescription>
              Le comité va vérifier la disponibilité du matériel et revenir vers vous.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setForm(initialForm())
                setStep(0)
                setSubmitted(false)
              }}
            >
              Faire une autre demande
            </Button>
          </CardContent>
        </Card>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <Seo
        title="Demande de réservation"
        description={site.description}
        path="/"
        jsonLd={organizationJsonLd()}
      />
      <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-md border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Matériel communal
          </div>
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-normal md:text-4xl">
            Réserver tables, bancs et tentes pour votre événement
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Envoyez votre demande au Comité des Fêtes de Tannerre-en-Puisaye. Le tarif est estimé automatiquement avant validation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <TrustLink to="/mentions-legales" label="Mentions légales" />
            <TrustLink to="/confidentialite" label="Confidentialité" />
            <TrustLink to="/contact" label="Contact" />
          </div>
        </div>
        <div className="grid gap-3 rounded-md border bg-primary p-5 text-primary-foreground shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-foreground/15">
              <Tent className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Retrait sur rendez-vous</div>
              <div className="text-xs opacity-80">Demande vérifiée par le comité</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <HeroFact icon={<MapPin className="h-3.5 w-3.5" />} label="Tannerre" />
            <HeroFact icon={<PackageCheck className="h-3.5 w-3.5" />} label="Stock suivi" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden border-primary/20 shadow-md">
          <div className="h-1.5 bg-primary" />
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Demande de réservation</CardTitle>
                <CardDescription>
                  Étape {step + 1} sur {steps.length} · {steps[step]}
                </CardDescription>
              </div>
              <Badge variant="muted">Réponse après validation</Badge>
            </div>
            <Progress value={progress} />
            <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
              {steps.map((label, index) => (
                <StepPill
                  key={label}
                  label={label}
                  active={index === step}
                  done={index < step}
                  index={index + 1}
                />
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-[360px]">
              {step === 0 && (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="req-name">Nom ou association *</Label>
                    <Input
                      id="req-name"
                      value={form.nom}
                      onChange={(e) => setField('nom', e.target.value)}
                      placeholder="Nom complet ou nom de l’association"
                      autoFocus
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="req-email">Email *</Label>
                      <Input
                        id="req-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                        placeholder="contact@exemple.fr"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="req-phone">Téléphone *</Label>
                      <Input
                        id="req-phone"
                        type="tel"
                        value={form.telephone}
                        onChange={(e) => setField('telephone', e.target.value)}
                        placeholder="06 00 00 00 00"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="req-type">Type</Label>
                      <Select
                        id="req-type"
                        value={form.type}
                        onChange={(e) => setField('type', e.target.value as TypeEmprunteur)}
                      >
                        <option value="Particulier">Particulier</option>
                        <option value="Association">Association</option>
                      </Select>
                    </div>
                    {form.type !== 'Association' && (
                      <div className="grid gap-2">
                        <Label htmlFor="req-adherent">Adhérent</Label>
                        <Select
                          id="req-adherent"
                          value={form.adherent}
                          onChange={(e) => setField('adherent', e.target.value as Adherent)}
                        >
                          <option value="Non">Non</option>
                          <option value="Oui">Oui</option>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="req-event">Évènement</Label>
                    <Input
                      id="req-event"
                      value={form.evenement}
                      onChange={(e) => setField('evenement', e.target.value)}
                      placeholder="Ex : anniversaire, fête associative, repas..."
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="req-start">Date de retrait souhaitée *</Label>
                      <Input
                        id="req-start"
                        type="date"
                        value={form.date_debut}
                        onChange={(e) => setDateDebut(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="req-end">Date de retour souhaitée *</Label>
                      <Input
                        id="req-end"
                        type="date"
                        min={form.date_debut}
                        value={form.date_fin}
                        onChange={(e) => setField('date_fin', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/40 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CalendarDays className="h-4 w-4" />
                      Période demandée
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Du {fmtDate(form.date_debut)} au {fmtDate(form.date_fin)}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="req-notes-dates">Précisions</Label>
                    <Textarea
                      id="req-notes-dates"
                      value={form.notes}
                      onChange={(e) => setField('notes', e.target.value)}
                      placeholder="Créneau souhaité, contraintes de retrait, informations utiles..."
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Counter
                      label="Tables"
                      hint="2 bancs/table"
                      value={form.tables}
                      max={STOCK.tables}
                      onChange={setTables}
                    />
                    <Counter
                      label="Bancs"
                      value={form.bancs}
                      max={STOCK.bancs}
                      onChange={(value) => setField('bancs', value)}
                    />
                    <Counter
                      label="T. marron"
                      value={form.tente_marron}
                      max={STOCK.tente_marron}
                      onChange={(value) => setField('tente_marron', value)}
                    />
                    <Counter
                      label="T. blanche"
                      value={form.tente_blanche}
                      max={STOCK.tente_blanche}
                      onChange={(value) => setField('tente_blanche', value)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border bg-muted/40 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Prix estimé</span>
                    <span className="text-xl font-semibold tabular-nums">
                      {prix} €
                      {form.type === 'Association' && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Gratuit
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-4">
                  <SummaryRow label="Demandeur" value={form.nom || '—'} />
                  <SummaryRow label="Contact" value={`${form.email} · ${form.telephone}`} />
                  <SummaryRow label="Évènement" value={form.evenement || '—'} />
                  <SummaryRow label="Période" value={`${fmtDate(form.date_debut)} → ${fmtDate(form.date_fin)}`} />
                  <SummaryRow
                    label="Matériel"
                    value={`${form.tables} tables, ${form.bancs} bancs, ${form.tente_marron} tente(s) marron, ${form.tente_blanche} tente blanche`}
                  />
                  <SummaryRow label="Prix estimé" value={`${prix} €`} strong />
                  {form.notes && <SummaryRow label="Notes" value={form.notes} />}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((current) => Math.max(current - 1, 0))}
                disabled={step === 0 || createMut.isPending}
              >
                <ChevronLeft className="h-4 w-4" />
                Retour
              </Button>
              {step < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Continuer
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" disabled={createMut.isPending} onClick={handleSubmit}>
                  {createMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Envoyer la demande
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <div className="rounded-md border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 font-semibold">
              <ClipboardList className="h-4 w-4 text-primary" />
              Suivi par le comité
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              L’envoi crée une demande en attente. La réservation devient effective après validation.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Le site collecte uniquement les informations nécessaires au traitement manuel de la demande.
            </p>
          </div>
          <div className="rounded-md border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock3 className="h-4 w-4 text-primary" />
              Après l’envoi
            </div>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              <TimelineItem title="Disponibilité" text="Le stock est contrôlé pour vos dates." />
              <TimelineItem title="Confirmation" text="Vous recevez un retour avant validation." />
            </div>
          </div>
          <div className="rounded-md border bg-card p-5 shadow-sm">
            <div className="text-sm font-semibold">Stock indicatif</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <StockPill label="Tables" value={STOCK.tables} />
              <StockPill label="Marron" value={STOCK.tente_marron} />
              <StockPill label="Blanche" value={STOCK.tente_blanche} />
            </div>
          </div>
        </aside>
      </div>
    </PublicShell>
  )
}

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background [background-image:linear-gradient(rgba(58,91,160,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(58,91,160,0.08)_1px,transparent_1px)] [background-size:28px_28px]">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <Tent className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Comité des Fêtes</div>
              <div className="text-xs text-muted-foreground">Tannerre-en-Puisaye</div>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">{children}</main>
    </div>
  )
}

function organizationJsonLd() {
  const payload: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: site.url,
    description: site.description,
    areaServed: site.locality,
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.locality,
      addressCountry: site.countryCode,
    },
  }

  if (site.contactEmail) payload.email = site.contactEmail
  if (site.contactPhone) payload.telephone = site.contactPhone
  if (site.streetAddress) {
    ;(payload.address as Record<string, unknown>).streetAddress = site.streetAddress
  }

  return payload
}

function TrustLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center rounded-md border bg-background px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
    </Link>
  )
}

function HeroFact({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-primary-foreground/15 px-3 py-2">
      {icon}
      <span>{label}</span>
    </div>
  )
}

function StepPill({
  label,
  active,
  done,
  index,
}: {
  label: string
  active: boolean
  done: boolean
  index: number
}) {
  return (
    <div
      className={
        active
          ? 'rounded-md border border-primary bg-primary/10 px-3 py-2 text-xs font-semibold text-primary'
          : done
            ? 'rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700'
            : 'rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground'
      }
    >
      <span className="mr-1.5 font-mono">{index}</span>
      {label}
    </div>
  )
}

function TimelineItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-l-2 border-primary/30 pl-3">
      <div className="font-medium text-foreground">{title}</div>
      <div className="text-xs leading-5">{text}</div>
    </div>
  )
}

interface CounterProps {
  label: string
  hint?: string
  value: number
  max: number
  onChange: (value: number) => void
}

function Counter({ label, hint, value, max, onChange }: CounterProps) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">
        {label}
        {hint && <span className="ml-1 font-normal text-muted-foreground">({hint})</span>}
      </Label>
      <Input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      />
    </div>
  )
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={strong ? 'text-right font-semibold' : 'text-right text-sm'}>{value}</div>
    </div>
  )
}

function StockPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/50 px-2 py-2">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}
