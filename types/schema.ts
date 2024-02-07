import type {
  NullSchema,
  NullableSchema,
  OptionalSchema,
  NullishSchema,
  NonNullableSchema,
  NonOptionalSchema,
  NonNullishSchema,
  ObjectSchema as ValibotObjectSchema,
  ObjectEntries,
  UnionSchema,
  UnionOptions,
  IntersectSchema,
  IntersectOptions,
  BaseSchema,
  ArraySchema,
  BigintSchema,
  BooleanSchema,
  DateSchema,
  EnumSchema,
  Enum,
  LiteralSchema,
  Literal,
  NumberSchema,
  PicklistSchema,
  PicklistOptions,
  StringSchema,
  UndefinedSchema,
  TupleSchema,
  TupleItems,
  VariantSchema,
  VariantOptions,
} from "valibot";

export type WrapWithDefaultSchema =
  | NullSchema<BaseSchema>
  | OptionalSchema<BaseSchema>
  | NullableSchema<BaseSchema>
  | NullishSchema<BaseSchema>;

export type WrapWithoutDefaultSchema =
  | NonNullableSchema<BaseSchema>
  | NonOptionalSchema<BaseSchema>
  | NonNullableSchema<BaseSchema>
  | NonNullishSchema<BaseSchema>;

export type WrapSchema = WrapWithDefaultSchema | WrapWithoutDefaultSchema;

export type ObjectSchema = ValibotObjectSchema<ObjectEntries>;

export type ValibotSchema =
  | ObjectSchema
  | StringSchema
  | ArraySchema<BaseSchema>
  | BigintSchema
  | BooleanSchema
  | DateSchema
  | EnumSchema<Enum>
  | LiteralSchema<Literal>
  | NumberSchema
  | PicklistSchema<PicklistOptions>
  | UndefinedSchema;

export type OptionsSchema =
  | UnionSchema<UnionOptions>
  | VariantSchema<string, VariantOptions<string>>
  | IntersectSchema<IntersectOptions>
  | TupleSchema<TupleItems>;

export type AllSchema = ValibotSchema | WrapSchema | OptionsSchema | BaseSchema;
