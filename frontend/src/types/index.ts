/**
 * 책 검색 결과
 */
export interface BookSearchResult {
  itemId: number;
  isbn13?: string;
  title: string;
  author?: string;
  publisher?: string;
  pubDate?: string;
  cover?: string;
  priceStandard?: number;
  priceSales?: number;
  usedCount?: number;
  usedMinPrice?: number;
}

/**
 * 사용자가 선택한 책 (등급 필터 포함)
 */
export interface BookItem {
  itemId: number;
  isbn13?: string;
  title: string;
  author?: string;
  cover?: string;
  priceStandard?: number;
  minQuality: Quality;
}

/**
 * 등급
 */
export type Quality = '최상' | '상' | '중';

/**
 * 판매자가 보유한 개별 책 정보
 */
export interface SellerBookItem {
  itemId: number;
  title: string;
  quality?: string;
  price?: number;
  productUrl?: string;
}

/**
 * 판매자 정보
 */
export interface SellerInfo {
  sellerCode: string;
  sellerName: string;
  sellerType?: string;
  satisfactionRate?: number;
  shopUrl: string;
  books: SellerBookItem[];
  totalBookCount: number;
  totalPrice: number;
  shippingFee?: number;
  freeShippingThreshold?: number;
}

/**
 * 북번들 요청
 */
export interface BundleRequest {
  books: BookItem[];
}

/**
 * 북번들 결과
 */
export interface BundleResult {
  requestedBooks: BookItem[];
  totalRequestedCount: number;
  sellers: SellerInfo[];
  hasCompleteSeller: boolean;
  analysisTimeMs: number;
}

