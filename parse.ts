import { type Submission, getName, parse as baseParse } from "@conform-to/dom";
import {
  type BaseSchema,
  type Output,
  SafeParseResult,
  safeParse,
} from "valibot";
import { enableTypeCoercion } from "./coercion";

export function parse<Schema extends BaseSchema & { type: string }>(
  payload: FormData | URLSearchParams,
  config: {
    schema: Schema | ((intent: string) => Schema);
  },
): Submission<Output<Schema>>;
export function parse<Schema extends BaseSchema & { type: string }>(
  payload: FormData | URLSearchParams,
  config: {
    schema: Schema | ((intent: string) => Schema);
  },
): Promise<Submission<Output<Schema>>>;
export function parse<Schema extends BaseSchema & { type: string }>(
  payload: FormData | URLSearchParams,
  config: {
    schema: Schema | ((intent: string) => Schema);
  },
): Submission<Output<Schema>> | Promise<Submission<Output<Schema>>> {
  return baseParse<Output<Schema>>(payload, {
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
            const name = e.path ? getName(e.path.map((d) => d.key)) : e.input;

            result[name] = [...(result[name] ?? []), e.message];

            return result;
          }, {}),
        };
      };

      return resolveResult(safeParse(schema, payload));
    },
  });
}
