import path from 'path';

/**
 * If user used windows, path scheme would be changed file:// and absolutable.
 * @param filePath
 * @returns
 */
export function resolveFilePath(filePath: string) {
  if (process.env.OS === 'Windows_NT') {
    if (path.isAbsolute(filePath)) {
      const resolved = path.resolve(filePath);
      return 'file://' + resolved;
    } else {
      const resolved = path.resolve(import.meta.dirname, filePath);
      return 'file://' + resolved;
    }
  } else {
    return filePath;
  }
}
