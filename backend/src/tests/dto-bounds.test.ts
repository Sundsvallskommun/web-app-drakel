import { NoteController } from '@controllers/note.controller';
import { openApiSchemas } from '@utils/openapi-schemas';
import { validateInput } from '@utils/validate-input';
import { describe, expect, it } from 'vitest';

import { PaymentInputDto } from '@/dtos/payment.dto';
import { RenderPdfDto } from '@/dtos/pdf.dto';

describe('PaymentInputDto', () => {
  const payment = { paymentDate: '2026-09-28', amount: 8450.5, applicationMonth: '2026-09', payeeName: 'Test Testsson', messageLines: ['Hyra'] };

  it('takes what the utbetalning form sends', async () => {
    await expect(validateInput(PaymentInputDto, payment)).resolves.toMatchObject(payment);
    await expect(validateInput(PaymentInputDto, {})).resolves.toBeDefined();
  });

  it('refuses what cannot be a payment', async () => {
    await expect(validateInput(PaymentInputDto, { ...payment, amount: 0 })).rejects.toMatchObject({ status: 400 });
    await expect(validateInput(PaymentInputDto, { ...payment, amount: -100 })).rejects.toMatchObject({ status: 400 });
    await expect(validateInput(PaymentInputDto, { ...payment, amount: 5_000_000 })).rejects.toMatchObject({ status: 400 });
    await expect(validateInput(PaymentInputDto, { ...payment, amount: 10.123 })).rejects.toMatchObject({ status: 400 });
    await expect(validateInput(PaymentInputDto, { ...payment, applicationMonth: '2026-13' })).rejects.toMatchObject({ status: 400 });
    await expect(validateInput(PaymentInputDto, { ...payment, paymentDate: 'imorgon' })).rejects.toMatchObject({ status: 400 });
    await expect(validateInput(PaymentInputDto, { ...payment, payeeName: 'x'.repeat(256) })).rejects.toMatchObject({ status: 400 });
  });
});

describe('RenderPdfDto', () => {
  it('refuses HTML beyond what a preview takes', async () => {
    await expect(validateInput(RenderPdfDto, { html: '<p>Beslut</p>' })).resolves.toBeDefined();
    await expect(validateInput(RenderPdfDto, { html: 'x'.repeat(2 * 1024 * 1024 + 1) })).rejects.toMatchObject({ status: 400 });
  });
});

describe('openApiSchemas', () => {
  it('gives a request body that only extends another DTO a schema of its own name', () => {
    // Importing the controller registers its routes, whose @Body types the schemas are read from.
    expect(NoteController).toBeDefined();

    const schemas = openApiSchemas();

    expect(schemas.UpdateNoteDto).toMatchObject({ properties: { body: { type: 'string', maxLength: 8192 } }, required: ['body'] });
  });
});
