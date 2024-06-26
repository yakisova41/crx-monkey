import fs from 'fs';

/**
 * Run_at in chrome extension manifest convert to runAt in userscript.
 * @param chromeRunAt
 * @returns
 */
export function convertChromeRunAtToUserJsRunAt(
  chromeRunAt: 'document_start' | 'document_end' | 'document_idle',
): 'document-start' | 'document-end' | 'document-idle' {
  if (chromeRunAt === 'document_start') {
    return 'document-start';
  } else if (chromeRunAt === 'document_end') {
    return 'document-end';
  } else if (chromeRunAt === 'document_idle') {
    return 'document-idle';
  } else {
    throw new Error(
      [
        'Unknown run_at type.',
        'Please specify a valid run_at',
        'Chrome Reference: https://developer.chrome.com/docs/extensions/reference/api/extensionTypes?hl=ja#type-RunAt',
      ].join('\n'),
    );
  }
}

/**
 * Convert image to base64 string.
 * @param imgPath Local image file path.
 * @returns
 */
export function convertImgToBase64(imgPath: string) {
  const icon = fs.readFileSync(imgPath);
  const buf = Buffer.from(icon).toString('base64');
  return `data:image/png;base64,${buf}`;
}
