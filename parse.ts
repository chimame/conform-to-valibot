import {
  type Intent,
  type Submission,
  parse as baseParse,
  formatPaths,
} from "@conform-to/dom";
import {
  type BaseIssue,
  type Config,
  type GenericSchema,
  type GenericSchemaAsync,
  type InferOutput,
  type SafeParseResult,
  safeParse,
  safeParseAsync,
} from "valibot";
import { coerceFormValue } from "./coercion";

/**
 * @deprecated The official valibot support
 * [library](https://www.npmjs.com/package/@conform-to/valibot)
 * based on this library has been released.
 *
 * This project will be archived in the near future.
 *
 * To migrate, just install the official library
 * ( `npm install @conform-to/valibot` )
 * and change the reference.
 *
 * @see https://www.npmjs.com/package/@conform-to/valibot
 */
export const conformValibotMessage = {
  VALIDATION_SKIPPED: "__skipped__",
  VALIDATION_UNDEFINED: "__undefined__",
};

type ErrorType = Record<string, string[] | null> | null;

/**
 * @deprecated The official valibot support
 * [library](https://www.npmjs.com/package/@conform-to/valibot)
 * based on this library has been released.
 *
 * This project will be archived in the near future.
 *
 * To migrate, just install the official library
 * ( `npm install @conform-to/valibot` )
 * and change the reference.
 *
 * @see https://www.npmjs.com/package/@conform-to/valibot
 */
export function parseWithValibot<Schema extends GenericSchema>(
  payload: FormData | URLSearchParams,
  config: {
    schema: Schema | ((intent: Intent | null) => Schema);
    disableAutoCoercion?: boolean;
    info?: Pick<
      Config<BaseIssue<unknown>>,
      "abortEarly" | "abortPipeEarly" | "lang"
    >;
  },
): Submission<InferOutput<Schema>>;
/**
 * @deprecated The official valibot support
 * [library](https://www.npmjs.com/package/@conform-to/valibot)
 * based on this library has been released.
 *
 * This project will be archived in the near future.
 *
 * To migrate, just install the official library
 * ( `npm install @conform-to/valibot` )
 * and change the reference.
 *
 * @see https://www.npmjs.com/package/@conform-to/valibot
 */
export function parseWithValibot<Schema extends GenericSchemaAsync>(
  payload: FormData | URLSearchParams,
  config: {
    schema: Schema | ((intent: Intent | null) => Schema);
    disableAutoCoercion?: boolean;
    info?: Pick<
      Config<BaseIssue<unknown>>,
      "abortEarly" | "abortPipeEarly" | "lang"
    >;
  },
): Promise<Submission<InferOutput<Schema>>>;
/**
 * @deprecated The official valibot support
 * [library](https://www.npmjs.com/package/@conform-to/valibot)
 * based on this library has been released.
 *
 * This project will be archived in the near future.
 *
 * To migrate, just install the official library
 * ( `npm install @conform-to/valibot` )
 * and change the reference.
 *
 * @see https://www.npmjs.com/package/@conform-to/valibot
 */
export function parseWithValibot<
  Schema extends GenericSchema | GenericSchemaAsync,
>(
  payload: FormData | URLSearchParams,
  config: {
    schema: Schema | ((intent: Intent | null) => Schema);
    disableAutoCoercion?: boolean;
    info?: Pick<
      Config<BaseIssue<unknown>>,
      "abortEarly" | "abortPipeEarly" | "lang"
    >;
  },
): Submission<InferOutput<Schema>> | Promise<Submission<InferOutput<Schema>>> {
  return baseParse<InferOutput<Schema>, string[]>(payload, {
    resolve(payload, intent) {
      const baseSchema =
        typeof config.schema === "function"
          ? config.schema(intent)
          : config.schema;
      const schema = config.disableAutoCoercion
        ? baseSchema
        : coerceFormValue(baseSchema);

      const resolveResult = (
        result: SafeParseResult<Schema>,
      ): { value: InferOutput<Schema> } | { error: ErrorType } => {
        if (result.success) {
          return {
            value: result.output,
          };
        }

        return {
          error: result.issues.reduce<ErrorType>((result, e) => {
            if (
              result === null ||
              e.message === conformValibotMessage.VALIDATION_UNDEFINED
            ) {
              return null;
            }

            const name = formatPaths(
              e.path?.map((d) => d.key as string | number) ?? [],
            );

            result[name] =
              result[name] === null ||
              e.message === conformValibotMessage.VALIDATION_SKIPPED
                ? null
                : [...(result[name] ?? []), e.message];

            return result;
          }, {}),
        };
      };

      if (schema.async === true) {
        return safeParseAsync(schema, payload, config.info).then(resolveResult);
      }

      return resolveResult(safeParse(schema, payload, config.info));
    },
  });
}
