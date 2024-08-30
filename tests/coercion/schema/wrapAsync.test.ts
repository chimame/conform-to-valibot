import { nullableAsync, objectAsync, optionalAsync, string } from "valibot";
import { describe, expect, test } from "vitest";
import { parseWithValibot } from "../../../parse";
import { createFormData } from "../../helpers/FormData";

describe("wrapAsync", () => {
  test("should pass also undefined", async () => {
    const schema = objectAsync({
      name: optionalAsync(nullableAsync(string()), null),
    });
    const output = await parseWithValibot(createFormData("name", ""), {
      schema,
    });
    expect(output).toMatchObject({ status: "success", value: { name: null } });
  });
});
