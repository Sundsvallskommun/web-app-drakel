import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** The kinds of template the admin page manages: a full mall, an insertable frastext, or a beslutsformulering. */
export const TEMPLATE_KINDS = ['DOCUMENT', 'PHRASE', 'DECISION_PHRASE'] as const;

/**
 * The fields sent when saving a mall or frastext. Leaving the identifier out creates a new template;
 * sending an existing one saves a new version of that template.
 */
export class SaveTemplateDto {
  // Not empty rather than merely optional: an empty identifier would be sent on as one, and the
  // Templating service keys a template on it.
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  identifier?: string;

  /** The handläggare-facing name, shown in the mall/frastext pickers. */
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  /** The CM type code the template belongs to — a journal entry type or a document type. */
  @IsString()
  @MaxLength(255)
  code!: string;

  @IsIn(TEMPLATE_KINDS)
  kind!: (typeof TEMPLATE_KINDS)[number];

  /** A beslutsformulering's kategori (Beslutsformulering – kategori); required for DECISION_PHRASE. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  category?: string;

  /** The template body as HTML from the rich-text editor. */
  @IsString()
  @MaxLength(1048576)
  content!: string;
}
