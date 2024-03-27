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
