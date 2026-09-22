import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LockFieldset } from './lockable-section.component';

const section = (locked: boolean) => (
  <LockFieldset locked={locked}>
    <input aria-label="Belopp" />
    <button type="button" data-lock-hides aria-label="Ta bort rad" />
  </LockFieldset>
);

describe('LockFieldset', () => {
  it('leaves an unlocked section editable and whole', () => {
    render(section(false));

    expect(screen.getByLabelText('Belopp')).toBeEnabled();
    expect(screen.getByLabelText('Ta bort rad')).toBeVisible();
  });

  it('disables the fields of a locked section', () => {
    render(section(true));

    expect(screen.getByLabelText('Belopp')).toBeDisabled();
  });

  it('mutes a locked section so it does not read as waiting to be filled in', () => {
    const { container } = render(section(true));

    expect(container.querySelector('fieldset')).toHaveClass('opacity-70');
  });

  it('hides the delete controls of a locked section rather than greying them', () => {
    // A greyed-out papperskorg still says "this row can be removed", which is the opposite of what a
    // section marked complete means. The hiding is a Tailwind rule, and jsdom applies no stylesheet, so
    // what is checked here is that the fieldset carries it — the rendering itself needs an eye.
    const { container } = render(section(true));

    expect(container.querySelector('fieldset')).toHaveClass('[&_[data-lock-hides]]:hidden');
  });

  it('leaves the delete control unclickable even where the styling does not reach', () => {
    // The disabled fieldset is what actually prevents the removal; the hiding above is presentation.
    render(section(true));

    expect(screen.getByLabelText('Ta bort rad')).toBeDisabled();
  });
});
