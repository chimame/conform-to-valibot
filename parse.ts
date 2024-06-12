import {
  type Intent,
  type Submission,
  formatPaths,
  parse as baseParse,
} from "@conform-to/dom";
import {
  type BaseIssue,
  type InferOutput,
  type Config,
  type SafeParseResult,
  type GenericSchema,
  type GenericSchemaAsync,
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
      "abortEarly" | "abortPipeEarly" | "skipPipe" | "lang"
    >;
  },
): Submission<InferOutput<Schema>>;
export function parseWithValibot<Schema extends GenericSchemaAsync>(
  payload: FormData | URLSearchParams,
  config: {
    schema: Schema | ((intent: string) => Schema);
    info?: Pick<
      Config<BaseIssue<unknown>>,
      "abortEarly" | "abortPipeEarly" | "skipPipe" | "lang"
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
      "abortEarly" | "abortPipeEarly" | "skipPipe" | "lang"
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
            const name = e.path
              ? // @ts-expect-error
                formatPaths(e.path.map((d) => d.key as string | number))
              : (e.input as string | number);

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
