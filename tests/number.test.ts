import { number, object } from "valibot";
import { describe, expect, test } from "vitest";
import { parse } from "../parse";
import { createFormData } from "./helpers/FormData";

describe("number", () => {
  test("should pass only numbers", () => {
    const schema = object({ age: number() });
    const output = parse(createFormData("age", "20"), { schema });

    expect(output).toMatchObject({ error: {}, value: { age: 20 } });
    expect(
      parse(createFormData("age", ""), { schema }),
    ).toMatchObject({ error: { age: ["Invalid type"] } });
    expect(
      parse(createFormData("age", "non number"), { schema }),
    ).toMatchObject({ error: { age: ["Invalid type"] } });
  });
});
