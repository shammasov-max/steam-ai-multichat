import { Schema } from '@effect/schema';
import { Draft } from '@reduxjs/toolkit';
import { createEntitySlice } from '../base/createEntitySlice';

// ============= Types =============

export interface MaFile {
  readonly maFileId: string; // filename without extension
  readonly accountName: string;
  readonly password: string;
  readonly sharedSecret: string;
  readonly identitySecret: string;
  readonly revocationCode: string;
  readonly uri?: string;
  readonly serverTime?: number;
}

// ============= Schema =============

export const MaFileSchema = Schema.Struct({
  maFileId: Schema.String,
  accountName: Schema.String,
  password: Schema.String,
  sharedSecret: Schema.String,
  identitySecret: Schema.String,
  revocationCode: Schema.String,
  uri: Schema.optional(Schema.String),
  serverTime: Schema.optional(Schema.Number)
});

// ============= Create Slice =============

export const maFileSlice = createEntitySlice({
  name: 'maFile',
  initialEntities: [] as Draft<MaFile>[],
  entityReducers: {}
  
  // entitySchema: MaFileSchema, // TODO: Fix schema type compatibility
});

// ============= Exports =============

export default maFileSlice;