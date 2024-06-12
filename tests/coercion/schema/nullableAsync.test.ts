import { describe, expect, test } from "vitest";
import {
  string,
  number,
  objectAsync,
  nullableAsync,
  optionalAsync,
  checkAsync,
  pipeAsync,
} from "valibot";
import { parseWithValibot } from "../../../parse";
import { createFormData } from "../../helpers/FormData";

describe("nullableAsync", () => {
  test("should pass also undefined", async () => {
    const schema = objectAsync({ age: nullableAsync(number()) });
    const output = await parseWithValibot(createFormData("age", "20"), {
      schema,
    });

    expect(output).toMatchObject({
      status: "success",
      value: { age: 20 },
    });
    expect(
      await parseWithValibot(createFormData("age", "non number"), { schema }),
    ).toMatchObject({
      error: { age: ["Invalid type: Expected number but received NaN"] },
    });
  });

  test("should pass nullable with pipe", async () => {
    const schema = objectAsync({
      age: pipeAsync(
        nullableAsync(number()),
        checkAsync(
          async (value) => value == null || value > 0,
          "age must be greater than 0",
        ),
      ),
    });

    const output2 = await parseWithValibot(createFormData("age", "20"), {
      schema,
    });
    expect(output2).toMatchObject({
      status: "success",
      value: { age: 20 },
    });

    const errorOutput = await parseWithValibot(createFormData("age", "0"), {
      schema,
    });
    expect(errorOutput).toMatchObject({
      error: { age: ["age must be greater than 0"] },
    });
  });

  test("should use default if required", async () => {
    const default_ = "default";

    const schema1 = objectAsync({
      name: optionalAsync(nullableAsync(string(), default_), null),
    });
    const output1 = await parseWithValibot(createFormData("name", ""), {
      schema: schema1,
    });
    expect(output1).toMatchObject({
      status: "success",
      value: { name: "default" },
    });

    const schema2 = objectAsync({
      name: nullableAsync(string(), () => default_),
    });
    const output2 = await parseWithValibot(createFormData("name", ""), {
      schema: schema1,
    });
    expect(output2).toMatchObject({
      status: "success",
      value: { name: "default" },
    });
  });
});
