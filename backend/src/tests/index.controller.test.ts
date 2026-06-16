import { IndexController } from '@controllers/index.controller';
import { describe, expect, it } from 'vitest';

// Importing a routing-controllers @Controller exercises the decorator transform pipeline
// (SWC + emitDecoratorMetadata) configured in vitest.config.ts.
describe('IndexController', () => {
  it('returns OK from the index route handler', () => {
    const controller = new IndexController();
    expect(controller.index()).toBe('OK');
  });
});
