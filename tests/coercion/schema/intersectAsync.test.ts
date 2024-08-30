import {
  checkAsync,
  intersectAsync,
  literal,
  objectAsync,
  pipeAsync,
  string,
} from "valibot";
import { describe, expect, test } from "vitest";
import { parseWithValibot } from "../../../parse";
import { createFormData } from "../../helpers/FormData";

describe("intersectAsync", () => {
  test("should pass only intersect values", async () => {
    const schema1 = objectAsync({
      intersect: intersectAsync([string(), literal("test")]),
    });
    const input1 = createFormData("intersect", "test");
    const output1 = await parseWithValibot(input1, { schema: schema1 });
    expect(output1).toMatchObject({
      status: "success",
      value: { intersect: "test" },
    });

    const errorInput1 = createFormData("intersect", "foo");
    const errorOutput1 = await parseWithValibot(errorInput1, {
      schema: schema1,
    });
    expect(errorOutput1).toMatchObject({
      error: {
        intersect: ['Invalid type: Expected "test" but received "foo"'],
      },
    });
    const errorInput2 = createFormData("intersect", "");
    const errorOutput2 = await parseWithValibot(errorInput2, {
      schema: schema1,
    });
    expect(errorOutput2).toMatchObject({
      error: {
        intersect: [
          "Invalid type: Expected string but received undefined",
          'Invalid type: Expected "test" but received undefined',
        ],
      },
    });

    const schema2 = intersectAsync([
      objectAsync({ foo: string() }),
      objectAsync({ bar: string() }),
    ]);
    const input2 = createFormData("foo", "test");
    input2.append("bar", "test");
    const output2 = await parseWithValibot(input2, { schema: schema2 });
    expect(output2).toMatchObject({
      status: "success",
      value: { foo: "test", bar: "test" },
    });
    const errorInput3 = createFormData("foo", "test");
    const errorOutput3 = await parseWithValibot(errorInput3, {
      schema: schema2,
    });
    expect(errorOutput3).toMatchObject({
      error: { bar: ["Invalid type: Expected string but received undefined"] },
    });
    const errorInput4 = createFormData("bar", "test");
    const errorOutput4 = await parseWithValibot(errorInput4, {
      schema: schema2,
    });
    expect(errorOutput4).toMatchObject({
      error: { foo: ["Invalid type: Expected string but received undefined"] },
    });
  });

  test("should pass only intersect values with pipe", async () => {
    const schema = objectAsync({
      intersect: pipeAsync(
        intersectAsync([string()]),
        checkAsync(
          async (value) => value === "test",
          "intersect must be equal to test",
        ),
      ),
    });
    const input1 = createFormData("intersect", "test");
    const output1 = await parseWithValibot(input1, { schema });
    expect(output1).toMatchObject({
      status: "success",
      value: { intersect: "test" },
    });

    const errorInput1 = createFormData("intersect", "foo");
    const errorOutput1 = await parseWithValibot(errorInput1, { schema });
    expect(errorOutput1).toMatchObject({
      error: {
        intersect: ["intersect must be equal to test"],
      },
    });
  });

  test("should throw only first issue", async () => {
    const schema = objectAsync({
      intersect: intersectAsync([string(), literal("test")]),
    });
    const errorInput = createFormData("intersect", "");
    const info = { abortEarly: true };
    const errorOutput = await parseWithValibot(errorInput, { schema, info });
    expect(errorOutput).toMatchObject({
      error: {
        intersect: ["Invalid type: Expected string but received undefined"],
      },
    });
  });
});
