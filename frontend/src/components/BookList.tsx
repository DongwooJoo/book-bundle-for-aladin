import type { BookItem, Quality } from '../types';

interface BookListProps {
  books: BookItem[];
  onRemoveBook: (itemId: number) => void;
  onUpdateQuality: (itemId: number, quality: Quality) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const QUALITY_OPTIONS: Quality[] = ['최상', '상', '중'];

export function BookList({ 
  books, 
  onRemoveBook, 
  onUpdateQuality, 
  onAnalyze,
  isAnalyzing 
}: BookListProps) {
  return (
    <div className="apple-card apple-card-bordered" style={{ padding: '28px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'var(--font-weight-semibold)',
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            내 책 목록
            {books.length > 0 && (
              <span className="apple-tag apple-tag-blue">
                {books.length}권
              </span>
            )}
          </h2>
          <p className="text-caption mt-1">
            검색해서 추가한 책들
          </p>
        </div>
      </div>

      {books.length === 0 ? (
        /* Empty State */
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
              justifyContent: 'center'
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="5" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="10" y="5" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="var(--color-background-tertiary)"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 'var(--font-weight-medium)' }}>
            책을 추가해주세요
          </p>
          <p className="text-caption mt-1">
            왼쪽에서 책을 검색하고 추가하세요
          </p>
        </div>
      ) : (
        <>
          {/* Book List */}
          <div 
            className="space-y-2 mb-6" 
            style={{ maxHeight: '320px', overflowY: 'auto', marginRight: '-8px', paddingRight: '8px' }}
          >
            {books.map((book, index) => (
              <div
                key={book.itemId}
                className="flex items-center gap-3 p-3"
                style={{
                  backgroundColor: 'var(--color-background-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {/* Number Badge */}
                <span 
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-text-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)',
                    flexShrink: 0
                  }}
                >
                  {index + 1}
                </span>
                
                {/* Book Cover */}
                <div 
                  className="apple-book-cover"
                  style={{ width: '44px', height: '58px' }}
                >
                  {book.cover ? (
                    <img src={book.cover} alt={book.title} />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ color: 'var(--color-text-tertiary)', fontSize: '18px' }}
                    >
                      📚
                    </div>
                  )}
                </div>
                
                {/* Book Info */}
                <div className="flex-1 min-w-0">
                  <h3 
                    className="truncate"
                    style={{ 
                      fontSize: '14px',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.3
                    }}
                  >
                    {book.title}
                  </h3>
                  {book.author && (
                    <p 
                      className="truncate"
                      style={{ 
                        fontSize: '12px',
                        color: 'var(--color-text-secondary)',
                        marginTop: '2px'
                      }}
                    >
                      {book.author}
                    </p>
                  )}
                </div>
                
                {/* Quality Selector */}
                <select
                  value={book.minQuality}
                  onChange={(e) => onUpdateQuality(book.itemId, e.target.value as Quality)}
                  className="apple-select"
                  title="최소 등급 선택"
                >
                  {QUALITY_OPTIONS.map((q) => (
                    <option key={q} value={q}>
                      {q} 이상
                    </option>
                  ))}
                </select>
                
                {/* Remove Button */}
                <button
                  onClick={() => onRemoveBook(book.itemId)}
                  className="apple-button-link"
                  style={{ 
                    padding: '8px',
                    color: 'var(--color-text-tertiary)',
                    transition: 'color var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
                  title="삭제"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Divider */}
          <hr className="apple-divider mb-6" />

          {/* Analyze Button */}
          <button
            onClick={onAnalyze}
            disabled={books.length < 2 || isAnalyzing}
            className="apple-button apple-button-primary apple-button-large w-full"
            style={{ 
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-weight-semibold)'
            }}
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-3">
                <span className="apple-spinner" />
                분석 중...
              </span>
            ) : (
              `판매자 찾기`
            )}
          </button>
          
          {books.length < 2 && (
            <p 
              className="text-center mt-3"
              style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}
            >
              2권 이상 추가해야 분석할 수 있습니다
            </p>
          )}
        </>
      )}
    </div>
  );
}
