import type {
  BaseSchema,
  Input,
  array,
  bigint,
  boolean,
  date,
  enum_,
  literal,
  number,
  picklist,
  string,
  undefined_,
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
  union,
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

type WrapWithDefaultSchema = typeof nullish | typeof optional | typeof nullable;
type WrapWithoutDefaultSchema =
  | typeof nonNullable
  | typeof nonOptional
  | typeof nonNullish;
type WrapSchema = WrapWithDefaultSchema | WrapWithoutDefaultSchema;

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
  | ReturnType<typeof picklist>
  | ReturnType<typeof undefined_>;

type AllSchema =
  | ValibotSchema
  | ReturnType<WrapSchema>
  | ReturnType<typeof union>
  | BaseSchema;

type WrapOption<TSchema extends WrapSchema> =
  TSchema extends WrapWithDefaultSchema
    ? {
        wrap: WrapWithDefaultSchema;
        default: Input<BaseSchema>;
        cache?: Map<AllSchema, AllSchema>;
      }
    : {
        wrap?: WrapWithoutDefaultSchema;
        cache?: Map<AllSchema, AllSchema>;
      };
/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This coerce empty values to undefined and transform strings to the correct type
 */
export function enableTypeCoercion<
  Type extends AllSchema,
  TSchema extends WrapSchema,
>(type: Type, options?: WrapOption<TSchema>): AllSchema {
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
    type.type === "enum" ||
    type.type === "undefined"
  ) {
    schema = coerce(
      options?.wrap
        ? "default" in options
          ? options.wrap(schema, options.default)
          : options.wrap(schema)
        : schema,
      (output) => coerceString(output),
    );
  } else if (type.type === "number") {
    schema = coerce(
      options?.wrap
        ? "default" in options
          ? options.wrap(schema, options.default)
          : options.wrap(schema)
        : schema,
      (output) => coerceString(output, Number),
    );
  } else if (type.type === "boolean") {
    schema = coerce(
      options?.wrap
        ? "default" in options
          ? options.wrap(schema, options.default)
          : options.wrap(schema)
        : schema,
      (output) => coerceString(output, (text) => (text === "on" ? true : text)),
    );
  } else if (type.type === "date") {
    schema = coerce(
      options?.wrap
        ? "default" in options
          ? options.wrap(schema, options.default)
          : options.wrap(schema)
        : schema,
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
      options?.wrap
        ? "default" in options
          ? options.wrap(schema, options.default)
          : options.wrap(schema)
        : schema,
      (output) => coerceString(output, BigInt),
    );
  } else if (type.type === "array") {
    schema = coerce(
      options?.wrap
        ? "default" in options
          ? options.wrap(schema, options.default)
          : options.wrap(schema)
        : schema,
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
    schema = enableTypeCoercion(type.wrapped, {
      wrap: optional,
      default: type.getDefault,
    });
    schema = coerce(
      options?.wrap
        ? "default" in options
          ? options.wrap(schema, options.default)
          : options.wrap(schema)
        : schema,
      (output) => coerceString(output),
    );
  } else if (type.type === "nullish") {
    schema = enableTypeCoercion(type.wrapped, {
      wrap: nullish,
      default: type.getDefault,
    });
    schema = coerce(
      options?.wrap
        ? "default" in options
          ? options.wrap(schema, options.default)
          : options.wrap(schema)
        : schema,
      (output) => coerceString(output),
    );
  } else if (type.type === "nullable") {
    schema = enableTypeCoercion(type.wrapped, {
      wrap: nullable,
      default: type.getDefault,
    });
    schema = coerce(
      options?.wrap
        ? "default" in options
          ? options.wrap(schema, options.default)
          : options.wrap(schema)
        : schema,
      (output) => coerceString(output),
    );
  } else if (type.type === "non_optional") {
    schema = enableTypeCoercion(type.wrapped, { wrap: nonOptional });
    schema = coerce(
      options?.wrap
        ? "default" in options
          ? options.wrap(schema, options.default)
          : options.wrap(schema)
        : schema,
      (output) => coerceString(output),
    );
  } else if (type.type === "non_nullish") {
    schema = enableTypeCoercion(type.wrapped, { wrap: nonNullish });
    schema = coerce(
      options?.wrap
        ? "default" in options
          ? options.wrap(schema, options.default)
          : options.wrap(schema)
        : schema,
      (output) => coerceString(output),
    );
  } else if (type.type === "non_nullable") {
    schema = enableTypeCoercion(type.wrapped, { wrap: nonNullable });
    schema = coerce(
      options?.wrap
        ? "default" in options
          ? options.wrap(schema, options.default)
          : options.wrap(schema)
        : schema,
      (output) => coerceString(output),
    );
  } else if (type.type === "union") {
    // @ts-expect-error
    schema = union(type.options.map((option) => enableTypeCoercion(option)));
    schema = coerce(
      options?.wrap
        ? "default" in options
          ? options.wrap(schema, options.default)
          : options.wrap(schema)
        : schema,
      (output) => coerceString(output),
    );
  } else if (type.type === "object") {
    const shape = Object.fromEntries(
      Object.entries(type.entries).map(([key, def]) => [
        key,
        enableTypeCoercion(def, { cache }),
      ]),
    );
    schema = options?.wrap
      ? "default" in options
        ? options.wrap(object(shape), options.default)
        : options.wrap(object(shape))
      : object(shape);
  }

  if (type !== schema) {
    cache.set(type, schema);
  }

  return schema;
}
