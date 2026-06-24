import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { JSONSchema } from 'class-validator-jsonschema';

/**
 * The immutable, re-renderable snapshot of a financial-assistance application form, captured by Mina
 * sidor exactly as the applicant saw and answered it. The handläggar-UI reads it back to re-render the
 * sammanställning "as it was". These response classes mirror the caremanagement FormSnapshot* contract so
 * the generated frontend contract carries the full structure (sections → fields → options/answers/items).
 */

/** The answer given to a field, as it was presented to the applicant. */
export class FormSnapshotAnswer {
  /** The option code, when the answer is an enum/option value; null otherwise. */
  @IsString() @IsOptional() code?: string;
  /** The raw value, when the answer is free text / number / boolean; null otherwise. */
  @IsString() @IsOptional() value?: string;
  /** The human-readable answer text the applicant saw. */
  @IsString() @IsOptional() display?: string;
}

/** An option as presented to the applicant (for RADIO/CHECKBOX/SELECT fields). */
export class FormSnapshotOption {
  /** The option code (machine value). */
  @IsString() @IsOptional() code?: string;
  /** The option label the applicant saw. */
  @IsString() @IsOptional() label?: string;
  /** Whether the applicant selected this option. */
  @IsBoolean() @IsOptional() selected?: boolean;
}

/** An info / warning / error notice shown to the applicant. */
export class FormSnapshotNotice {
  /** The notice level (INFO | WARNING | ERROR). */
  @IsString() @IsOptional() level?: string;
  /** The notice text the applicant saw. */
  @IsString() @IsOptional() text?: string;
}

/** A single form field as it was rendered and answered. */
export class FormSnapshotField {
  /** The field name (matches the typed application data field). */
  @IsString() @IsOptional() name?: string;
  /** The field label the applicant saw. */
  @IsString() @IsOptional() label?: string;
  /** The input kind as rendered (RADIO/CHECKBOX/SELECT/TEXT/TEXTAREA/NUMBER/DATE/BOOLEAN_TOGGLE/REPEATING_GROUP/STATIC). */
  @IsString() @IsOptional() inputType?: string;
  /** The help text shown for the field, if any. */
  @IsString() @IsOptional() helpText?: string;
  /** Info texts shown for the field, in order. */
  @IsArray() @IsString({ each: true }) @IsOptional() infoTexts?: string[];
  /** Info / warning / error notices rendered for the field, in order. */
  @IsArray() @ValidateNested({ each: true }) @Type(() => FormSnapshotNotice) @IsOptional() notices?: FormSnapshotNotice[];
  /** All options as presented (for RADIO/CHECKBOX/SELECT), in order. */
  @IsArray() @ValidateNested({ each: true }) @Type(() => FormSnapshotOption) @IsOptional() options?: FormSnapshotOption[];
  /** The answer given, when the field has a single answer. */
  @ValidateNested() @Type(() => FormSnapshotAnswer) @IsOptional() answer?: FormSnapshotAnswer;
  /**
   * For REPEATING_GROUP fields, one entry per repeated instance; each is the list of nested fields. The
   * explicit JSON schema preserves the two-level array (FormSnapshotField[][]) that class-validator's
   * single-level @ValidateNested cannot express — so the generated frontend type keeps both nestings.
   */
  @IsArray()
  @IsOptional()
  @JSONSchema({
    type: 'array',
    items: { type: 'array', items: { $ref: '#/components/schemas/FormSnapshotField' } },
  })
  items?: FormSnapshotField[][];
  /** Whether the field was required as rendered. */
  @IsBoolean() @IsOptional() required?: boolean;
  /** Whether the field was visible to the applicant. */
  @IsBoolean() @IsOptional() visible?: boolean;
  /** The visibility rule that was active, human-readable. */
  @IsString() @IsOptional() condition?: string;
}

/** A section of the form as it was rendered. */
export class FormSnapshotSection {
  /** A stable section id. */
  @IsString() @IsOptional() id?: string;
  /** The section title the applicant saw. */
  @IsString() @IsOptional() title?: string;
  /** The section-level description / info text, if any. */
  @IsString() @IsOptional() description?: string;
  /** Whether the section was visible to the applicant. */
  @IsBoolean() @IsOptional() visible?: boolean;
  /** The fields in the section, in render order. */
  @IsArray() @ValidateNested({ each: true }) @Type(() => FormSnapshotField) @IsOptional() fields?: FormSnapshotField[];
}

/** The attestation (försäkran) the applicant accepted at submission. */
export class FormSnapshotAttestation {
  /** The attestation text the applicant accepted. */
  @IsString() @IsOptional() label?: string;
  /** The answer given to the attestation. */
  @ValidateNested() @Type(() => FormSnapshotAnswer) @IsOptional() answer?: FormSnapshotAnswer;
}

/** Self-describing snapshot of the form as it was rendered and answered. */
export class FormSnapshot {
  /** The snapshot envelope contract version (server-owned). */
  @IsString() schemaVersion!: string;
  /** The frontend form / i18n bundle version that produced this snapshot. */
  @IsString() @IsOptional() formDefinitionVersion?: string;
  /** The errand type slug the form belongs to. */
  @IsString() @IsOptional() typeSlug?: string;
  /** The locale the form was rendered in. */
  @IsString() @IsOptional() locale?: string;
  /** When the form was rendered/submitted, per the client clock (date-time). */
  @IsString() @IsOptional() capturedAt?: string;
  /** The form title the applicant saw. */
  @IsString() @IsOptional() title?: string;
  /** The sections of the form, in render order. */
  @IsArray() @ValidateNested({ each: true }) @Type(() => FormSnapshotSection) sections!: FormSnapshotSection[];
  /** The attestation the applicant accepted, if any. */
  @ValidateNested() @Type(() => FormSnapshotAttestation) @IsOptional() attestation?: FormSnapshotAttestation;
}

/** Envelope: the captured snapshot, or null when none was captured for the errand. */
export class FormSnapshotApiResponse implements ApiResponse<FormSnapshot | null> {
  @ValidateNested()
  @Type(() => FormSnapshot)
  data!: FormSnapshot | null;
  @IsString()
  message!: string;
}
