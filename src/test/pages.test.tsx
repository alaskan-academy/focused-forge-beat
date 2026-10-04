import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';

const fake = vi.hoisted(() => ({ current: null as null | ReturnType<typeof import('./fakeSupabase').createFakeSupabase> }));

vi.mock('@/integrations/supabase/externalClient', () => ({
  get externalSupabase() {
    return fake.current!.client;
  },
}));

import { createFakeSupabase } from './fakeSupabase';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import DashboardPage from '@/pages/DashboardPage';
import TasksPage from '@/pages/TasksPage';
import CalendarPage from '@/pages/CalendarPage';
import RecurrencesPage from '@/pages/RecurrencesPage';
import ProductivityPage from '@/pages/ProductivityPage';
import InboxPage from '@/pages/InboxPage';
import ProjectsPage from '@/pages/ProjectsPage';
import TrashPage from '@/pages/TrashPage';
import TaskModal from '@/components/TaskModal';
import { Task } from '@/lib/types';

const base = {
  area: 'work', project_id: null, project_name: null, project_color: null, status: 'todo', priority: 'medium',
  start_date: null, estimated_minutes: 60, actual_minutes: null, notes: null,
  created_at: '2026-09-01T12:00:00Z', completed_at: null, deleted_at: null, user_id: 'user-1', total_tracked_minutes: 0,
};

const weeklyWed = {
  ...base, id: 'rec-1', name: 'Reunião semanal', priority: 'high', due_date: '2026-09-02',
  recurrence_config: { type: 'weekly', interval: 1, days_of_week: [3], completed_dates: ['2026-09-02', '2026-09-30'], work_block: 'morning' },
};
const weeklyMissed = {
  ...base, id: 'rec-2', name: 'Análise de Funil', due_date: '2026-09-03',
  recurrence_config: { type: 'weekly', interval: 1, days_of_week: [4], completed_dates: [], work_block: 'afternoon' },
};
const dailyMorning = {
  ...base, id: 'daily-1', name: 'Homework English', area: 'personal', due_date: '2026-09-01',
  recurrence_config: { type: 'daily', interval: 1, completed_dates: [], work_block: 'morning' },
};
const oneOffToday = {
  ...base, id: 'one-1', name: 'Subir novas pages', due_date: '2026-10-05', estimated_minutes: 40, total_tracked_minutes: 30,
  recurrence_config: { type: 'none', interval: 1, work_block: 'afternoon' },
};
const overdue = {
  ...base, id: 'late-1', name: 'Resolver BM da Aeliss', due_date: '2026-10-01',
  recurrence_config: { type: 'none', interval: 1, work_block: 'afternoon' },
};
const multiDay = {
  ...base, id: 'multi-1', name: 'FAQ Lumii', start_date: '2026-10-05', due_date: '2026-10-09', estimated_minutes: 180,
  recurrence_config: { type: 'none', interval: 1, work_block: 'afternoon' },
};

const rows = [weeklyWed, weeklyMissed, dailyMorning, oneOffToday, overdue, multiDay];

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 5, 10, 0)); // Monday 2026-10-05 10:00
  fake.current = createFakeSupabase({
    tasks_with_time: rows.map((r) => ({ ...r })),
    tasks: rows.map((r) => ({ ...r })),
    timer_sessions: [{ id: 's1', task_id: 'one-1', duration_minutes: 30, started_at: '2026-10-05T12:00:00Z', ended_at: '2026-10-05T12:30:00Z' }],
    projects: [],
    reminders: [],
    inbox_items: [{ id: 'in-1', content: 'Ideia para o funil', is_done: false, created_at: '2026-10-04T12:00:00Z', user_id: 'user-1' }],
    user_preferences: [],
  });
  queryClient.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('pages render with data', () => {
  it('Dashboard shows today, the work blocks and overdue tasks', async () => {
    render(wrap(<DashboardPage />));
    expect(await screen.findByText('Subir novas pages')).toBeInTheDocument();
    expect(screen.getByText('Homework English')).toBeInTheDocument();
    expect(screen.getByText('FAQ Lumii')).toBeInTheDocument();
    expect(screen.getByText('Atrasadas')).toBeInTheDocument();
    expect(screen.getByText('Resolver BM da Aeliss')).toBeInTheDocument();
    // Last Thursday's occurrence was not done: overdue, with the missed day
    expect(screen.getByText('Análise de Funil')).toBeInTheDocument();
    expect(screen.getByText('Perdida: qui, 01/10')).toBeInTheDocument();
    // Wednesday-only recurrence (last one done) does not show on Monday
    expect(screen.queryByText('Reunião semanal')).not.toBeInTheDocument();
  });

  it('Dashboard completes a task straight from the list', async () => {
    render(wrap(<DashboardPage />));
    const checkbox = await screen.findByRole('checkbox', { name: 'Concluir Subir novas pages' });
    fireEvent.click(checkbox);
    await waitFor(() => {
      const update = fake.current!.calls.find((c) => c.op === 'update' && c.table === 'tasks');
      expect(update?.payload).toMatchObject({ status: 'done' });
      expect(update?.filters).toEqual([['id', 'one-1']]);
    });
  });

  it('Dashboard completes a recurring occurrence on the viewed day', async () => {
    render(wrap(<DashboardPage />));
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Concluir Homework English' }));
    await waitFor(() => {
      const update = fake.current!.calls.find((c) => c.op === 'update' && c.table === 'tasks');
      expect((update?.payload as { recurrence_config: { completed_dates: string[] } }).recurrence_config.completed_dates)
        .toContain('2026-10-05');
    });
  });

  it('day navigation shows the Wednesday occurrence', async () => {
    render(wrap(<DashboardPage />));
    await screen.findByText('Subir novas pages');
    fireEvent.click(screen.getByRole('button', { name: 'Próximo período' })); // Tue (amanhã)
    fireEvent.click(screen.getByRole('button', { name: 'Próximo período' })); // Wed
    expect(await screen.findByText('Reunião semanal')).toBeInTheDocument();
  });

  it.each([
    ['Tarefas', TasksPage, 'Subir novas pages'],
    ['Calendário', CalendarPage, 'Subir novas pages'],
    ['Recorrências', RecurrencesPage, 'Reunião semanal'],
    ['Produtividade', ProductivityPage, 'Taxa de conclusão'],
    ['Inbox', InboxPage, 'Ideia para o funil'],
    ['Projetos', ProjectsPage, 'Projetos'],
    ['Lixeira', TrashPage, 'Nenhuma tarefa excluída'],
  ])('%s renders', async (_name, Page, text) => {
    render(wrap(<Page />));
    expect((await screen.findAllByText(text)).length).toBeGreaterThan(0);
  });
});

describe('moving one occurrence of a recurring task', () => {
  it('moves Wednesday to Friday from the task modal', async () => {
    const task = { ...weeklyWed, session_minutes_by_date: {} } as unknown as Task;
    render(wrap(
      <TaskModal open onClose={() => {}} task={task} contextDate={new Date(2026, 9, 7)} />,
    ));

    const trigger = await screen.findByRole('button', { name: /Ocorrência/ });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Mover para outro dia…' }));

    const dialog = await screen.findByRole('dialog', { name: 'Mover ocorrência' });
    // The occurrence being viewed (Wednesday 07/10) is preselected
    expect(within(dialog).getByRole('combobox')).toHaveTextContent('qua, 07/10');
    // Another Wednesday already has this task, so it can't receive the move
    expect(within(dialog).getByRole('gridcell', { name: '14' })).toBeDisabled();

    fireEvent.click(within(dialog).getByRole('gridcell', { name: '9' }));
    expect(within(dialog).getByText('sex, 09/10')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mover' }));

    await waitFor(() => {
      const update = fake.current!.calls.find((c) => c.op === 'update' && c.table === 'tasks');
      const rc = (update?.payload as { recurrence_config: Record<string, unknown> }).recurrence_config;
      expect(rc.rescheduled).toEqual({ '2026-10-07': '2026-10-09' });
      // History and work block are kept
      expect(rc.completed_dates).toEqual(['2026-09-02', '2026-09-30']);
      expect(rc.work_block).toBe('morning');
    });
  });

  it('asks before deleting and keeps the task in the trash', async () => {
    const task = { ...weeklyWed, session_minutes_by_date: {} } as unknown as Task;
    render(wrap(<TaskModal open onClose={() => {}} task={task} />));

    fireEvent.click(await screen.findByRole('button', { name: 'Excluir tarefa' }));
    const confirm = await screen.findByRole('alertdialog');
    expect(confirm).toHaveTextContent('Lixeira');
    expect(fake.current!.calls).toHaveLength(0);

    fireEvent.click(within(confirm).getByRole('button', { name: 'Excluir' }));
    await waitFor(() => {
      const update = fake.current!.calls.find((c) => c.op === 'update' && c.table === 'tasks');
      expect(update?.payload).toHaveProperty('deleted_at');
    });
    expect(fake.current!.calls.some((c) => c.op === 'delete')).toBe(false);
  });

  it('ending a recurrence keeps its history', async () => {
    const task = { ...weeklyWed, session_minutes_by_date: {} } as unknown as Task;
    render(wrap(<TaskModal open onClose={() => {}} task={task} />));

    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Recorrência' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Encerrar recorrência' }));
    const confirm = await screen.findByRole('alertdialog');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Encerrar' }));

    await waitFor(() => {
      const update = fake.current!.calls.find((c) => c.op === 'update' && c.table === 'tasks');
      const rc = (update?.payload as { recurrence_config: Record<string, unknown> }).recurrence_config;
      expect(rc).toMatchObject({ type: 'weekly', end_date: '2026-10-04', completed_dates: ['2026-09-02', '2026-09-30'], work_block: 'morning' });
    });
  });
});
