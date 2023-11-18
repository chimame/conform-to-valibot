import {
  type BaseSchema,
  type Output,
  coerce,
  nonNullable,
  nonNullableAsync,
  nonNullish,
  nonNullishAsync,
  nonOptional,
  nonOptionalAsync,
  nullable,
  nullish,
  object,
  optional,
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

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This coerce empty values to undefined and transform strings to the correct type
 */
export function enableTypeCoercion<
  Type extends BaseSchema & {
    type: string;
    wrapped?: BaseSchema & { type: string };
    async?: boolean;
  },
>(
  type: Type,
  options?: {
    wrapped?: any; // TODO: fix this type
    cache?: Map<Type, BaseSchema & { type: string }>;
  },
): BaseSchema<Output<Type>> {
  const cache =
    options?.cache ?? new Map<Type, BaseSchema & { type: string }>();
  const result = cache.get(type);

  // Return the cached schema if it's already processed
  // This is to prevent infinite recursion caused by z.lazy()
  if (result) {
    return result;
  }

  let schema: any = type;

  if (
    type.type === "string" ||
    type.type === "literal" ||
    type.type === "enum"
  ) {
    schema = coerce(
      options?.wrapped ? options.wrapped(schema) : schema,
      (output) => coerceString(output),
    );
  } else if (type.type === "number") {
    schema = coerce(
      options?.wrapped ? options.wrapped(schema) : schema,
      (output) => coerceString(output, Number),
    );
  } else if (type.type === "boolean") {
    schema = coerce(
      options?.wrapped ? options.wrapped(schema) : schema,
      (output) => coerceString(output, (text) => (text === "on" ? true : text)),
    );
  } else if (type.type === "date") {
    schema = coerce(
      options?.wrapped ? options.wrapped(schema) : schema,
      (output) => coerceString(output, (timestamp) => {
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
    schema = coerce(
      options?.wrapped ? options.wrapped(schema) : schema,
      (output) => coerceString(output, BigInt),
    );
  } else if (type.type === "array") {
    schema = coerce(
      options?.wrapped ? options.wrapped(schema) : schema,
      (output) => {
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
      },
    );
  } else if (type.type === "optional") {
    schema = enableTypeCoercion(type.wrapped!, { wrapped: optional });
  } else if (type.type === "nullish") {
    schema = enableTypeCoercion(type.wrapped!, { wrapped: nullish });
  } else if (type.type === "nullable") {
    schema = enableTypeCoercion(type.wrapped!, { wrapped: nullable });
  } else if (type.type === "non_optional" && type.async) {
    schema = enableTypeCoercion(type.wrapped!, { wrapped: nonOptionalAsync });
  } else if (type.type === "non_nullish" && type.async) {
    schema = enableTypeCoercion(type.wrapped!, { wrapped: nonNullishAsync });
  } else if (type.type === "non_nullable" && type.async) {
    schema = enableTypeCoercion(type.wrapped!, { wrapped: nonNullableAsync });
  } else if (type.type === "non_optional") {
    schema = enableTypeCoercion(type.wrapped!, { wrapped: nonOptional });
  } else if (type.type === "non_nullish") {
    schema = enableTypeCoercion(type.wrapped!, { wrapped: nonNullish });
  } else if (type.type === "non_nullable") {
    schema = enableTypeCoercion(type.wrapped!, { wrapped: nonNullable });
  } else if (type.type === "object") {
    const shape = Object.fromEntries(
      // @ts-ignore
      Object.entries(type.entries).map(([key, def]) => [
        key,
        // @ts-expect-error see message above
        enableTypeCoercion(def, { cache }),
      ]),
    );
    schema = options?.wrapped ? options.wrapped(object(shape)) : object(shape);
  }

  if (type !== schema) {
    cache.set(type, schema);
  }

  return schema;
}
