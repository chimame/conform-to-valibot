import { describe, expect, test } from "vitest";
import { parseWithValibot } from "../../../parse";
import {
  optional,
  number,
  object,
  string,
  tupleWithRest,
  check,
  pipe,
} from "valibot";
import { createFormData } from "../../helpers/FormData";

describe("tupleWithRest", () => {
  test("should pass only tuples", () => {
    const schema1 = object({
      tuple: tupleWithRest([string()], optional(number())),
    });
    const input3 = createFormData("tuple[]", "test");
    const output3 = parseWithValibot(input3, { schema: schema1 });
    expect(output3).toMatchObject({
      status: "success",
      value: { tuple: ["test"] },
    });
    const input4 = createFormData("tuple", "test");
    input4.append("tuple", "");
    const output4 = parseWithValibot(input4, { schema: schema1 });
    expect(output4).toMatchObject({
      status: "success",
      value: { tuple: ["test", undefined] },
    });
    const input5 = createFormData("tuple", "test");
    input5.append("tuple", "1");
    input5.append("tuple", "2");
    const output5 = parseWithValibot(input5, { schema: schema1 });
    expect(output5).toMatchObject({
      status: "success",
      value: { tuple: ["test", 1, 2] },
    });
  });

  test("should pass tuples with pipe", () => {
    const schema = object({
      tuple: pipe(
        tupleWithRest([string()], optional(number())),
        check((v) => v.length > 2, "tuple must have more than 1 element"),
      ),
    });
    const input = createFormData("tuple", "test");
    input.append("tuple", "1");
    input.append("tuple", "2");
    const output = parseWithValibot(input, { schema });
    expect(output).toMatchObject({
      status: "success",
      value: { tuple: ["test", 1, 2] },
    });

    const errorInput = createFormData("tuple", "test");
    errorInput.append("tuple", "1");
    expect(parseWithValibot(errorInput, { schema })).toMatchObject({
      error: { tuple: ["tuple must have more than 1 element"] },
    });
  });
});
