import type {
  BaseSchema,
  NullableSchema,
  OptionalSchema,
  NullishSchema,
  NonNullableSchema,
  NonNullableIssue,
  NonOptionalSchema,
  NonOptionalIssue,
  NonNullishSchema,
  NonNullishIssue,
  ObjectSchema as ValibotObjectSchema,
  ObjectEntries,
  UnionSchema,
  UnionIssue,
  IntersectSchema,
  IntersectIssue,
  BaseIssue,
  ArraySchema,
  ArrayIssue,
  BigintSchema,
  BigintIssue,
  BooleanSchema,
  BooleanIssue,
  DateSchema,
  DateIssue,
  EnumSchema,
  EnumIssue,
  Enum,
  LiteralSchema,
  LiteralIssue,
  Literal,
  NumberSchema,
  NumberIssue,
  PicklistSchema,
  PicklistIssue,
  PicklistOptions,
  StringSchema,
  StringIssue,
  UndefinedSchema,
  UndefinedIssue,
  TupleSchema,
  TupleIssue,
  TupleWithRestSchema,
  TupleWithRestIssue,
  VariantSchema,
  VariantIssue,
  VariantOptions,
  ErrorMessage,
  ObjectIssue,
  unknown,
} from "valibot";

export type WrapWithDefaultSchema =
  | OptionalSchema<ValibotSchema, never>
  | NullableSchema<ValibotSchema, never>
  | NullishSchema<ValibotSchema, never>;

export type WrapWithoutDefaultSchema =
  | NonNullableSchema<ValibotSchema, ErrorMessage<NonNullableIssue> | undefined>
  | NonOptionalSchema<ValibotSchema, ErrorMessage<NonOptionalIssue> | undefined>
  | NonNullishSchema<ValibotSchema, ErrorMessage<NonNullishIssue> | undefined>;

export type WrapSchema = WrapWithDefaultSchema | WrapWithoutDefaultSchema;

export type ObjectSchema = ValibotObjectSchema<
  ObjectEntries,
  ErrorMessage<ObjectIssue> | undefined
>;

export type ValibotSchema =
  | ObjectSchema
  | StringSchema<ErrorMessage<StringIssue> | undefined>
  | BigintSchema<ErrorMessage<BigintIssue> | undefined>
  | BooleanSchema<ErrorMessage<BooleanIssue> | undefined>
  | DateSchema<ErrorMessage<DateIssue> | undefined>
  | EnumSchema<Enum, ErrorMessage<EnumIssue> | undefined>
  | LiteralSchema<Literal, ErrorMessage<LiteralIssue> | undefined>
  | NumberSchema<ErrorMessage<NumberIssue> | undefined>
  | PicklistSchema<PicklistOptions, ErrorMessage<PicklistIssue> | undefined>
  | UndefinedSchema<ErrorMessage<UndefinedIssue> | undefined>;

export type OptionsSchema =
  | UnionSchema<
      ValibotSchema[],
      ErrorMessage<UnionIssue<BaseIssue<unknown>>> | undefined
    >
  | VariantSchema<
      string,
      VariantOptions<string>,
      ErrorMessage<VariantIssue> | undefined
    >
  | IntersectSchema<ValibotSchema[], ErrorMessage<IntersectIssue> | undefined>
  | TupleSchema<ValibotSchema[], ErrorMessage<TupleIssue> | undefined>
  | TupleWithRestSchema<
      ValibotSchema[],
      ValibotSchema,
      ErrorMessage<TupleWithRestIssue> | undefined
    >;

export type AllSchema =
  | ValibotSchema
  | WrapSchema
  | OptionsSchema
  | ArraySchema<ValibotSchema, ErrorMessage<ArrayIssue> | undefined>;

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
