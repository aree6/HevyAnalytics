import { useMemo, useState, useEffect } from 'react';
import type { Session } from '../historySessions';

const ITEMS_PER_PAGE = 3;

const formatWorkoutDuration = (ms: number): string | null => {
  if (!Number.isFinite(ms) || ms <= 0) return null;

  const totalMinutes = Math.round(ms / (60 * 1000));
  if (totalMinutes <= 0) return 'less than 1 min';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const hourPart = hours > 0 ? `${hours} hour${hours === 1 ? '' : 's'}` : '';
  const minutePart = minutes > 0 ? `${minutes} min${minutes === 1 ? '' : 's'}` : '';

  if (hourPart && minutePart) return `${hourPart} ${minutePart}`;
  return hourPart || minutePart;
};

const getSessionDurationMs = (session: Session): number | null => {
  const start = session.date;
  if (!start) return null;

  let endMs = NaN;
  for (const ex of session.exercises) {
    for (const s of ex.sets) {
      const end = (s as any).end_time ? new Date(String((s as any).end_time).trim()) : null;
      const t = end?.getTime?.() ?? NaN;
      if (Number.isFinite(t)) endMs = Math.max(Number.isFinite(endMs) ? endMs : t, t);
    }
  }

  if (!Number.isFinite(endMs)) return null;
  const dur = endMs - start.getTime();
  return Number.isFinite(dur) && dur > 0 ? dur : null;
};

const isSameCalendarDay = (a: Date, b: Date) => {
  const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return format(a) === format(b);
};

export interface useHistorySessionReturn {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  currentSessions: Session[];
  totalPages: number;
  collapsedSessions: Set<string>;
  toggleSessionCollapse: (key: string) => void;
  formatWorkoutDuration: (ms: number) => string | null;
  getSessionDurationMs: (session: Session) => number | null;
  sessionKeys: string[];
}

export const useHistorySession = (
  sessions: Session[],
  targetDate: Date | null | undefined,
  onTargetDateConsumed?: () => void
): useHistorySessionReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const [collapsedSessions, setCollapsedSessions] = useState<Set<string>>(() => new Set());

  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const currentSessions = sessions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const sessionKeys = useMemo(() => sessions.map(s => s.key), [sessions]);

  const toggleSessionCollapse = (key: string) => {
    setCollapsedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [sessions]);

  useEffect(() => {
    setCollapsedSessions(new Set());
  }, [sessions]);

  useEffect(() => {
    if (!targetDate || sessions.length === 0) return;

    const targetSessionIndex = sessions.findIndex(session =>
      session.date && isSameCalendarDay(session.date, targetDate)
    );

    if (targetSessionIndex !== -1) {
      const targetPage = Math.floor(targetSessionIndex / ITEMS_PER_PAGE) + 1;

      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      }

      setTimeout(() => {
        const sessionElement = document.getElementById(`session-${sessions[targetSessionIndex].key}`);
        if (sessionElement) {
          sessionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          sessionElement.classList.add('bg-emerald-400/10');
          setTimeout(() => {
            sessionElement.classList.remove('bg-emerald-400/10');
          }, 2000);
        }
        onTargetDateConsumed?.();
      }, 100);
    } else {
      onTargetDateConsumed?.();
    }
  }, [targetDate, sessions, currentPage, onTargetDateConsumed]);

  return {
    currentPage,
    setCurrentPage,
    currentSessions,
    totalPages,
    collapsedSessions,
    toggleSessionCollapse,
    formatWorkoutDuration,
    getSessionDurationMs,
    sessionKeys,
  };
};
