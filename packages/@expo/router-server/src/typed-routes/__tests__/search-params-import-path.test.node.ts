import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createSearchParamsImportPathResolver } from '../searchParams';

let projectRoot: string;

beforeEach(() => {
  projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'typed-routes-'));
  fs.mkdirSync(path.join(projectRoot, 'app/(tabs)'), { recursive: true });
  fs.mkdirSync(path.join(projectRoot, '.expo/types'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

it('returns the import path of a route that exports a SearchParams type', () => {
  fs.writeFileSync(
    path.join(projectRoot, 'app/(tabs)/search.tsx'),
    'export type SearchParams = { q?: string };\nexport default function Search() {}\n'
  );
  const resolve = createSearchParamsImportPathResolver(
    path.join(projectRoot, 'app'),
    path.join(projectRoot, '.expo/types')
  );

  expect(resolve('./(tabs)/search.tsx')).toBe('../../app/(tabs)/search');
});

it('returns the import path of a route that exports a SearchParams interface', () => {
  fs.writeFileSync(
    path.join(projectRoot, 'app/search.tsx'),
    'export interface SearchParams { q?: string }\nexport default function Search() {}\n'
  );
  const resolve = createSearchParamsImportPathResolver(
    path.join(projectRoot, 'app'),
    path.join(projectRoot, '.expo/types')
  );

  expect(resolve('./search.tsx')).toBe('../../app/search');
});

it('returns the import path of a route that re-exports SearchParams', () => {
  fs.writeFileSync(
    path.join(projectRoot, 'app/search.tsx'),
    "export type { SearchParams } from '../params';\nexport default function Search() {}\n"
  );
  const resolve = createSearchParamsImportPathResolver(
    path.join(projectRoot, 'app'),
    path.join(projectRoot, '.expo/types')
  );

  expect(resolve('./search.tsx')).toBe('../../app/search');
});

it('returns undefined for a route without a SearchParams export', () => {
  fs.writeFileSync(
    path.join(projectRoot, 'app/settings.tsx'),
    'type SearchParams = { q?: string };\nexport default function Settings() {}\n'
  );
  const resolve = createSearchParamsImportPathResolver(
    path.join(projectRoot, 'app'),
    path.join(projectRoot, '.expo/types')
  );

  expect(resolve('./settings.tsx')).toBe(undefined);
});

it('returns undefined for a route file that does not exist', () => {
  const resolve = createSearchParamsImportPathResolver(
    path.join(projectRoot, 'app'),
    path.join(projectRoot, '.expo/types')
  );

  expect(resolve('./missing.tsx')).toBe(undefined);
});
