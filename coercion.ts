import {
  type BaseSchema,
  type Output,
  object,
  transform,
  optional,
  nullable,
  nullish,
  nonOptional,
  nonNullable,
  nonNullish,
  nonOptionalAsync,
  nonNullableAsync,
  nonNullishAsync,
} from 'valibot';

/**
 * Helpers for coercing string value
 * Modify the value only if it's a string, otherwise return the value as-is
 */
export function coerceString(
  value: unknown,
  transform?: (text: string) => unknown,
) {
  if (typeof value !== 'string') {
    return value;
  }

  if (value === '') {
    return undefined;
  }

  if (typeof transform !== 'function') {
    return value;
  }

  return transform(value);
}

/**
 * Helpers for coercing file
 * Modify the value only if it's a file, otherwise return the value as-is
 */
export function coerceFile(file: unknown) {
  if (
    typeof File !== 'undefined' &&
    file instanceof File &&
    file.name === '' &&
    file.size === 0
  ) {
    return undefined;
  }

  return file;
}

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This coerce empty values to undefined and transform strings to the correct type
 */
export function enableTypeCoercion<Type extends BaseSchema & { type: string, wrapped?: BaseSchema & { type: string }, async?: boolean }>(
  type: Type,
  cache = new Map<Type, BaseSchema & { type: string }>(),
): BaseSchema<Output<Type>> {
  const result = cache.get(type);

  // Return the cached schema if it's already processed
  // This is to prevent infinite recursion caused by z.lazy()
  if (result) {
    return result;
  }

  let schema: any = type;

  if (
    type.type === 'string' ||
    type.type === 'literal' ||
    type.type ===  'enum'
  ) {
    schema = transform(schema, (output) => coerceString(output))
  } else if (type.type === 'number') {
    schema = transform(schema, (output) => coerceString(output, Number))
  } else if (type.type === 'boolean') {
    schema = transform(schema, (output) => coerceString(output, (text) => (text === 'on' ? true : text)))
  } else if (type.type === 'date') {
    schema = transform(schema, (output) => coerceString(output, (timestamp) => {
      const date = new Date(timestamp);

      // z.date() does not expose a quick way to set invalid_date error
      // This gets around it by returning the original string if it's invalid
      // See https://github.com/colinhacks/zod/issues/1526
      if (isNaN(date.getTime())) {
        return timestamp;
      }

      return date;
    }))
  } else if (type.type === 'bigint') {
    schema = transform(schema, (output) => coerceString(output, BigInt))
  } else if (type.type === 'array') {
    schema = transform(schema, (output) => {
      // No preprocess needed if the value is already an array
      if (Array.isArray(output)) {
        return output;
      }

      if (
        typeof output === 'undefined' ||
        typeof coerceFile(output) === 'undefined'
      ) {
        return [];
      }

      // Wrap it in an array otherwise
      return [output];
    })
  } else if (type.type === 'optional') {
    schema = optional(enableTypeCoercion(type.wrapped!));
  } else if (type.type === 'nullish') {
    schema = nullish(enableTypeCoercion(type.wrapped!));
  } else if(type.type === 'nullable') {
    schema = nullable(enableTypeCoercion(type.wrapped!));
  } else if (type.type === 'non_optional' && type.async) {
    schema = nonOptional(enableTypeCoercion(type.wrapped!));
  } else if (type.type === 'non_nullish' && type.async) {
    schema = nonNullish(enableTypeCoercion(type.wrapped!));
  } else if(type.type === 'non_nullable' && type.async) {
    schema = nonNullable(enableTypeCoercion(type.wrapped!));
  } else if (type.type === 'non_optional') {
    schema = nonOptionalAsync(enableTypeCoercion(type.wrapped!));
  } else if (type.type === 'non_nullish') {
    schema = nonNullishAsync(enableTypeCoercion(type.wrapped!));
  } else if(type.type === 'non_nullable') {
    schema = nonNullableAsync(enableTypeCoercion(type.wrapped!));
  } else if (type.type === 'object') {
    const shape = Object.fromEntries(
      // @ts-ignore
      Object.entries(type.entries).map(([key, def]) => [
        key,
        // @ts-expect-error see message above
        enableTypeCoercion(def, cache),
      ]),
    );
    schema = object(shape);
  }

  if (type !== schema) {
    cache.set(type, schema);
  }

  return schema;
}
