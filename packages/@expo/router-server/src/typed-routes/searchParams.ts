import { removeSupportedExtensions } from 'expo-router/internal/routing';
import fs from 'node:fs';
import path from 'node:path';

const SEARCH_PARAMS_EXPORT =
  /export\s+(?:type|interface)\s+SearchParams\b|export\s+(?:type\s+)?\{[^}]*\bSearchParams\b[^}]*\}/;

/**
 * Returns a function that maps a route's context key to the import path of its module, relative to
 * `outputDir`, when the route file exports `SearchParams`. The file is read as text and never executed.
 */
export function createSearchParamsImportPathResolver(appRoot: string, outputDir: string) {
  return (contextKey: string): string | undefined => {
    const filePath = path.join(appRoot, contextKey);
    let source: string;
    try {
      source = fs.readFileSync(filePath, 'utf8');
    } catch {
      return undefined;
    }
    if (!SEARCH_PARAMS_EXPORT.test(source)) {
      return undefined;
    }

    const importPath = path
      .relative(outputDir, removeSupportedExtensions(filePath))
      .split(path.sep)
      .join('/');
    return importPath.startsWith('.') ? importPath : `./${importPath}`;
  };
}
