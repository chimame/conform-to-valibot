import { describe, expect, test } from "vitest";
import { parse } from "../parse";
import {
  object,
  number,
  optional,
  nonNullish,
  union,
  undefined_,
} from "valibot";
import { createFormData } from "./helpers/FormData";

describe("nonOptional", () => {
  test("should not pass undefined", () => {
    const schema1 = object({
      item: nonNullish(optional(number())),
    });
    const input1 = createFormData("item", "1");
    const output1 = parse(input1, { schema: schema1 });
    expect(output1).toMatchObject({ status: "success", value: { item: 1 } });
    expect(
      parse(createFormData("item", "non Number"), { schema: schema1 }),
    ).toMatchObject({ error: { item: ["Invalid type"] } });
    expect(
      parse(createFormData("item2", "non Param"), { schema: schema1 }),
    ).toMatchObject({ error: { item: ["Invalid type"] } });

    const schema2 = object({
      item: nonNullish(union([number(), undefined_()])),
    });
    const output2 = parse(input1, { schema: schema2 });
    expect(output2).toMatchObject({ status: "success", value: { item: 1 } });
    expect(
      parse(createFormData("item", "non Number"), { schema: schema2 }),
    ).toMatchObject({ error: { item: ["Invalid type"] } });
    expect(
      parse(createFormData("item2", "non Param"), { schema: schema2 }),
    ).toMatchObject({ error: { item: ["Invalid type"] } });
  });
});
