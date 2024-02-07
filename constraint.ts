import type { Constraint } from "@conform-to/dom";
import type { WrapSchema, AllSchema, ObjectSchema } from "./types/schema";

const keys: Array<keyof Constraint> = [
  "required",
  "minLength",
  "maxLength",
  "min",
  "max",
  "step",
  "multiple",
  "pattern",
];

export function getValibotConstraint(
  schema: AllSchema,
): Record<string, Constraint> {
  function updateConstraint(
    schema: AllSchema,
    data: Record<string, Constraint>,
    name = "",
  ): void {
    if (name !== "" && !data[name]) {
      data[name] = { required: true };
    }
    const constraint = name !== "" ? data[name] : {};

    if (!("type" in schema)) {
      return;
    }

    if (schema.type === "object") {
      for (const key in schema.entries) {
        updateConstraint(
          schema.entries[key],
          data,
          name ? `${name}.${key}` : key,
        );
      }
    } else if (schema.type === "intersect") {
      for (const option of schema.options) {
        const result: Record<string, Constraint> = {};
        updateConstraint(option, result, name);

        Object.assign(data, result);
      }
    } else if (schema.type === "union" || schema.type === "variant") {
      Object.assign(
        data,
        schema.options
          .map((option) => {
            const result: Record<string, Constraint> = {};

            updateConstraint(option, result, name);

            return result;
          })
          .reduce((prev, next) => {
            const list = new Set([...Object.keys(prev), ...Object.keys(next)]);
            const result: Record<string, Constraint> = {};

            for (const name of list) {
              const prevConstraint = prev[name];
              const nextConstraint = next[name];

              if (prevConstraint && nextConstraint) {
                const constraint: Constraint = {};

                result[name] = constraint;

                for (const key of keys) {
                  if (
                    typeof prevConstraint[key] !== "undefined" &&
                    typeof nextConstraint[key] !== "undefined" &&
                    prevConstraint[key] === nextConstraint[key]
                  ) {
                    // @ts-expect-error Both are on the same type
                    constraint[key] = prevConstraint[key];
                  }
                }
              } else {
                result[name] = {
                  ...prevConstraint,
                  ...nextConstraint,
                  required: false,
                };
              }
            }

            return result;
          }),
      );
    } else if (name === "") {
      // All the cases below are not allowed on root
      throw new Error("Unsupported schema");
    } else if (schema.type === "array") {
      constraint.multiple = true;
      updateConstraint(schema.item, data, `${name}[]`);
    } else if (schema.type === "string") {
      const minLength = schema.pipe?.find(
        (v) => "type" in v && v.type === "min_length",
      );
      if (minLength && "requirement" in minLength) {
        constraint.minLength = minLength.requirement as number;
      }
      const maxLength = schema.pipe?.find(
        (v) => "type" in v && v.type === "max_length",
      );
      if (maxLength && "requirement" in maxLength) {
        constraint.maxLength = maxLength.requirement as number;
      }
    } else if (schema.type === "optional") {
      constraint.required = false;
      updateConstraint(schema.wrapped, data, name);
    } else if (schema.type === "number") {
      const minValue = schema.pipe?.find(
        (v) => "type" in v && v.type === "min_value",
      );
      if (minValue && "requirement" in minValue) {
        constraint.min = minValue.requirement as number;
      }
      const maxValue = schema.pipe?.find(
        (v) => "type" in v && v.type === "max_value",
      );
      if (maxValue && "requirement" in maxValue) {
        constraint.max = maxValue.requirement as number;
      }
    } else if (schema.type === "enum") {
      constraint.pattern = Object.entries(schema.enum)
        .map(([_, option]) =>
          // To escape unsafe characters on regex
          typeof option === "string"
            ? option
                .replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
                .replace(/-/g, "\\x2d")
            : option,
        )
        .join("|");
    } else if (schema.type === "tuple") {
      for (let i = 0; i < schema.items.length; i++) {
        updateConstraint(schema.items[i], data, `${name}[${i}]`);
      }
    } else {
      // FIXME: If you are interested in this, feel free to create a PR
    }
  }

  const result: Record<string, Constraint> = {};

  updateConstraint(schema, result);

  return result;
}
