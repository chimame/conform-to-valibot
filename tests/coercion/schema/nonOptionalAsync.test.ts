import { describe, expect, test } from "vitest";
import { parseWithValibot } from "../../../parse";
import {
  objectAsync,
  number,
  optionalAsync,
  nonOptionalAsync,
  unionAsync,
  undefined_,
  checkAsync,
  pipeAsync,
} from "valibot";
import { createFormData } from "../../helpers/FormData";

describe("nonOptionalAsync", () => {
  test("should not pass undefined", async () => {
    const schema1 = objectAsync({
      item: nonOptionalAsync(optionalAsync(number())),
    });
    const input1 = createFormData("item", "1");
    const output1 = await parseWithValibot(input1, { schema: schema1 });
    expect(output1).toMatchObject({ status: "success", value: { item: 1 } });
    expect(
      await parseWithValibot(createFormData("item", "non Number"), {
        schema: schema1,
      }),
    ).toMatchObject({
      error: { item: ["Invalid type: Expected number but received NaN"] },
    });
    expect(
      await parseWithValibot(createFormData("item2", "non Param"), {
        schema: schema1,
      }),
    ).toMatchObject({
      error: {
        item: ["Invalid type: Expected !undefined but received undefined"],
      },
    });

    const schema2 = objectAsync({
      item: nonOptionalAsync(unionAsync([number(), undefined_()])),
    });
    const output2 = await parseWithValibot(input1, { schema: schema2 });
    expect(output2).toMatchObject({ status: "success", value: { item: 1 } });
    expect(
      await parseWithValibot(createFormData("item", "non Number"), {
        schema: schema2,
      }),
    ).toMatchObject({
      error: {
        item: [
          'Invalid type: Expected number | undefined but received "non Number"',
        ],
      },
    });
    expect(
      await parseWithValibot(createFormData("item2", "non Param"), {
        schema: schema2,
      }),
    ).toMatchObject({
      error: {
        item: ["Invalid type: Expected !undefined but received undefined"],
      },
    });
  });

  test("should pass nonOptional with pipe", async () => {
    const schema = objectAsync({
      age: pipeAsync(
        nonOptionalAsync(optionalAsync(number())),
        checkAsync(async (value) => value > 0, "age must be greater than 0"),
      ),
    });

    const output1 = await parseWithValibot(createFormData("age", "1"), {
      schema,
    });
    expect(output1).toMatchObject({ status: "success", value: { age: 1 } });

    const output2 = await parseWithValibot(createFormData("age", "0"), {
      schema,
    });
    expect(output2).toMatchObject({
      error: { age: ["age must be greater than 0"] },
    });

    const output3 = await parseWithValibot(createFormData("age", ""), {
      schema,
    });
    expect(output3).toMatchObject({
      error: {
        age: ["Invalid type: Expected !undefined but received undefined"],
      },
    });
  });
});
