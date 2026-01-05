import type { BookSearchResult, BundleRequest, BundleResult } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * 책 검색
 */
export async function searchBooks(keyword: string): Promise<BookSearchResult[]> {
  const response = await fetch(
    `${API_BASE_URL}/books/search?keyword=${encodeURIComponent(keyword)}`
  );
  
  if (!response.ok) {
    throw new Error('책 검색에 실패했습니다');
  }
  
  return response.json();
}

/**
 * 북번들 분석
 */
export async function analyzeBundle(request: BundleRequest): Promise<BundleResult> {
  const response = await fetch(`${API_BASE_URL}/bundle/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error('북번들 분석에 실패했습니다');
  }
  
  return response.json();
}

/**
 * 헬스 체크
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

