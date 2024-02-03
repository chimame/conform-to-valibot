import { describe, expect, test } from "vitest";
import { string, number, object, optional } from "valibot";
import { parse } from "../parse";
import { createFormData } from "./helpers/FormData";

describe("optional", () => {
  test("should pass also undefined", () => {
    const schema = object({ age: optional(number()) });
    const output = parse(createFormData("age", ""), { schema });

    expect(output).toMatchObject({ error: {}, value: { age: undefined } });
    expect(parse(createFormData("age", "20"), { schema })).toMatchObject({
      error: {},
      value: { age: 20 },
    });
    expect(
      parse(createFormData("age", "non number"), { schema }),
    ).toMatchObject({ error: { age: ["Invalid type"] } });
  });

  test("should use default if required", () => {
    const default_ = "default";

    const schema1 = object({ name: optional(string(), default_) });
    const output1 = parse(createFormData("name", ""), { schema: schema1 });
    expect(output1).toMatchObject({ error: {}, value: { name: "default" } });

    const schema2 = object({ name: optional(string(), () => default_) });
    const output2 = parse(createFormData("name", ""), { schema: schema2 });
    expect(output2).toMatchObject({ error: {}, value: { name: "default" } });
  });
});
