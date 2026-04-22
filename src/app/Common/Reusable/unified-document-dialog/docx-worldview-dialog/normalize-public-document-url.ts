/**
 * Normalizes document URLs for ngx-doc-viewer + Office Online.
 * Office embeds pass the full URL as one query param; APIs sometimes return
 * fully double-encoded strings or http — this keeps a single canonical href.
 */
export function normalizePublicDocumentUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  let candidate = trimmed;

  // Entire URL was stored as one encoded token (e.g. "https%3A%2F%2F...")
  if (/^https?%3A%2F%2F/i.test(candidate)) {
    try {
      candidate = decodeURIComponent(candidate);
    } catch {
      return trimmed;
    }
  }

  try {
    const u = new URL(candidate);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return trimmed;
    }

    // Public S3 virtual-hosted URLs should use HTTPS for Office + browsers
    if (isAwsS3VirtualHostedHost(u.hostname)) {
      u.protocol = 'https:';
    }

    return u.href;
  } catch {
    return candidate;
  }
}

function isAwsS3VirtualHostedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (!h.endsWith('.amazonaws.com')) {
    return false;
  }
  // Virtual-hosted: bucket.s3.region.amazonaws.com — or path-style s3.region.amazonaws.com
  return h.includes('.s3.') || /^s3[.-]/i.test(hostname);
}
