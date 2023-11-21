import { describe, expect, test } from "vitest";
import { parse } from "../parse";
import { object, picklist } from "valibot";
import { createFormData } from "./helpers/FormData";

describe("picklist", () => {
  test("should pass only picklist values", () => {
    const schema = object({ list: picklist(["value_1", "value_2"]) });

    const formData1 = createFormData("list", "value_1");
    const output1 = parse(formData1, { schema });
    expect(output1).toMatchObject({
      error: {},
      value: { list: "value_1" },
    });

    const formData2 = createFormData("list", "value_2");
    const output2 = parse(formData2, { schema });
    expect(output2).toMatchObject({
      error: {},
      value: { list: "value_2" },
    });

    const formData3 = createFormData("list", "value_3");
    const output3 = parse(formData3, { schema });
    expect(output3).toMatchObject({
      error: { list: ["Invalid type"] },
    });
  });
});
