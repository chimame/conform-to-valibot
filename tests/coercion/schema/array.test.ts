import { describe, expect, test } from "vitest";
import { parseWithValibot } from "../../../parse";
import { object, array, string } from "valibot";
import { createFormData } from "../../helpers/FormData";

describe("array", () => {
  test("should pass only arrays", () => {
    const schema = object({ select: array(string()) });
    const formData = createFormData("select", "1");
    formData.append("select", "2");
    formData.append("select", "3");
    const output = parseWithValibot(formData, { schema });

    expect(output).toMatchObject({
      status: "success",
      value: { select: ["1", "2", "3"] },
    });

    const schema2 = object({ nest: array(object({ name: string() })) });
    const formData2 = createFormData("nest[].name", "test name");
    const output2 = parseWithValibot(formData2, { schema: schema2 });
    expect(output2).toMatchObject({
      status: "success",
      value: { nest: [{ name: "test name" }] },
    });

    const errorFormData = createFormData("nest[].name", "");
    const errorOutput = parseWithValibot(errorFormData, { schema: schema2 });
    expect(errorOutput).toMatchObject({
      error: { "nest[0].name": ["Invalid type"] },
    });
  });
});
