import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ErrandMetaCard } from './errand-meta-card.component';

describe('ErrandMetaCard', () => {
  it('shows the sökandes and medsökandes personnummer beside their names', () => {
    render(
      <ErrandMetaCard
        errand={{ errandNumber: 'EB-26090039' }}
        applicantNames={['Tolvan Testsson', 'Elva Testsson']}
        applicantPersonalNumbers={['191212121212', '191111111111']}
      />
    );

    expect(screen.getByText('Personnummer')).toBeInTheDocument();
    expect(screen.getByText('191212121212, 191111111111')).toBeInTheDocument();
  });

  it('says there is none when no personnummer could be looked up', () => {
    render(<ErrandMetaCard errand={{}} applicantNames={['Tolvan Testsson']} applicantPersonalNumbers={[]} />);

    expect(screen.getByText('Personnummer').nextSibling).toHaveTextContent('—');
  });
});
