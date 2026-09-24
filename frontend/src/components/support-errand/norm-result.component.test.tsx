import { render, screen } from '@testing-library/react';
import { computeNormResult } from '@utils/norm-result';
import { describe, expect, it } from 'vitest';

import { NormResultLine, NormResultSummary } from './norm-result.component';

describe('NormResult', () => {
  it('shows a normöverskott in green, as Lifecare does', () => {
    const result = computeNormResult({ incomeSum: 9500, normSum: 3393, expenseSum: 5153 });
    if (!result) throw new Error('expected a result');

    render(<NormResultLine result={result} />);

    expect(screen.getByText('Normöverskott')).toBeInTheDocument();
    expect(screen.getByText('954,00 kr')).toHaveClass('text-success-surface-primary');
  });

  it('shows a normunderskott in red, with the summering down to the result', () => {
    const result = computeNormResult({ incomeSum: 0, normSum: 5220, expenseSum: 454, specialExpenseSum: 0 });
    if (!result) throw new Error('expected a result');

    render(<NormResultSummary result={result} />);

    expect(screen.getByText('-5674,00 kr')).toHaveClass('text-error-surface-primary');
    expect(screen.getByText('Levnadskostnader i övrigt')).toBeInTheDocument();
    expect(screen.getByText('Normunderskott')).toBeInTheDocument();
  });
});
