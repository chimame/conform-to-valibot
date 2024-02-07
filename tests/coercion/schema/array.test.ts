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
  });
});
