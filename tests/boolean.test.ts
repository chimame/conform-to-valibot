import { describe, expect, test } from "vitest";
import { parse } from "../parse";
import { object, boolean } from "valibot";
import { createFormData } from "./helpers/FormData";

describe("boolean", () => {
  test("should pass only booleans", () => {
    const schema = object({ check: boolean() });
    const input1 = createFormData("check", "on");
    const output1 = parse(input1, { schema });
    expect(output1).toMatchObject({
      status: "success",
      value: { check: true },
    });
    expect(parse(createFormData("check", ""), { schema })).toMatchObject({
      error: { check: ["Invalid type"] },
    });
  });
});
