import { describe, expect, test } from "vitest";
import { parseWithValibot } from "../../../parse";
import { object, union, number, undefined_, check, pipe } from "valibot";
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
      error: {
        age: [
          'Invalid type: Expected number | undefined but received "non number"',
        ],
      },
    });
  });

  test("should pass only union values with pipe", () => {
    const schema = object({
      age: pipe(
        union([number(), undefined_()]),
        check(
          (value) => value == null || value > 0,
          "age must be greater than 0",
        ),
      ),
    });

    const output1 = parseWithValibot(createFormData("age", "30"), { schema });
    expect(output1).toMatchObject({ status: "success", value: { age: 30 } });

    const output2 = parseWithValibot(createFormData("age", ""), { schema });
    expect(output2).toMatchObject({
      status: "success",
      value: { age: undefined },
    });

    const errorOutput1 = parseWithValibot(createFormData("age", "non number"), {
      schema,
    });
    expect(errorOutput1).toMatchObject({
      error: {
        age: [
          'Invalid type: Expected number | undefined but received "non number"',
        ],
      },
    });

    const errorOutput2 = parseWithValibot(createFormData("age", "0"), {
      schema,
    });
    expect(errorOutput2).toMatchObject({
      error: { age: ["age must be greater than 0"] },
    });
  });
});
