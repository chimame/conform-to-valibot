import { describe, expect, test } from "vitest";
import { literal, object, string, intersect } from "valibot";
import { parseWithValibot } from "../../../parse";
import { createFormData } from "../../helpers/FormData";

describe("intersect", () => {
  test("should pass only intersect values", () => {
    const schema1 = object({
      intersect: intersect([string(), literal("test")]),
    });
    const input1 = createFormData("intersect", "test");
    const output1 = parseWithValibot(input1, { schema: schema1 });
    expect(output1).toMatchObject({
      status: "success",
      value: { intersect: "test" },
    });

    const errorInput1 = createFormData("intersect", "foo");
    const errorOutput1 = parseWithValibot(errorInput1, { schema: schema1 });
    expect(errorOutput1).toMatchObject({
      error: { intersect: ["Invalid type: Expected \"test\" but received \"foo\""] },
    });
    const errorInput2 = createFormData("intersect", "");
    const errorOutput2 = parseWithValibot(errorInput2, { schema: schema1 });
    expect(errorOutput2).toMatchObject({
      error: { intersect: ["Invalid type: Expected string but received undefined", "Invalid type: Expected \"test\" but received undefined"] },
    });

    const schema2 = intersect([
      object({ foo: string() }),
      object({ bar: string() }),
    ]);
    const input2 = createFormData("foo", "test");
    input2.append("bar", "test");
    const output2 = parseWithValibot(input2, { schema: schema2 });
    expect(output2).toMatchObject({
      status: "success",
      value: { foo: "test", bar: "test" },
    });
    const errorInput3 = createFormData("foo", "test");
    const errorOutput3 = parseWithValibot(errorInput3, { schema: schema2 });
    expect(errorOutput3).toMatchObject({
      error: { bar: ["Invalid type: Expected string but received undefined"] },
    });
    const errorInput4 = createFormData("bar", "test");
    const errorOutput4 = parseWithValibot(errorInput4, { schema: schema2 });
    expect(errorOutput4).toMatchObject({
      error: { foo: ["Invalid type: Expected string but received undefined"] },
    });
  });

  test("should throw only first issue", () => {
    const schema = object({
      intersect: intersect([string(), literal("test")]),
    });
    const errorInput = createFormData("intersect", "");
    const info = { abortEarly: true };
    const errorOutput = parseWithValibot(errorInput, { schema, info });
    expect(errorOutput).toMatchObject({
      error: { intersect: ["Invalid type: Expected string but received undefined"] },
    });
  });
});
