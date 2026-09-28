import { describe, expect, it } from 'vitest';

import { buildNormberakningHtml } from './build-normberakning-html';

const OPTIONS = { costTypeLabels: {}, livingCostTypeLabels: {} };

describe('buildNormberakningHtml', () => {
  it('escapes markup and Pebble braces in every inserted value', () => {
    const html = buildNormberakningHtml(
      {
        persons: [{ role: 'APPLICANT', name: '{{ secret }} <b>Ann</b>' }],
        expenses: [{ specification: "{% include 'x' %}" }],
      },
      { ...OPTIONS, handlaggare: '"Handläggare"' }
    );

    expect(html).not.toMatch(/\{\{|\{%|<b>/);
    expect(html).toContain('&#123;&#123; secret &#125;&#125; &lt;b&gt;Ann&lt;/b&gt;');
    expect(html).toContain('&#123;% include &#39;x&#39; %&#125;');
    expect(html).toContain('&quot;Handläggare&quot;');
  });

  it('formats amounts with a decimal comma', () => {
    expect(buildNormberakningHtml({ incomeSum: 1234.5 }, OPTIONS)).toContain('1234,50');
  });
});
