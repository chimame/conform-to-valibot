import { describe, expect, test } from "vitest";
import { parse } from "../parse";
import { object, date } from "valibot";
import { createFormData } from "./helpers/FormData";

describe("date", () => {
  test("should pass only dates", () => {
    const schema = object({ birthday: date() });
    const output = parse(createFormData("birthday", "2023-11-19"), { schema });
    expect(output).toMatchObject({
      status: "success",
      value: { birthday: new Date("2023-11-19") },
    });

    expect(
      parse(createFormData("birthday", "non date"), { schema }),
    ).toMatchObject({ error: { birthday: ["Invalid type"] } });
  });
});
