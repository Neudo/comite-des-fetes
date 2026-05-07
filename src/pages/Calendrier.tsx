import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/PageHeader";
import { useLocations } from "@/hooks/useLocations";
import { useReservations } from "@/hooks/useReservations";
import { fmtDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Location, Reservation } from "@/types/database";

const MOIS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const JOURS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface DayCell {
  date: Date;
  iso: string;
  inMonth: boolean;
  isToday: boolean;
  locs: Location[];
  resas: Reservation[];
}

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildMonth(
  year: number,
  month: number,
  locations: Location[],
  reservations: Reservation[],
): DayCell[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const nbJours = new Date(year, month + 1, 0).getDate();
  const todayIso = isoOf(new Date());

  const cells: DayCell[] = [];
  for (let i = offset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({
      date: d,
      iso: isoOf(d),
      inMonth: false,
      isToday: false,
      locs: [],
      resas: [],
    });
  }
  for (let i = 1; i <= nbJours; i++) {
    const d = new Date(year, month, i);
    const iso = isoOf(d);
    const locs = locations.filter(
      (l) =>
        iso >= l.date_retrait && iso <= (l.date_prev_retour ?? l.date_retrait),
    );
    const resas = reservations.filter(
      (r) => iso >= r.date_debut && iso <= r.date_fin,
    );
    cells.push({
      date: d,
      iso,
      inMonth: true,
      isToday: iso === todayIso,
      locs,
      resas,
    });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!.date;
    const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    cells.push({
      date: d,
      iso: isoOf(d),
      inMonth: false,
      isToday: false,
      locs: [],
      resas: [],
    });
  }
  return cells;
}

export function CalendrierPage() {
  const { data: locations = [] } = useLocations();
  const { data: reservations = [] } = useReservations();
  const [cursor, setCursor] = useState(() => new Date());

  const cells = useMemo(
    () =>
      buildMonth(
        cursor.getFullYear(),
        cursor.getMonth(),
        locations,
        reservations,
      ),
    [cursor, locations, reservations],
  );

  function shift(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }
  function goToday() {
    setCursor(new Date());
  }

  return (
    <>
      <PageHeader
        title="Calendrier"
        description={`${MOIS_FR[cursor.getMonth()]} ${cursor.getFullYear()}`}
        icon={<CalendarDays className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={goToday}>
              Aujourd'hui
            </Button>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button variant="outline" size="icon-sm" onClick={() => shift(-1)}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Mois précédent</span>
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => shift(1)}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Mois suivant</span>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Legend tone="loc" label="Location réelle" />
            <Legend tone="res" label="Réservation prévisionnelle" />
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm border-2 border-primary" />
              Aujourd'hui
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {JOURS_FR.map((j) => (
              <div
                key={j}
                className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {j}
              </div>
            ))}
            {cells.map((c, i) => (
              <DayCellView key={`${c.iso}-${i}`} cell={c} />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function DayCellView({ cell }: { cell: DayCell }) {
  const total = cell.locs.length + cell.resas.length;
  const cellNode = (
    <div
      className={cn(
        "min-h-[88px] rounded-md border bg-white p-1.5 transition-colors data-[state=closed]:bg-card",
        !cell.inMonth && "opacity-40",
        cell.isToday && "border-primary ring-1 ring-primary/40",
        total > 0 && "cursor-default",
      )}
    >
      <div className="mb-1 text-[11px] font-bold tabular-nums">
        {cell.date.getDate()}
      </div>
      <div className="space-y-0.5">
        {cell.locs.slice(0, 2).map((l) => (
          <div
            key={`L${l.id}`}
            className="truncate rounded-sm bg-blue-100 px-1 py-0.5 text-[14px] text-blue-900"
          >
            <span className="font-mono text-[9px] opacity-60">{l.id}</span>{" "}
            {l.nom}
          </div>
        ))}
        {cell.resas.slice(0, 2).map((r) => (
          <div
            key={`R${r.id}`}
            className="truncate rounded-sm bg-violet-100 px-1 py-0.5 text-[14px] text-violet-900"
          >
            <span className="font-mono text-[9px] opacity-60">{r.id}</span>{" "}
            {r.nom}
          </div>
        ))}
        {total > 4 && (
          <div className="text-[14px] text-muted-foreground">
            + {total - 4}…
          </div>
        )}
      </div>
    </div>
  );

  if (total === 0) return cellNode;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{cellNode}</HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="mb-2 text-sm font-semibold">{fmtDate(cell.iso)}</div>
        <div className="space-y-2">
          {cell.locs.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Locations
              </div>
              <ul className="space-y-1">
                {cell.locs.map((l) => (
                  <li
                    key={l.id}
                    className="rounded-sm bg-blue-50 px-2 py-1.5 text-xs text-blue-900"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[14px] opacity-60">
                        {l.id}
                      </span>
                      <span className="text-[14px] opacity-70">
                        {l.tables}T · {l.tente_marron}M · {l.tente_blanche}B
                      </span>
                    </div>
                    <div className="font-medium">{l.nom}</div>
                    {l.evenement && (
                      <div className="text-[11px] italic">{l.evenement}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {cell.resas.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Réservations
              </div>
              <ul className="space-y-1">
                {cell.resas.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-sm bg-violet-50 px-2 py-1.5 text-xs text-violet-900"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[14px] opacity-60">
                        {r.id}
                      </span>
                      <span className="text-[14px] opacity-70">
                        {r.tables}T · {r.tente_marron}M · {r.tente_blanche}B
                      </span>
                    </div>
                    <div className="font-medium">{r.nom}</div>
                    {r.evenement && (
                      <div className="text-[11px] italic">{r.evenement}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function Legend({ tone, label }: { tone: "loc" | "res"; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-block h-2.5 w-2.5 rounded-sm",
          tone === "loc" ? "bg-blue-200" : "bg-violet-200",
        )}
      />
      {label}
    </span>
  );
}
