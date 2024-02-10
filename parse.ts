import {
  type Intent,
  type Submission,
  formatPaths,
  parse as baseParse,
} from "@conform-to/dom";
import {
  type BaseSchema,
  type Output,
  type ParseInfo,
  SafeParseResult,
  safeParse,
} from "valibot";
import { enableTypeCoercion } from "./coercion";

export function parseWithValibot<Schema extends BaseSchema & { type: string }>(
  payload: FormData | URLSearchParams,
  config: {
    schema: Schema | ((intent: string) => Schema);
    info?: Pick<ParseInfo, "abortEarly" | "abortPipeEarly" | "skipPipe">;
  },
): Submission<Output<Schema>>;
export function parseWithValibot<Schema extends BaseSchema & { type: string }>(
  payload: FormData | URLSearchParams,
  config: {
    schema: Schema | ((intent: string) => Schema);
    info?: Pick<ParseInfo, "abortEarly" | "abortPipeEarly" | "skipPipe">;
  },
): Promise<Submission<Output<Schema>>>;
export function parseWithValibot<Schema extends BaseSchema & { type: string }>(
  payload: FormData | URLSearchParams,
  config: {
    schema: Schema | ((intent: Intent | null) => Schema);
    info?: Pick<ParseInfo, "abortEarly" | "abortPipeEarly" | "skipPipe">;
  },
): Submission<Output<Schema>> | Promise<Submission<Output<Schema>>> {
  return baseParse<Output<Schema>, string[]>(payload, {
    resolve(payload, intent) {
      const schema = enableTypeCoercion(
        typeof config.schema === "function"
          ? config.schema(intent)
          : config.schema,
      );

      const resolveResult = (
        result: SafeParseResult<Schema>,
      ): { value: Output<Schema> } | { error: Record<string, string[]> } => {
        if (result.success) {
          return {
            value: result.output,
          };
        }

        return {
          error: result.issues.reduce<Record<string, string[]>>((result, e) => {
            const name = e.path
              ? formatPaths(e.path.map((d) => d.key as string | number))
              : (e.input as string | number);

            result[name] = [...(result[name] ?? []), e.message];

            return result;
          }, {}),
        };
      };

      return resolveResult(safeParse(schema, payload, config.info));
    },
  });
}
