import { useState } from 'react'
import { Sheet } from './Sheet'
import { ActivitySheet } from './ActivitySheet'
import { useStore } from '../store'
import { Icon } from './Icon'
import { AktivitaetsIcon } from './AktivitaetsIcon'
import { CAT_ICON, CAT_LABEL, CAT_ORDER } from '../lib/categories'
import { addDays, dateFromKey, fmtTime } from '../lib/energy'
import type { Category, EnergyEvent } from '../types'

const CAT_CLASS: Record<Category, string> = { green: 'green', orange: 'amber', red: 'red' }

/** Eine Serie legt ein halbes Jahr im Voraus an – ohne dass die Nutzerin
 *  eine Zahl wählen muss. */
const SERIE_WOCHEN = 26

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

/**
 * Alle Termine einer Serie: für jede der kommenden Wochen jeder gewählte
 * Wochentag. Tage vor dem Starttermin fallen weg, damit eine am Mittwoch
 * angelegte Serie nicht rückwirkend am Montag beginnt.
 */
function serienTage(start: string, tage: number[]): string[] {
  if (!tage.length) return [start]
  // Montag der Startwoche als Anker – von dort ist jeder Wochentag ein Offset.
  const startIndex = (dateFromKey(start).getDay() + 6) % 7
  const montag = addDays(start, -startIndex)
  const ergebnis: string[] = []
  for (let woche = 0; woche < SERIE_WOCHEN; woche++) {
    for (const tag of [...tage].sort((a, b) => a - b)) {
      const d = addDays(montag, woche * 7 + tag)
      if (d >= start) ergebnis.push(d)
    }
  }
  return ergebnis
}

/** Minuten seit Mitternacht, oder null bei leerer/ungültiger Eingabe. */
function toMinutes(v: string): number | null {
  const [h, m] = v.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

/** Termine über Mitternacht sind erlaubt, aber nur bis zu dieser Länge – darüber
 *  liegt fast sicher ein Vertipper vor (z. B. 14:00–13:00 ergäbe 23 Stunden). */
const MAX_OVERNIGHT_MIN = 12 * 60

interface Zeitraum {
  duration: number | null
  fehler: string | null
  überMitternacht: boolean
}

function zeitraum(startMin: number | null, endMin: number | null): Zeitraum {
  if (startMin === null || endMin === null) {
    return { duration: null, fehler: 'Bitte Beginn und Ende ausfüllen.', überMitternacht: false }
  }
  if (endMin === startMin) {
    return { duration: null, fehler: 'Ende muss nach dem Beginn liegen.', überMitternacht: false }
  }
  if (endMin > startMin) {
    return { duration: endMin - startMin, fehler: null, überMitternacht: false }
  }
  const übernacht = endMin + 1440 - startMin
  if (übernacht > MAX_OVERNIGHT_MIN) {
    return { duration: null, fehler: 'Ende liegt vor dem Beginn – bitte Zeiten prüfen.', überMitternacht: false }
  }
  return { duration: übernacht, fehler: null, überMitternacht: true }
}

function dauerText(min: number): string {
  const std = Math.floor(min / 60)
  const rest = min % 60
  if (std === 0) return `${rest} Min`
  if (rest === 0) return `${std} Std`
  return `${std} Std ${rest} Min`
}

export function EventSheet({ date, event, onClose }: { date: string; event?: EnergyEvent; onClose: () => void }) {
  const { state, addEvent, addEventSeries, updateEvent, removeEvent, removeSeriesFrom, upsertActivity } = useStore()
  const [activityId, setActivityId] = useState(event?.activityId ?? '')
  // Ohne vorausgewählte Kategorie bleibt die Liste zu, bis eine angetippt wird.
  const [cat, setCat] = useState<Category | null>(
    state.activities.find((a) => a.id === event?.activityId)?.category ?? null,
  )
  const [start, setStart] = useState(fmtTime(event?.start ?? 9 * 60))
  const [end, setEnd] = useState(fmtTime((event?.start ?? 9 * 60) + (event?.durationMin ?? 60)))
  const [title, setTitle] = useState(event?.title ?? '')
  const [note, setNote] = useState(event?.note ?? '')
  const [newActivity, setNewActivity] = useState(false)
  const [repeat, setRepeat] = useState(false)

  /** Die Aktivitätenliste öffnet sich als eigene Ansicht über dem Formular. */
  const [listeFuer, setListeFuer] = useState<Category | null>(null)

  /**
   * Wochentage der Wiederholung, 0 = Montag. Vorbelegt ist der Tag des
   * Termins; wer weitere antippt, bekommt die Serie an allen gewählten Tagen.
   */
  const [wochentage, setWochentage] = useState<number[]>([(dateFromKey(date).getDay() + 6) % 7])

  /**
   * Wurde der Titel automatisch gesetzt? Dann darf ein Aktivitätswechsel ihn
   * überschreiben – selbst Getipptes bleibt dagegen stehen.
   */
  const [titelAutomatisch, setTitelAutomatisch] = useState(!event?.title)

  const activity = state.activities.find((a) => a.id === activityId)

  /** Auswahl übernehmen und die Liste schließen. */
  const aktivitaetWaehlen = (id: string) => {
    setActivityId(id)
    const gewaehlt = state.activities.find((a) => a.id === id)
    // Die Studienleitung wollte den gewählten Namen gleich im Titel sehen,
    // statt ihn nur blass als Platzhalter angedeutet zu bekommen.
    if (gewaehlt && titelAutomatisch) setTitle(gewaehlt.name)
    setListeFuer(null)
  }
  const startMin = toMinutes(start)
  const { duration, fehler, überMitternacht } = zeitraum(startMin, toMinutes(end))
  const delta = activity && duration !== null ? (activity.ratePer30 * duration) / 30 : 0
  const speicherbar = !!activity && duration !== null && startMin !== null

  const save = () => {
    if (!speicherbar) return
    const payload = {
      start: startMin,
      durationMin: duration,
      activityId,
      title: title.trim() || undefined,
      note: note.trim() || undefined,
    }
    if (event) {
      updateEvent(event.id, payload)
    } else if (repeat) {
      addEventSeries(payload, serienTage(date, wochentage))
    } else {
      addEvent({ ...payload, date })
    }
    onClose()
  }

  return (
    <Sheet
      title={event ? 'Termin bearbeiten' : 'Neuer Termin'}
      subtitle="Was steht an – und was macht es mit deiner Energie?"
      onClose={onClose}
    >
      {/* Eigene Ansicht statt langer Liste im Formular: die Studienleitung
          wollte beim Antippen einer Art nur noch deren Aktivitäten sehen. */}
      {listeFuer && (
        <div className="unteransicht">
          <div className="unteransicht-kopf">
            <button className="btn icon" aria-label="Zurück" onClick={() => setListeFuer(null)}>
              <Icon name="arrowLeft" size={18} />
            </button>
            <div>
              <p className="unteransicht-titel">{CAT_LABEL[listeFuer]}</p>
              <p className="muted">Wähle eine Aktivität oder lege eine neue an</p>
            </div>
          </div>

          {/* Oben, damit man dafür nicht erst durch die ganze Liste scrollen muss. */}
          <button
            className="btn primary block"
            onClick={() => {
              setCat(listeFuer)
              setNewActivity(true)
            }}
          >
            <Icon name="plus" size={16} />
            Neue Aktivität anlegen
          </button>

          <div className="unteransicht-liste">
            {state.activities
              .filter((a) => a.category === listeFuer)
              .map((a) => (
                <button
                  key={a.id}
                  className={`act-row ${a.category}`}
                  onClick={() => aktivitaetWaehlen(a.id)}
                >
                  <span className="ico">
                    <AktivitaetsIcon name={a.icon} size={24} />
                  </span>
                  <span style={{ flex: 1, fontSize: 14.5 }}>{a.name}</span>
                  <span className={`delta ${a.ratePer30 > 0 ? 'pos' : a.ratePer30 < 0 ? 'neg' : 'zero'}`}>
                    {a.ratePer30 > 0 ? '+' : ''}
                    {a.ratePer30}%
                  </span>
                  <span className={`radio ${activityId === a.id ? 'an' : ''}`} />
                </button>
              ))}
            {state.activities.filter((a) => a.category === listeFuer).length === 0 && (
              <div className="empty-state">Hier ist noch nichts eingetragen.</div>
            )}
          </div>
        </div>
      )}

      <div className="field">
        <span className="lbl">Art der Aktivität</span>
        <div className="cat-wahl">
          {CAT_ORDER.map((c) => (
            <button
              key={c}
              className={`cat-karte ${CAT_CLASS[c]} ${cat === c ? 'active' : ''}`}
              onClick={() => {
                setCat(c)
                // Wechselt die Art, passt die bisherige Auswahl nicht mehr.
                if (activity && activity.category !== c) setActivityId('')
                setListeFuer(c)
              }}
            >
              <Icon name={CAT_ICON[c]} size={28} strokeWidth={1.8} />
              <span>{CAT_LABEL[c]}</span>
            </button>
          ))}
        </div>
      </div>

      {cat && (
        <div className="field">
          <span className="lbl">Aktivität</span>
          <button className={`gewaehlte-aktivitaet ${cat}`} onClick={() => setListeFuer(cat)}>
            {activity ? (
              <>
                <span className="ico">
                  <AktivitaetsIcon name={activity.icon} size={24} />
                </span>
                <span className="gewaehlt-name">{activity.name}</span>
                <span className={`delta ${activity.ratePer30 > 0 ? 'pos' : activity.ratePer30 < 0 ? 'neg' : 'zero'}`}>
                  {activity.ratePer30 > 0 ? '+' : ''}
                  {activity.ratePer30}%
                </span>
              </>
            ) : (
              <>
                <span className="ico">
                  <Icon name="plus" size={22} />
                </span>
                <span className="gewaehlt-name muted">Aktivität auswählen</span>
              </>
            )}
            <Icon name="chevron" size={17} />
          </button>
        </div>
      )}

      {activity && activity.category !== 'orange' && (
        <div className="field">
          <span className="lbl">
            Wirkung von „{activity.name}“ pro 30 Minuten
          </span>
          <div className="rate-editor">
            <input
              type="range"
              min={1}
              max={30}
              value={Math.abs(activity.ratePer30)}
              onChange={(e) => {
                const betrag = Number(e.target.value)
                upsertActivity({ ...activity, ratePer30: activity.category === 'green' ? betrag : -betrag })
              }}
            />
            <span className={`delta ${activity.ratePer30 > 0 ? 'pos' : 'neg'}`} style={{ fontSize: 17, fontWeight: 600 }}>
              {activity.ratePer30 > 0 ? '+' : ''}
              {activity.ratePer30}%
            </span>
          </div>
          <p className="tiny" style={{ marginTop: 6 }}>
            Gilt für alle Termine mit dieser Aktivität.
          </p>
        </div>
      )}

      <div className="grid2">
        <label className="field">
          <span className="lbl">
            <span className="lbl-ico">
              <Icon name="sunrise" size={15} />
            </span>
            Beginn
          </span>
          <input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="field">
          <span className="lbl">
            <span className="lbl-ico">
              <Icon name="moon" size={15} />
            </span>
            Ende
          </span>
          <input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      {fehler ? (
        <p className="field-error">
          <Icon name="alert" size={14} />
          {fehler}
        </p>
      ) : (
        <p className="tiny" style={{ marginTop: 6 }}>
          Dauer: {dauerText(duration!)}
          {überMitternacht ? ' · geht bis zum nächsten Tag' : ''}
        </p>
      )}

      <label className="field">
        <span className="lbl">Titel</span>
        <input
          className="input titel-feld"
          value={title}
          placeholder={activity?.name ?? 'z. B. Mathe-Klausur'}
          onChange={(e) => {
            setTitle(e.target.value)
            // Ab jetzt ist der Titel von Hand gesetzt und bleibt bei einem
            // Aktivitätswechsel stehen.
            setTitelAutomatisch(false)
          }}
        />
      </label>

      <label className="field">
        <span className="lbl">Notiz (optional)</span>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      {!event && (
        <div className="field">
          <button className="spread" style={{ width: '100%' }} onClick={() => setRepeat((r) => !r)}>
            <span className="row" style={{ gap: 11 }}>
              <span className={`big-ico ${repeat ? 'green' : ''}`}>
                <Icon name="calendar" size={22} />
              </span>
              <span style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 500 }}>Wiederholt sich wöchentlich</span>
                <span className="muted">Jede Woche am selben Tag</span>
              </span>
            </span>
            <span className={`switch ${repeat ? 'on' : ''}`} />
          </button>

          {repeat && (
            <div className="card" style={{ marginTop: 8 }}>
              <span className="lbl">An welchen Tagen?</span>
              <div className="wochentage">
                {WOCHENTAGE.map((kuerzel, i) => (
                  <button
                    key={kuerzel}
                    type="button"
                    className={`wochentag ${wochentage.includes(i) ? 'an' : ''}`}
                    aria-pressed={wochentage.includes(i)}
                    onClick={() =>
                      setWochentage((w) => (w.includes(i) ? w.filter((x) => x !== i) : [...w, i]))
                    }
                  >
                    {kuerzel}
                  </button>
                ))}
              </div>
              <p className="tiny" style={{ marginTop: 8 }}>
                {wochentage.length === 0
                  ? 'Ohne Tag wird der Termin nur einmal eingetragen.'
                  : `${serienTage(date, wochentage).length} Termine über die nächsten ${SERIE_WOCHEN} Wochen.`}
              </p>
            </div>
          )}
        </div>
      )}

      {activity && duration !== null && startMin !== null && (
        <div className="wirkung-karte">
          <span className={`big-ico ${CAT_CLASS[activity.category]}`}>
            <Icon name={CAT_ICON[activity.category]} size={24} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: 13.5, color: 'var(--ink-2)' }}>Energiewirkung</span>
            <span className="muted">
              {fmtTime(startMin)} – {fmtTime(startMin + duration)}
              {repeat && !event ? ' · wöchentlich' : ''}
            </span>
          </span>
          <span className={`delta ${delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'zero'}`} style={{ fontSize: 22, fontWeight: 600 }}>
            {delta > 0 ? '+' : ''}
            {Math.round(delta)}%
          </span>
        </div>
      )}

      <button className="btn primary block" style={{ marginTop: 16 }} disabled={!speicherbar} onClick={save}>
        <Icon name="check" size={16} />
        {event ? 'Änderungen speichern' : 'Termin eintragen'}
      </button>

      {/* Ein gesperrter Knopf ohne Begruendung sieht aus wie ein Fehler in der
          App. Deshalb steht hier, welcher Schritt noch fehlt. */}
      {!speicherbar && (
        <p className="tiny" style={{ marginTop: 8, textAlign: 'center' }}>
          {!cat
            ? 'Wähle oben aus, welche Art von Aktivität das ist.'
            : !activity
              ? 'Tippe jetzt die passende Aktivität in der Liste an.'
              : 'Prüfe Beginn und Ende.'}
        </p>
      )}

      {event && !event.seriesId && (
        <button
          className="btn ghost block"
          style={{ marginTop: 6, color: 'var(--red)' }}
          onClick={() => {
            removeEvent(event.id)
            onClose()
          }}
        >
          Termin löschen
        </button>
      )}

      {event && event.seriesId && (
        <div className="stack" style={{ marginTop: 6 }}>
          <button
            className="btn ghost block"
            style={{ color: 'var(--red)' }}
            onClick={() => {
              removeEvent(event.id)
              onClose()
            }}
          >
            Nur diesen Termin löschen
          </button>
          <button
            className="btn ghost block"
            style={{ color: 'var(--red)' }}
            onClick={() => {
              removeSeriesFrom(event.seriesId!, event.date)
              onClose()
            }}
          >
            Diesen und alle folgenden löschen
          </button>
        </div>
      )}

      {newActivity && (
        <ActivitySheet
          defaultCategory={cat ?? 'red'}
          onSaved={(a) => {
            setCat(a.category)
            setActivityId(a.id)
            if (titelAutomatisch) setTitle(a.name)
            setListeFuer(null)
          }}
          onClose={() => setNewActivity(false)}
        />
      )}
    </Sheet>
  )
}
