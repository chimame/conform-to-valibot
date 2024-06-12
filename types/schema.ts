import type {
  BaseSchema,
  ObjectSchema as ValibotObjectSchema,
  ObjectEntries,
  ErrorMessage,
  ObjectIssue,
  unknown,
} from "valibot";

export type ObjectSchema = ValibotObjectSchema<
  ObjectEntries,
  ErrorMessage<ObjectIssue> | undefined
>;

/**
 * Unknown schema type.
 */
export interface UnknownSchema extends BaseSchema<unknown, unknown, never> {
  /**
   * The schema type.
   */
  readonly type: "unknown";
  /**
   * The schema reference.
   */
  readonly reference: typeof unknown;
  /**
   * The expected property.
   */
  readonly expects: string;
}
