import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { JsonSchema } from '../types';

export const mockBasicSchema: JsonSchema = {
  title: 'User',
  description: 'A user object',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'The user name',
      minLength: 1,
      maxLength: 100,
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'The user email address',
    },
    age: {
      type: 'integer',
      minimum: 0,
      maximum: 150,
      description: 'The user age in years',
    },
  },
  required: ['name', 'email'],
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

export * from '@testing-library/react';
export { customRender as render };
