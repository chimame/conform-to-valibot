import { describe, expect, test } from "vitest";
import { optional } from "valibot";
import { parseWithValibot } from "../../../parse";
import { number, object, string, tuple } from "valibot";
import { createFormData } from "../../helpers/FormData";

describe("tuple", () => {
  test("should pass only tuples", () => {
    const schema1 = object({ tuple: tuple([number(), string()]) });
    const input1 = createFormData("tuple", "1");
    input1.append("tuple", "test");
    const output1 = parseWithValibot(input1, { schema: schema1 });
    expect(output1).toMatchObject({
      status: "success",
      value: { tuple: [1, "test"] },
    });
    const input2 = createFormData("tuple", "1");
    input2.append("tuple", "test");
    input2.append("tuple", "");
    const output2 = parseWithValibot(input2, { schema: schema1 });
    expect(output2).toMatchObject({
      status: "success",
      value: { tuple: [1, "test"] },
    });

    const errorInput1 = createFormData("tuple", "1");
    expect(parseWithValibot(errorInput1, { schema: schema1 })).toMatchObject({
      error: { tuple: ["Invalid type"] },
    });
    const errorInput2 = createFormData("tuple", "123");
    expect(parseWithValibot(errorInput2, { schema: schema1 })).toMatchObject({
      error: { tuple: ["Invalid type"] },
    });

    const schema2 = object({ tuple: tuple([string()], optional(number())) });
    const input3 = createFormData("tuple[]", "test");
    const output3 = parseWithValibot(input3, { schema: schema2 });
    expect(output3).toMatchObject({
      status: "success",
      value: { tuple: ["test"] },
    });
    const input4 = createFormData("tuple", "test");
    input4.append("tuple", "");
    const output4 = parseWithValibot(input4, { schema: schema2 });
    expect(output4).toMatchObject({
      status: "success",
      value: { tuple: ["test", undefined] },
    });
    const input5 = createFormData("tuple", "test");
    input5.append("tuple", "1");
    input5.append("tuple", "2");
    const output5 = parseWithValibot(input5, { schema: schema2 });
    expect(output5).toMatchObject({
      status: "success",
      value: { tuple: ["test", 1, 2] },
    });
  });
});
