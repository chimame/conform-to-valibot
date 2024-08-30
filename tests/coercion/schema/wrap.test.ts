import { nullable, object, optional, string } from "valibot";
import { describe, expect, test } from "vitest";
import { parseWithValibot } from "../../../parse";
import { createFormData } from "../../helpers/FormData";

describe("wrap", () => {
  test("should pass also undefined", () => {
    const schema = object({ name: optional(nullable(string()), null) });
    const output = parseWithValibot(createFormData("name", ""), { schema });
    expect(output).toMatchObject({ status: "success", value: { name: null } });
  });
});
