import { useErrandFormSnapshot } from '@hooks/use-errand-form-snapshot';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrandApplicationSummary } from './errand-application-summary.component';

vi.mock('@hooks/use-errand-form-snapshot', () => ({ useErrandFormSnapshot: vi.fn() }));
// The two ways of showing the ansökan are not under test here, only which one is chosen.
vi.mock('./errand-application-data.component', () => ({
  ErrandApplicationData: () => <p>Live-uppgifter</p>,
}));
vi.mock('./form-snapshot-view.component', () => ({
  FormSnapshotView: () => <p>Sammanställning som den var</p>,
}));

describe('ErrandApplicationSummary', () => {
  beforeEach(() => {
    vi.mocked(useErrandFormSnapshot).mockReset();
  });

  it('shows the captured snapshot when there is one', () => {
    vi.mocked(useErrandFormSnapshot).mockReturnValue({
      snapshot: { schemaVersion: '1', title: 'Ansökan', sections: [] },
      isLoading: false,
      refresh: vi.fn(),
    });

    render(<ErrandApplicationSummary errandId="errand-1" errand={{ id: 'errand-1' }} />);

    expect(screen.getByText('Sammanställning som den var')).toBeInTheDocument();
  });

  it('falls back to the live data only when no snapshot was captured', () => {
    vi.mocked(useErrandFormSnapshot).mockReturnValue({ snapshot: null, isLoading: false, refresh: vi.fn() });

    render(<ErrandApplicationSummary errandId="errand-1" errand={{ id: 'errand-1' }} />);

    expect(screen.getByText('Live-uppgifter')).toBeInTheDocument();
  });

  it('shows an error, not the live data, when the snapshot could not be read', () => {
    vi.mocked(useErrandFormSnapshot).mockReturnValue({
      snapshot: null,
      isLoading: false,
      error: 502,
      refresh: vi.fn(),
    });

    render(<ErrandApplicationSummary errandId="errand-1" errand={{ id: 'errand-1' }} />);

    expect(screen.getByText(/Sammanställningen av ansökan kunde inte hämtas/)).toBeInTheDocument();
    expect(screen.queryByText('Live-uppgifter')).not.toBeInTheDocument();
  });
});
