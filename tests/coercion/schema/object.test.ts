import { number, string, object } from "valibot";
import { describe, expect, test } from "vitest";
import { parseWithValibot } from "../../../parse";
import { createFormData } from "../../helpers/FormData";

describe("object", () => {
  test("should pass only objects", () => {
    const schema1 = object({ key1: string(), key2: number() });
    const input1 = createFormData("key1", "test");
    input1.append("key2", "123");
    const output1 = parseWithValibot(input1, { schema: schema1 });
    expect(output1).toMatchObject({
      status: "success",
      value: { key1: "test", key2: 123 },
    });

    input1.append("key3", "");
    const output2 = parseWithValibot(input1, { schema: schema1 });
    expect(output2).toMatchObject({
      status: "success",
      value: { key1: "test", key2: 123 },
    });

    const input2 = createFormData("key1", "");
    input2.append("key2", "123");
    const output3 = parseWithValibot(input2, { schema: schema1 });
    expect(output3).toMatchObject({
      error: {
        key1: ["Invalid type: Expected string but received undefined"],
      },
    });

    const input3 = createFormData("key1", "string");
    input3.set("key2", "non number");
    const output4 = parseWithValibot(input3, { schema: schema1 });
    expect(output4).toMatchObject({
      error: {
        key2: ["Invalid type: Expected number but received NaN"],
      },
    });
  });
});
