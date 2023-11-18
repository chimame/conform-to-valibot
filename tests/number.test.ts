import { describe, expect, test } from 'vitest';
import { createFormData } from './helpers/FormData';
import { parse } from '../parse';
import { number, object } from 'valibot';

describe('number', () => {
  test('should pass only numbers', () => {
    const schema = object({ age: number() });
    const output = parse(createFormData('age', '20'), { schema });

    expect(output).toMatchObject({ error: {}, value: { age: 20 } });
    expect(parse(createFormData('age', 'non number'), { schema })).toMatchObject({ error: { age: ['Invalid type'] } });
  });
});
