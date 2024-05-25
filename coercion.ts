import type { AllSchema, ObjectSchema, UnknownSchema } from "./types/schema";
import {
  unknown as valibotUnknown,
  pipe,
  transform,
  type SchemaWithPipe,
  type TransformAction,
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

  try {
    return transform(value);
  } catch {
    return undefined;
  }
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
export function enableTypeCoercion<T extends AllSchema>(
  type: T,
):
  | SchemaWithPipe<
      [UnknownSchema, TransformAction<unknown, unknown | unknown[]>, T]
    >
  | AllSchema {
  // `expects` is required to generate error messages for `TupleSchema`, so it is passed to `UnkonwSchema` for coercion.
  const unknown = { ...valibotUnknown(), expects: type.expects };

  if (
    type.type === "string" ||
    type.type === "literal" ||
    type.type === "enum" ||
    type.type === "undefined"
  ) {
    return pipe(
      unknown,
      transform((output) => coerceString(output)),
      type,
    );
  } else if (type.type === "number") {
    return pipe(
      unknown,
      transform((output) => coerceString(output, Number)),
      type,
    );
  } else if (type.type === "boolean") {
    return pipe(
      unknown,
      transform((output) =>
        coerceString(output, (text) => (text === "on" ? true : text)),
      ),
      type,
    );
  } else if (type.type === "date") {
    return pipe(
      unknown,
      transform((output) =>
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
      ),
      type,
    );
  } else if (type.type === "bigint") {
    return pipe(
      unknown,
      transform((output) => coerceString(output, BigInt)),
      type,
    );
  } else if (type.type === "array") {
    const arraySchema: typeof type = {
      ...type,
      item: enableTypeCoercion(type.item),
    };
    return arraySchema;
  } else if (
    type.type === "optional" ||
    type.type === "nullish" ||
    type.type === "nullable" ||
    type.type === "non_optional" ||
    type.type === "non_nullish" ||
    type.type === "non_nullable"
  ) {
    const wrapSchema = enableTypeCoercion(type.wrapped);

    if ("pipe" in wrapSchema) {
      return pipe(unknown, wrapSchema.pipe[1], type);
    }

    const wrappedSchema: typeof type = {
      ...type,
      wrapped: enableTypeCoercion(type.wrapped),
    };

    return wrappedSchema;
  } else if (type.type === "union" || type.type === "intersect") {
    const unionSchema: typeof type = {
      ...type,
      options: type.options.map((option) => enableTypeCoercion(option)),
    };
    return unionSchema;
  } else if (type.type === "variant") {
    const variantSchema: typeof type = {
      ...type,
      options: type.options.map((option) =>
        enableTypeCoercion(option as ObjectSchema),
      ),
    };
    return variantSchema;
  } else if (type.type === "tuple") {
    const tupleSchema: typeof type = {
      ...type,
      items: type.items.map((option) => enableTypeCoercion(option)),
    };
    return tupleSchema;
  } else if (type.type === "tuple_with_rest") {
    const tupleWithRestSchema: typeof type = {
      ...type,
      items: type.items.map((option) => enableTypeCoercion(option)),
      rest: enableTypeCoercion(type.rest),
    };
    return tupleWithRestSchema;
  } else if (type.type === "object") {
    const objectSchema: typeof type = {
      ...type,
      entries: Object.fromEntries(
        Object.entries(type.entries).map(([key, def]) => [
          key,
          enableTypeCoercion(def as AllSchema),
        ]),
      ),
    };
    return objectSchema;
  }

  return pipe(
    unknown,
    transform((output) => coerceString(output)),
    type,
  );
}
