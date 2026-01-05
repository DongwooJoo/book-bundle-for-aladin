import { useState } from 'react';
import type { BundleResult } from '../types';

interface BundleResultViewProps {
  result: BundleResult;
  onClose: () => void;
}

const INITIAL_DISPLAY_COUNT = 5;

export function BundleResultView({ result, onClose }: BundleResultViewProps) {
  const { sellers, totalRequestedCount, hasCompleteSeller, analysisTimeMs } = result;
  const [showAll, setShowAll] = useState(false);

  const displayedSellers = showAll ? sellers : sellers.slice(0, INITIAL_DISPLAY_COUNT);
  const remainingCount = sellers.length - INITIAL_DISPLAY_COUNT;
  const hasMoreSellers = sellers.length > INITIAL_DISPLAY_COUNT;

  return (
    <div className="apple-card apple-card-bordered" style={{ padding: '32px' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-eyebrow">
            분석 완료
          </p>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: 'var(--font-weight-semibold)',
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
            marginTop: '8px'
          }}>
            최적의 판매자를<br />찾았습니다.
          </h2>
        </div>
        <button
          onClick={onClose}
          className="apple-button apple-button-secondary apple-button-small"
          style={{ borderRadius: 'var(--radius-sm)' }}
        >
          닫기
        </button>
      </div>

      {/* Stats */}
      <div className="apple-stats mb-8">
        <div className="apple-stat">
          <div className="apple-stat-value">
            {totalRequestedCount}
          </div>
          <div className="apple-stat-label">검색한 책</div>
        </div>
        <div className="apple-stat">
          <div className="apple-stat-value">
            {sellers.length}
          </div>
          <div className="apple-stat-label">발견된 판매자</div>
        </div>
        <div className="apple-stat">
          <div className="apple-stat-value">
            {(analysisTimeMs / 1000).toFixed(1)}s
          </div>
          <div className="apple-stat-label">분석 시간</div>
        </div>
      </div>

      {/* Complete Seller Alert */}
      {hasCompleteSeller && (
        <div 
          className="mb-8 p-5 rounded-xl flex items-center gap-4"
          style={{ 
            backgroundColor: 'var(--color-background-tertiary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div 
            style={{ 
              width: '48px', 
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
              color: 'white'
            }}
          >
            ✓
          </div>
          <div>
            <p style={{ 
              fontSize: '17px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)'
            }}>
              모든 책을 한 판매자에게서 구매할 수 있습니다
            </p>
            <p className="text-caption mt-1">
              배송비를 1회만 내면 됩니다. 아래에서 확인하세요.
            </p>
          </div>
        </div>
      )}

      {/* Seller List */}
      {sellers.length === 0 ? (
        <div 
          className="text-center py-16"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <div 
            style={{ 
              width: '64px', 
              height: '64px', 
              margin: '0 auto 16px',
              backgroundColor: 'var(--color-background-tertiary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px'
            }}
          >
            😢
          </div>
          <p style={{ fontSize: '17px', fontWeight: 'var(--font-weight-medium)' }}>
            조건에 맞는 판매자를 찾지 못했습니다
          </p>
          <p className="text-caption mt-2">
            등급 조건을 완화해보세요
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {displayedSellers.map((seller, index) => {
              const coveragePercent = Math.round(
                (seller.totalBookCount / totalRequestedCount) * 100
              );
              const isComplete = seller.totalBookCount === totalRequestedCount;

              return (
                <div
                  key={seller.sellerCode}
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-background-tertiary)',
                    border: isComplete 
                      ? '2px solid var(--color-text-primary)' 
                      : '1px solid var(--color-border)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {/* Seller Header */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* Rank Badge */}
                        <span 
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: index === 0 
                              ? 'var(--color-text-primary)' 
                              : 'var(--color-background)',
                            color: index === 0 ? 'white' : 'var(--color-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'var(--font-weight-semibold)',
                            border: index > 0 ? '1px solid var(--color-border)' : 'none'
                          }}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <h3 style={{ 
                            fontSize: '17px',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {seller.sellerName}
                            {isComplete && (
                              <span className="apple-tag apple-tag-green">
                                완벽 매칭
                              </span>
                            )}
                          </h3>
                          {seller.sellerType && (
                            <span className="text-caption">{seller.sellerType}</span>
                          )}
                        </div>
                      </div>
                      
                      <a
                        href={seller.shopUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="apple-button apple-button-primary apple-button-small"
                      >
                        상점 방문
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M3 9L9 3M9 3H4M9 3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-caption">
                          보유: {seller.totalBookCount}권 / {totalRequestedCount}권
                        </span>
                        <span style={{ 
                          fontSize: '14px',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-primary)'
                        }}>
                          {coveragePercent}%
                        </span>
                      </div>
                      <div className="apple-progress">
                        <div
                          className="apple-progress-bar"
                          style={{ width: `${coveragePercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Book List */}
                    <div className="space-y-2">
                      {seller.books.map((book) => (
                        <div
                          key={book.itemId}
                          className="flex items-center justify-between p-3 rounded-lg"
                          style={{ backgroundColor: 'var(--color-background)' }}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <svg 
                              width="16" 
                              height="16" 
                              viewBox="0 0 16 16" 
                              fill="none"
                              style={{ color: 'var(--color-text-primary)', flexShrink: 0 }}
                            >
                              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                              <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span 
                              className="truncate"
                              style={{ 
                                fontSize: '14px',
                                color: 'var(--color-text-primary)'
                              }}
                            >
                              {book.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                            {book.quality && (
                              <span className="apple-tag" style={{ fontSize: '11px' }}>
                                {book.quality}
                              </span>
                            )}
                            {book.price !== undefined && book.price > 0 && (
                              <span style={{ 
                                fontSize: '14px',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--color-text-primary)'
                              }}>
                                {book.price.toLocaleString()}원
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Price */}
                  {seller.totalPrice > 0 && (
                    <div 
                      className="px-5 py-4 flex items-center justify-between"
                      style={{ 
                        borderTop: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-background)'
                      }}
                    >
                      <span style={{ 
                        fontSize: '14px',
                        color: 'var(--color-text-secondary)'
                      }}>
                        총 가격
                      </span>
                      <span style={{ 
                        fontSize: '21px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text-primary)',
                        letterSpacing: '-0.02em'
                      }}>
                        {seller.totalPrice.toLocaleString()}원
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show More Button */}
          {hasMoreSellers && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="apple-button apple-button-secondary"
                style={{
                  width: '100%',
                  maxWidth: '320px',
                  borderRadius: 'var(--radius-md)',
                  height: '48px'
                }}
              >
                {showAll ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    접기
                  </>
                ) : (
                  <>
                    {remainingCount}명의 판매자 더보기
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
