import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { targetConstructorToSchema, validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { getMetadataArgsStorage } from 'routing-controllers';

const SCHEMA_OPTIONS = {
  classTransformerMetadataStorage: defaultMetadataStorage,
  refPointerPrefix: '#/components/schemas/',
};

/** A class reference, as reflect-metadata records a parameter's type. */
type ClassReference = abstract new (...args: never[]) => unknown;

const isClass = (type: unknown): type is ClassReference => typeof type === 'function' && type !== Object;

/** The classes routes take their `@Body()` as, read from the parameter types TypeScript records for each route method. */
const requestBodyClasses = (): ClassReference[] =>
  getMetadataArgsStorage()
    .params.filter(param => param.type === 'body')
    .map(param => (Reflect.getMetadata('design:paramtypes', param.object as object, param.method) as unknown[] | undefined)?.[param.index])
    .filter(isClass);

/**
 * The JSON schemas of drakel's DTOs and responses for the OpenAPI spec, keyed by class name.
 *
 * class-validator-jsonschema emits a schema only for a class that declares validation of its own, so a request body
 * that merely extends another DTO (`class UpdateNoteDto extends CreateNoteDto {}`) would be referenced by the spec
 * without a schema behind it. Those get the schema of the class they extend, under their own name — which keeps the
 * name the frontend's generated contract uses.
 */
export const openApiSchemas = (): ReturnType<typeof validationMetadatasToSchemas> => {
  const schemas = validationMetadatasToSchemas(SCHEMA_OPTIONS);
  for (const bodyClass of requestBodyClasses()) {
    schemas[bodyClass.name] ??= targetConstructorToSchema(bodyClass, SCHEMA_OPTIONS);
  }
  return schemas;
};
