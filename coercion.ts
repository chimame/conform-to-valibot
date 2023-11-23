import type {
  BaseSchema,
  Output,
  array,
  bigint,
  boolean,
  date,
  enum_,
  literal,
  number,
  picklist,
  string,
} from "valibot";
import {
  nullable,
  nullish,
  optional,
  nonNullable,
  nonNullish,
  nonOptional,
  object,
  coerce,
} from "valibot";

/**
 * Helpers for coercing string value
 * Modify the value only if it's a string, otherwise return the value as-is
 */
export function coerceString(
  value: unknown,
  transform?: (text: string) => unknown,
) {
  if (typeof value !== "string") {
    return value;
  }

  if (value === "") {
    return undefined;
  }

  if (typeof transform !== "function") {
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
    typeof File !== "undefined" &&
    file instanceof File &&
    file.name === "" &&
    file.size === 0
  ) {
    return undefined;
  }

  return file;
}

type WrapSchema =
  | typeof nullish
  | typeof optional
  | typeof nullable
  | typeof nonNullable
  | typeof nonOptional
  | typeof nonNullish;

type ValibotSchema =
  | ReturnType<typeof object>
  | ReturnType<typeof string>
  | ReturnType<typeof array>
  | ReturnType<typeof bigint>
  | ReturnType<typeof boolean>
  | ReturnType<typeof date>
  | ReturnType<typeof enum_>
  | ReturnType<typeof literal>
  | ReturnType<typeof number>
  | ReturnType<typeof picklist>;

type AllSchema = ValibotSchema | ReturnType<WrapSchema> | BaseSchema;

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This coerce empty values to undefined and transform strings to the correct type
 */
export function enableTypeCoercion<Type extends AllSchema>(
  type: Type,
  options?: {
    wrap?: WrapSchema;
    cache?: Map<Type, AllSchema>;
  },
): Output<Type> {
  const cache = options?.cache ?? new Map<Type, AllSchema>();
  const result = cache.get(type);

  // Return the cached schema if it's already processed
  // This is to prevent infinite recursion caused by z.lazy()
  if (result) {
    return result;
  }

  // A schema that does not have a type property does not exist.
  // However, in the wrapped property such as optional schema,
  // it is necessary to receive the BaseSchema expression,
  // so in order to receive it, it is also possible to receive the type in BaseSchema.
  if (!("type" in type)) {
    return type;
  }

  let schema: AllSchema = type;

  if (
    type.type === "string" ||
    type.type === "literal" ||
    type.type === "enum"
  ) {
    // @ts-expect-error
    schema = coerce(options?.wrap ? options.wrap(schema) : schema, (output) =>
      coerceString(output),
    );
  } else if (type.type === "number") {
    // @ts-expect-error
    schema = coerce(options?.wrap ? options.wrap(schema) : schema, (output) =>
      coerceString(output, Number),
    );
  } else if (type.type === "boolean") {
    // @ts-expect-error
    schema = coerce(options?.wrap ? options.wrap(schema) : schema, (output) =>
      coerceString(output, (text) => (text === "on" ? true : text)),
    );
  } else if (type.type === "date") {
    // @ts-expect-error
    schema = coerce(options?.wrap ? options.wrap(schema) : schema, (output) =>
      coerceString(output, (timestamp) => {
        const date = new Date(timestamp);

        // z.date() does not expose a quick way to set invalid_date error
        // This gets around it by returning the original string if it's invalid
        // See https://github.com/colinhacks/zod/issues/1526
        if (Number.isNaN(date.getTime())) {
          return timestamp;
        }

        return date;
      }),
    );
  } else if (type.type === "bigint") {
    // @ts-expect-error
    schema = coerce(options?.wrap ? options.wrap(schema) : schema, (output) =>
      coerceString(output, BigInt),
    );
  } else if (type.type === "array") {
    // @ts-expect-error
    schema = coerce(options?.wrap ? options.wrap(schema) : schema, (output) => {
      // No preprocess needed if the value is already an array
      if (Array.isArray(output)) {
        return output;
      }

      if (
        typeof output === "undefined" ||
        typeof coerceFile(output) === "undefined"
      ) {
        return [];
      }

      // Wrap it in an array otherwise
      return [output];
    });
  } else if (type.type === "optional") {
    schema = enableTypeCoercion(type.wrapped, { wrap: optional });
    // @ts-expect-error
    schema = options?.wrap ? options.wrap(schema) : schema;
  } else if (type.type === "nullish") {
    schema = enableTypeCoercion(type.wrapped, { wrap: nullish });
    // @ts-expect-error
    schema = options?.wrap ? options.wrap(schema) : schema;
  } else if (type.type === "nullable") {
    schema = enableTypeCoercion(type.wrapped, { wrap: nullable });
    // @ts-expect-error
    schema = options?.wrap ? options.wrap(schema) : schema;
  } else if (type.type === "non_optional") {
    schema = enableTypeCoercion(type.wrapped, { wrap: nonOptional });
    // @ts-expect-error
    schema = options?.wrap ? options.wrap(schema) : schema;
  } else if (type.type === "non_nullish") {
    schema = enableTypeCoercion(type.wrapped, { wrap: nonNullish });
    // @ts-expect-error
    schema = options?.wrap ? options.wrap(schema) : schema;
  } else if (type.type === "non_nullable") {
    schema = enableTypeCoercion(type.wrapped, { wrap: nonNullable });
    // @ts-expect-error
    schema = options?.wrap ? options.wrap(schema) : schema;
  } else if (type.type === "object") {
    const shape = Object.fromEntries(
      // @ts-ignore
      Object.entries(type.entries).map(([key, def]) => [
        key,
        enableTypeCoercion(def, { cache }),
      ]),
    );
    // @ts-expect-error
    schema = options?.wrap ? options.wrap(object(shape)) : object(shape);
  }

  if (type !== schema) {
    cache.set(type, schema);
  }

  return schema;
}
