import { describe, expect, test } from 'vitest';
import { createFormData } from './helpers/FormData';
import { parse } from '../parse';
import { string, object } from 'valibot';

describe('string', () => {
  test('should pass only strings', () => {
    const schema = object({ name: string() });

    const output = parse(createFormData('name', 'Jane'), { schema });

    expect(output).toMatchObject({ error: {}, value: {name: 'Jane' } });
    expect(parse(createFormData('name', ''), { schema })).toMatchObject({ error: { name: ['Invalid type'] } });
  });
});
