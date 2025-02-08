import {
  type BaseIssue,
  type GenericSchema,
  type GenericSchemaAsync,
  type PipeItem,
  type SchemaWithPipe,
  type SchemaWithPipeAsync,
  nullish,
  nullishAsync,
  optional,
  optionalAsync,
  pipe,
  pipeAsync,
  transform as vTransform,
  unknown as valibotUnknown,
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
 * Reconstruct the provided schema with additional preprocessing steps
 * This coerce empty values to undefined and transform strings to the correct type
 * @param type The schema to be coerced
 * @param transform The transformation function
 * @returns The transform action and the coerced schema
 */
function coerce<T extends GenericSchema | GenericSchemaAsync>(
  type: T,
  transform?: (text: string) => unknown,
) {
  // `expects` is required to generate error messages for `TupleSchema`, so it is passed to `UnkonwSchema` for coercion.
  const unknown = { ...valibotUnknown(), expects: type.expects };
  const transformAction = vTransform((output: unknown) =>
    type.type === "blob" || type.type === "file"
      ? coerceFile(output)
      : coerceString(output, transform),
  );
  const schema = type.async
    ? pipeAsync(unknown, transformAction, type)
    : pipe(unknown, transformAction, type);

  return { transformAction, schema };
}

/**
 * Helpers for coercing array value
 * Modify the value only if it's an array, otherwise return the value as-is
 */
function coerceArray<T extends GenericSchema | GenericSchemaAsync>(type: T) {
  // `expects` is required to generate error messages for `TupleSchema`, so it is passed to `UnkonwSchema` for coercion.
  const unknown = { ...valibotUnknown(), expects: type.expects };
  const transformFunction = (output: unknown): unknown => {
    if (Array.isArray(output)) {
      return output;
    }

    if (
      typeof output === "undefined" ||
      typeof coerceFile(coerceString(output)) === "undefined"
    ) {
      return [];
    }

    return [output];
  };

  if (type.async) {
    return pipeAsync(unknown, vTransform(transformFunction), type);
  }

  return pipe(unknown, vTransform(transformFunction), type);
}

/**
 * Helpers for coercing file
 * Modify the value only if it's a file, otherwise return the value as-is
 */
function coerceFile(file: unknown) {
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
  T extends GenericSchema | GenericSchemaAsync,
  E extends
    | GenericSchema
    | GenericSchemaAsync
    | SchemaWithPipe<
        [GenericSchema, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
      >
    | SchemaWithPipeAsync<
        [
          GenericSchema | GenericSchemaAsync,
          ...PipeItem<unknown, unknown, BaseIssue<unknown>>[],
        ]
      >,
>(
  originalSchema:
    | T
    | (T extends GenericSchema
        ? SchemaWithPipe<
            [T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
          >
        : SchemaWithPipeAsync<
            [T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
          >),
  coercionSchema: E,
) {
  if ("pipe" in originalSchema) {
    if (originalSchema.async && coercionSchema.async) {
      return pipeAsync(coercionSchema, ...originalSchema.pipe.slice(1));
    }
    // @ts-expect-error
    return pipe(coercionSchema, ...originalSchema.pipe.slice(1));
  }

  return coercionSchema;
}

/**
 * Generate a wrapped schema with coercion
 * @param type The schema to be coerced
 * @param originalSchema The original schema
 * @param schemaType The schema type
 * @returns The coerced schema
 */
function generateWrappedSchema<T extends GenericSchema | GenericSchemaAsync>(
  type: T,
  originalSchema: T,
  schemaType?: "nullish" | "optional",
) {
  // @ts-expect-error
  const { transformAction } = enableTypeCoercion(type.wrapped);

  if (transformAction) {
    // `expects` is required to generate error messages for `TupleSchema`, so it is passed to `UnkonwSchema` for coercion.
    const unknown = { ...valibotUnknown(), expects: type.expects };
    if (type.async) {
      switch (schemaType) {
        case "nullish":
          return {
            transformAction: undefined,
            schema: nullishAsync(pipeAsync(unknown, transformAction, type)),
          };
        case "optional":
          return {
            transformAction: undefined,
            schema: optionalAsync(pipeAsync(unknown, transformAction, type)),
          };
        default:
          return {
            transformAction,
            schema: pipeAsync(unknown, transformAction, type),
          };
      }
    }
    switch (schemaType) {
      case "nullish":
        return {
          transformAction: undefined,
          schema: nullish(pipe(unknown, transformAction, type)),
        };
      case "optional":
        return {
          transformAction: undefined,
          schema: optional(pipe(unknown, transformAction, type)),
        };
      default:
        return {
          transformAction,
          schema: pipe(unknown, transformAction, type),
        };
    }
  }

  const wrappedSchema = {
    ...originalSchema,
    // @ts-expect-error
    wrapped: enableTypeCoercion(originalSchema.wrapped).schema,
  };

  return {
    transformAction: undefined,
    schema: generateReturnSchema(type, wrappedSchema),
  };
}

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This coerce empty values to undefined and transform strings to the correct type
 */
export function enableTypeCoercion<
  T extends GenericSchema | GenericSchemaAsync,
>(
  type:
    | T
    | (T extends GenericSchema
        ? SchemaWithPipe<
            [T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
          >
        : SchemaWithPipeAsync<
            [T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
          >),
): {
  transformAction: ReturnType<typeof coerce>["transformAction"] | undefined;
  schema:
    | ReturnType<typeof coerce>["schema"]
    | ReturnType<typeof generateReturnSchema>
    | (T extends GenericSchema
        ? SchemaWithPipe<
            [T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
          >
        : SchemaWithPipeAsync<
            [T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
          >);
} {
  const originalSchema = "pipe" in type ? type.pipe[0] : type;

  switch (type.type) {
    case "string":
    case "literal":
    case "enum":
    case "undefined": {
      return coerce(type);
    }
    case "number": {
      return coerce(type, Number);
    }
    case "boolean": {
      return coerce(type, (text) => (text === "on" ? true : text));
    }
    case "date": {
      return coerce(type, (timestamp) => {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
          return timestamp;
        }

        return date;
      });
    }
    case "bigint": {
      return coerce(type, BigInt);
    }
    case "file":
    case "blob": {
      return coerce(type);
    }
    case "array": {
      const arraySchema = {
        ...originalSchema,
        // @ts-expect-error
        item: enableTypeCoercion(originalSchema.item).schema,
      };
      return {
        transformAction: undefined,
        schema: generateReturnSchema(type, coerceArray(arraySchema)),
      };
    }
    case "exact_optional": {
      // @ts-expect-error
      const { schema: wrapSchema } = enableTypeCoercion(type.wrapped);

      const exactOptionalSchema = {
        ...type,
        wrapped: wrapSchema,
      };

      return {
        transformAction: undefined,
        schema: generateReturnSchema(type, exactOptionalSchema),
      };
    }
    case "nullish": {
      return generateWrappedSchema(type, originalSchema, type.type);
    }
    case "optional": {
      return generateWrappedSchema(type, originalSchema, type.type);
    }
    case "undefinedable":
    case "nullable":
    case "non_optional":
    case "non_nullish":
    case "non_nullable": {
      return generateWrappedSchema(type, originalSchema);
    }
    case "union":
    case "intersect": {
      const unionSchema = {
        ...originalSchema,
        // @ts-expect-error
        options: originalSchema.options.map(
          // @ts-expect-error
          (option) => enableTypeCoercion(option as GenericSchema).schema,
        ),
      };
      return {
        transformAction: undefined,
        schema: generateReturnSchema(type, unionSchema),
      };
    }
    case "variant": {
      const variantSchema = {
        ...originalSchema,
        // @ts-expect-error
        options: originalSchema.options.map(
          // @ts-expect-error
          (option) => enableTypeCoercion(option as GenericSchema).schema,
        ),
      };
      return {
        transformAction: undefined,
        schema: generateReturnSchema(type, variantSchema),
      };
    }
    case "tuple": {
      const tupleSchema = {
        ...originalSchema,
        // @ts-expect-error
        items: originalSchema.items.map(
          // @ts-expect-error
          (option) => enableTypeCoercion(option).schema,
        ),
      };
      return {
        transformAction: undefined,
        schema: generateReturnSchema(type, tupleSchema),
      };
    }
    case "tuple_with_rest": {
      const tupleWithRestSchema = {
        ...originalSchema,
        // @ts-expect-error
        items: originalSchema.items.map(
          // @ts-expect-error
          (option) => enableTypeCoercion(option).schema,
        ),
        // @ts-expect-error
        rest: enableTypeCoercion(originalSchema.rest).schema,
      };
      return {
        transformAction: undefined,
        schema: generateReturnSchema(type, tupleWithRestSchema),
      };
    }
    case "loose_object":
    case "strict_object":
    case "object": {
      const objectSchema = {
        ...originalSchema,
        entries: Object.fromEntries(
          // @ts-expect-error
          Object.entries(originalSchema.entries).map(([key, def]) => [
            key,
            enableTypeCoercion(def as GenericSchema).schema,
          ]),
        ),
      };

      return {
        transformAction: undefined,
        schema: generateReturnSchema(type, objectSchema),
      };
    }
    case "object_with_rest": {
      const objectWithRestSchema = {
        ...originalSchema,
        entries: Object.fromEntries(
          // @ts-expect-error
          Object.entries(originalSchema.entries).map(([key, def]) => [
            key,
            enableTypeCoercion(def as GenericSchema).schema,
          ]),
        ),
        // @ts-expect-error
        rest: enableTypeCoercion(originalSchema.rest).schema,
      };

      return {
        transformAction: undefined,
        schema: generateReturnSchema(type, objectWithRestSchema),
      };
    }
  }

  return coerce(type);
}
