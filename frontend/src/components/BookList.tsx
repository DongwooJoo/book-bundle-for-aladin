import type { BookItem, Quality } from '../types';

interface BookListProps {
  books: BookItem[];
  onRemoveBook: (itemId: number) => void;
  onUpdateQuality: (itemId: number, quality: Quality) => void;
  onUpdateAllQuality: (quality: Quality) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const QUALITY_OPTIONS: Quality[] = ['최상', '상', '중'];

export function BookList({ 
  books, 
  onRemoveBook, 
  onUpdateQuality,
  onUpdateAllQuality,
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
          {/* Bulk Quality Change Buttons */}
          <div 
            className="mb-4 p-3 flex items-center gap-3 flex-wrap"
            style={{ 
              backgroundColor: 'var(--color-background-secondary)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <span 
              style={{ 
                fontSize: '13px', 
                color: 'var(--color-text-secondary)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              전체 등급 변경
            </span>
            <div className="flex gap-2">
              {QUALITY_OPTIONS.map((quality) => (
                <button
                  key={quality}
                  onClick={() => onUpdateAllQuality(quality)}
                  className="apple-button apple-button-secondary apple-button-small"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '980px'
                  }}
                >
                  {quality} 이상
                </button>
              ))}
            </div>
          </div>

          {/* Book List */}
          <div className="space-y-2 mb-6">
            {books.map((book) => (
              <div
                key={book.itemId}
                className="flex items-center gap-3 p-3"
                style={{
                  backgroundColor: 'var(--color-background-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all var(--transition-fast)'
                }}
              >
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
                  className="remove-book-btn"
                  style={{ 
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-tertiary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--color-text-secondary)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.color = 'var(--color-text-tertiary)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="목록에서 삭제"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
              <span className="apple-spinner" />
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
