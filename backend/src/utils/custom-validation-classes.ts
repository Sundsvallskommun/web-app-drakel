import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

const isNull = (value: unknown) => {
  return value !== null;
};

@ValidatorConstraint()
class IsNull implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return isNull(value);
  }
}

/** @public Custom class-validator decorator for nullable DTO fields (used as `@IsNullable()`). */
export function IsNullable(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNullable',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsNull,
    });
  };
}

export const additionalConverters = {
  IsNull: () => ({ nullable: true }),
};
