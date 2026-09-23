import {
  createLifecareReminder,
  getLifecareReminderOptions,
  removeLifecareReminder,
  updateLifecareReminder,
} from '@services/lifecare-reminder-service';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrandBevakningar } from './errand-bevakningar.component';

vi.mock('@services/lifecare-reminder-service', () => ({
  getLifecareReminderOptions: vi.fn(),
  createLifecareReminder: vi.fn(),
  updateLifecareReminder: vi.fn(),
  removeLifecareReminder: vi.fn(),
}));

// Today is pinned so the dates below are in the future however long the tests live.
vi.mock('@utils/today-date', () => ({ todayDate: () => '2026-09-23' }));

const OPTIONS = {
  priorities: [
    { code: 1, text: 'Hög' },
    { code: 2, text: 'Normal' },
  ],
  statuses: [
    { code: 2, text: 'Klar' },
    { code: 3, text: 'Ej påbörjad' },
  ],
  defaultPriority: 2,
  defaultStatus: 3,
};

const REMINDER = {
  id: 40,
  date: '2026-09-25',
  status: 'Ej påbörjad',
  statusCode: 3,
  priority: 'Normal',
  priorityCode: 2,
  type: 'Manuell bevakning insats',
  objectType: 'IFO.Insats',
  text: 'Kontrollera hyran',
  caseworker: 'Test Handläggare',
  caseworkerId: 'TEST',
};

const renderSection = (refresh = vi.fn()) =>
  render(
    <ErrandBevakningar
      errandId="errand-1"
      reminders={[REMINDER]}
      isLoading={false}
      loadError={false}
      refresh={refresh}
    />
  );

/** The form for a new bevakning at the bottom of the section. */
const newForm = () => {
  const button = screen.getByRole('button', { name: 'Lägg till bevakning' });
  const form = button.closest('div.flex.flex-col');
  if (!(form instanceof HTMLElement)) {
    throw new Error('the new-bevakning form did not render');
  }
  return within(form);
};

describe('ErrandBevakningar', () => {
  beforeEach(() => {
    vi.mocked(getLifecareReminderOptions).mockReset();
    vi.mocked(getLifecareReminderOptions).mockResolvedValue({ data: OPTIONS });
    vi.mocked(createLifecareReminder).mockReset();
    vi.mocked(updateLifecareReminder).mockReset();
    vi.mocked(removeLifecareReminder).mockReset();
  });

  it('lists the bevakningar read from Lifecare, with who they are bevakade av', () => {
    renderSection();

    expect(screen.getByText('Kontrollera hyran')).toBeInTheDocument();
    expect(screen.getByText('Test Handläggare · Manuell bevakning insats')).toBeInTheDocument();
  });

  it('adds a bevakning with the proposed priority and status and no receiver to pick', async () => {
    vi.mocked(createLifecareReminder).mockResolvedValue({ data: null });
    const refresh = vi.fn();
    renderSection(refresh);
    const form = newForm();

    await waitFor(() => {
      expect(form.getByLabelText('Prioritet')).toHaveValue('2');
    });
    expect(screen.queryByLabelText(/Mottagare/)).not.toBeInTheDocument();
    fireEvent.change(form.getByLabelText('Datum *'), { target: { value: '2026-09-30' } });
    fireEvent.change(form.getByLabelText('Text *'), { target: { value: 'Följ upp hyresavin' } });
    fireEvent.click(form.getByRole('button', { name: 'Lägg till bevakning' }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
    expect(createLifecareReminder).toHaveBeenCalledWith('errand-1', {
      reminderDate: '2026-09-30',
      priority: 2,
      status: 3,
      text: 'Följ upp hyresavin',
    });
  });

  it('holds the add button for a date in the past', async () => {
    renderSection();
    const form = newForm();
    await waitFor(() => {
      expect(form.getByLabelText('Prioritet')).toHaveValue('2');
    });

    fireEvent.change(form.getByLabelText('Datum *'), { target: { value: '2026-09-22' } });
    fireEvent.change(form.getByLabelText('Text *'), { target: { value: 'För sent' } });

    expect(form.getByRole('button', { name: 'Lägg till bevakning' })).toBeDisabled();
  });

  it('changes a bevakning — here marking it done — in Lifecare', async () => {
    vi.mocked(updateLifecareReminder).mockResolvedValue({ data: null });
    const refresh = vi.fn();
    renderSection(refresh);
    // The choices come from Lifecare, so the form is opened once they are in.
    await waitFor(() => {
      expect(newForm().getByLabelText('Prioritet')).toHaveValue('2');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ändra bevakning' }));
    const [editStatus] = screen.getAllByLabelText('Status');
    if (!editStatus) {
      throw new Error('the edit form did not open');
    }
    fireEvent.change(editStatus, { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Spara' }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
    expect(updateLifecareReminder).toHaveBeenCalledWith('errand-1', 40, {
      reminderDate: '2026-09-25',
      priority: 2,
      status: 2,
      text: 'Kontrollera hyran',
    });
  });

  it('shows the reason Lifecare gave and keeps the text', async () => {
    vi.mocked(createLifecareReminder).mockResolvedValue({
      error: 400,
      message: 'Insatsen har ingen handläggare i Lifecare som kan bevaka.',
    });
    renderSection();
    const form = newForm();
    await waitFor(() => {
      expect(form.getByLabelText('Prioritet')).toHaveValue('2');
    });

    fireEvent.change(form.getByLabelText('Datum *'), { target: { value: '2026-09-30' } });
    fireEvent.change(form.getByLabelText('Text *'), { target: { value: 'Följ upp hyresavin' } });
    fireEvent.click(form.getByRole('button', { name: 'Lägg till bevakning' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Insatsen har ingen handläggare i Lifecare som kan bevaka.');
    });
    expect(form.getByLabelText('Text *')).toHaveValue('Följ upp hyresavin');
  });

  it('removes a bevakning in Lifecare once the handläggare has confirmed', async () => {
    vi.mocked(removeLifecareReminder).mockResolvedValue({ data: null });
    const refresh = vi.fn();
    renderSection(refresh);

    fireEvent.click(screen.getByRole('button', { name: 'Ta bort bevakning' }));
    // Nothing is removed on the first click — it only asks.
    expect(removeLifecareReminder).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button', { name: 'Ta bort bevakning' })[1] ?? document.body);

    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
    expect(removeLifecareReminder).toHaveBeenCalledWith('errand-1', 40);
  });

  it('shows the reason Lifecare gave when it refuses the removal', async () => {
    vi.mocked(removeLifecareReminder).mockResolvedValue({
      error: 404,
      message: 'Bevakningen finns inte på insatsen i Lifecare',
    });
    const refresh = vi.fn();
    renderSection(refresh);

    fireEvent.click(screen.getByRole('button', { name: 'Ta bort bevakning' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Ta bort bevakning' })[1] ?? document.body);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Bevakningen finns inte på insatsen i Lifecare');
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
