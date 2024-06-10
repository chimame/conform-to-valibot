import type { AllSchema, ObjectSchema, UnknownSchema } from "./types/schema";
import {
  unknown as valibotUnknown,
  pipe,
  transform,
  type SchemaWithPipe,
  type TransformAction,
  type PipeItem,
  type BaseIssue,
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
 * If a pipe is assigned by referencing the original schema, convert it to assign the original pipe to the coerced schema.
 * @param originalSchema The original schema
 * @param coercionSchema The schema to be coerced
 * @returns The coerced schema with the original pipe
 */
function generateReturnSchema<
  T extends AllSchema,
  E extends
    | AllSchema
    | SchemaWithPipe<
        [AllSchema, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
      >,
>(
  originalSchema:
    | T
    | SchemaWithPipe<[T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]>,
  coercionSchema: E,
):
  | E
  | SchemaWithPipe<[E, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]> {
  if ("pipe" in originalSchema) {
    return pipe(
      coercionSchema,
      // @ts-expect-error
      ...originalSchema.pipe.slice(1),
    );
  }

  return coercionSchema;
}

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This coerce empty values to undefined and transform strings to the correct type
 */
export function enableTypeCoercion<T extends AllSchema>(
  type:
    | T
    | SchemaWithPipe<[T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]>,
):
  | SchemaWithPipe<
      [
        UnknownSchema,
        TransformAction<unknown, unknown | unknown[]>,
        (
          | T
          | SchemaWithPipe<
              [T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
            >
        ),
      ]
    >
  | ReturnType<typeof generateReturnSchema>
  | T
  | SchemaWithPipe<[T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]> {
  // `expects` is required to generate error messages for `TupleSchema`, so it is passed to `UnkonwSchema` for coercion.
  const unknown = { ...valibotUnknown(), expects: type.expects };
  const originalSchema = "pipe" in type ? type.pipe[0] : type;

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
      ...originalSchema,
      // @ts-expect-error
      item: enableTypeCoercion(originalSchema.item),
    };
    return generateReturnSchema(type, arraySchema);
  } else if (
    type.type === "optional" ||
    type.type === "nullish" ||
    type.type === "nullable" ||
    type.type === "non_optional" ||
    type.type === "non_nullish" ||
    type.type === "non_nullable"
  ) {
    // @ts-expect-error
    const wrapSchema = enableTypeCoercion(type.wrapped);

    if ("pipe" in wrapSchema) {
      return pipe(unknown, wrapSchema.pipe[1], type);
    }

    const wrappedSchema: typeof type = {
      ...originalSchema,
      // @ts-expect-error
      wrapped: enableTypeCoercion(originalSchema.wrapped),
    };

    return generateReturnSchema(type, wrappedSchema);
  } else if (type.type === "union" || type.type === "intersect") {
    const unionSchema: typeof type = {
      ...originalSchema,
      // @ts-expect-error
      options: originalSchema.options.map((option) =>
        enableTypeCoercion(option as ObjectSchema),
      ),
    };
    return generateReturnSchema(type, unionSchema);
  } else if (type.type === "variant") {
    const variantSchema: typeof type = {
      ...originalSchema,
      // @ts-expect-error
      options: originalSchema.options.map((option) =>
        enableTypeCoercion(option as ObjectSchema),
      ),
    };
    return generateReturnSchema(type, variantSchema);
  } else if (type.type === "tuple") {
    const tupleSchema: typeof type = {
      ...originalSchema,
      // @ts-expect-error
      items: originalSchema.items.map((option) => enableTypeCoercion(option)),
    };
    return generateReturnSchema(type, tupleSchema);
  } else if (type.type === "tuple_with_rest") {
    const tupleWithRestSchema: typeof type = {
      ...originalSchema,
      // @ts-expect-error
      items: originalSchema.items.map((option) => enableTypeCoercion(option)),
      // @ts-expect-error
      rest: enableTypeCoercion(originalSchema.rest),
    };
    return generateReturnSchema(type, tupleWithRestSchema);
  } else if (type.type === "object") {
    const objectSchema: typeof type = {
      ...originalSchema,
      entries: Object.fromEntries(
        // @ts-expect-error
        Object.entries(originalSchema.entries).map(([key, def]) => [
          key,
          enableTypeCoercion(def as AllSchema),
        ]),
      ),
    };

    return generateReturnSchema(type, objectSchema);
  }

  return pipe(
    unknown,
    transform((output) => coerceString(output)),
    type,
  );
}
