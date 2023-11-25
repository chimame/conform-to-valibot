import { describe, expect, test } from "vitest";
import { parse } from "../parse";
import { object, any } from "valibot";
import { createFormData } from "./helpers/FormData";

describe("any", () => {
  test("should pass any values", () => {
    const schema = object({ item: any() });
    const input1 = createFormData("item", "hello");
    const output1 = parse(input1, { schema });
    expect(output1).toMatchObject({ error: {}, value: { item: "hello" } });
    const input2 = createFormData("item", "1");
    input2.append("item", "2");
    const output2 = parse(input2, { schema });
    expect(output2).toMatchObject({ error: {}, value: { item: ["1", "2"] } });
  });
});
