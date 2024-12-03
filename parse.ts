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
import { enableTypeCoercion } from "./coercion";

export function parseWithValibot<Schema extends GenericSchema>(
  payload: FormData | URLSearchParams,
  config: {
    schema: Schema | ((intent: string) => Schema);
    info?: Pick<
      Config<BaseIssue<unknown>>,
      "abortEarly" | "abortPipeEarly" | "lang"
    >;
  },
): Submission<InferOutput<Schema>>;
export function parseWithValibot<Schema extends GenericSchemaAsync>(
  payload: FormData | URLSearchParams,
  config: {
    schema: Schema | ((intent: string) => Schema);
    info?: Pick<
      Config<BaseIssue<unknown>>,
      "abortEarly" | "abortPipeEarly" | "lang"
    >;
  },
): Promise<Submission<InferOutput<Schema>>>;
export function parseWithValibot<
  Schema extends GenericSchema | GenericSchemaAsync,
>(
  payload: FormData | URLSearchParams,
  config: {
    schema: Schema | ((intent: Intent | null) => Schema);
    info?: Pick<
      Config<BaseIssue<unknown>>,
      "abortEarly" | "abortPipeEarly" | "lang"
    >;
  },
): Submission<InferOutput<Schema>> | Promise<Submission<InferOutput<Schema>>> {
  return baseParse<InferOutput<Schema>, string[]>(payload, {
    resolve(payload, intent) {
      const originalSchema =
        typeof config.schema === "function"
          ? config.schema(intent)
          : config.schema;
      const schema = enableTypeCoercion(originalSchema);

      const resolveResult = (
        result: SafeParseResult<Schema>,
      ):
        | { value: InferOutput<Schema> }
        | { error: Record<string, string[]> } => {
        if (result.success) {
          return {
            value: result.output,
          };
        }

        return {
          error: result.issues.reduce<Record<string, string[]>>((result, e) => {
            const name = formatPaths(
              // @ts-expect-error
              e.path?.map((d) => d.key as string | number) ?? [],
            );

            result[name] = [...(result[name] ?? []), e.message];

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
