import { describe, expect, it } from 'vitest';

import { groupDecisionReasons } from './group-decision-reasons';

describe('groupDecisionReasons', () => {
  it('puts each orsak under its heading, keeping Lifecare’s order', () => {
    const reasons = [
      { code: 19, name: 'Arbetar deltid ofrivilligt, otillräcklig inkomst', header: 'Arbetar deltid, ofrivilligt' },
      { code: 20, name: 'Arbetar deltid ofrivilligt, väntar på inkomst', header: 'Arbetar deltid, ofrivilligt' },
      { code: 16, name: 'Föräldrapenning otillräcklig', header: 'Föräldraledig' },
    ];

    expect(groupDecisionReasons(reasons)).toEqual([
      { header: 'Arbetar deltid, ofrivilligt', reasons: [reasons[0], reasons[1]] },
      { header: 'Föräldraledig', reasons: [reasons[2]] },
    ]);
  });

  it('has nothing to group for a beslutstyp without orsaker', () => {
    expect(groupDecisionReasons([])).toEqual([]);
  });
});
