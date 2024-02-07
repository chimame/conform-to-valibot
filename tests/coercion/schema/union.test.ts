import { describe, expect, test } from "vitest";
import { parseWithValibot } from "../../../parse";
import { object, union, number, undefined_ } from "valibot";
import { createFormData } from "../../helpers/FormData";

describe("union", () => {
  test("should pass only union values", () => {
    const schema = object({ age: union([number(), undefined_()]) });
    const output1 = parseWithValibot(createFormData("age", "30"), { schema });
    expect(output1).toMatchObject({ status: "success", value: { age: 30 } });

    const output2 = parseWithValibot(createFormData("age", ""), { schema });
    expect(output2).toMatchObject({
      status: "success",
      value: { age: undefined },
    });

    expect(
      parseWithValibot(createFormData("age", "non number"), { schema }),
    ).toMatchObject({
      error: { age: ["Invalid type"] },
    });
  });
});
