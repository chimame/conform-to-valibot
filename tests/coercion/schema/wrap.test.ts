import {
  check,
  isoDate,
  nullable,
  object,
  optional,
  pipe,
  string,
} from "valibot";
import { describe, expect, test } from "vitest";
import { parseWithValibot } from "../../../parse";
import { createFormData } from "../../helpers/FormData";

describe("wrap", () => {
  test("should pass also undefined", () => {
    const schema = object({ name: optional(nullable(string()), null) });
    const output = parseWithValibot(createFormData("name", ""), { schema });
    expect(output).toMatchObject({ status: "success", value: { name: null } });
  });

  test("should pass with nested pipe object", () => {
    const schema = object({
      key1: string(),
      key2: optional(
        pipe(
          object({
            date: optional(pipe(string(), isoDate())),
          }),
          check((input) => input?.date !== "2000-01-01", "Bad date"),
        ),
      ),
    });

    const input = createFormData("key1", "valid");
    input.append("key2.date", "");

    const output = parseWithValibot(input, {
      schema,
    });

    expect(output).toMatchObject({
      status: "success",
      value: { key1: "valid", key2: {} },
    });
  });
});
