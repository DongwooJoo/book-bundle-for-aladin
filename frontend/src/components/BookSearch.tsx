import { useState } from 'react';
import type { BookSearchResult, BookItem, Quality } from '../types';
import { searchBooks } from '../api/bookApi';

interface BookSearchProps {
  onAddBook: (book: BookItem) => void;
  selectedBookIds: number[];
  compact?: boolean;
  onSearchStateChange?: (hasResults: boolean) => void;
}

export function BookSearch({ onAddBook, selectedBookIds, compact = false, onSearchStateChange }: BookSearchProps) {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchBooks(keyword);
      setSearchResults(results);
      setShowResults(true);
      onSearchStateChange?.(results.length > 0);
    } catch (err) {
      setError('검색에 실패했습니다. 서버 연결을 확인해주세요.');
      console.error(err);
      onSearchStateChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddBook = (book: BookSearchResult) => {
    const bookItem: BookItem = {
      itemId: book.itemId,
      isbn13: book.isbn13,
      title: book.title,
      author: book.author,
      cover: book.cover,
      priceStandard: book.priceStandard,
      minQuality: '중' as Quality,
    };
    onAddBook(bookItem);
  };

  const isSelected = (itemId: number) => selectedBookIds.includes(itemId);

  // ============ COMPACT MODE ============
  if (compact) {
    return (
      <div className="relative">
        {/* Compact Search Bar - Minimal */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="책 추가..."
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                fontSize: '15px',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '980px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-blue)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 113, 227, 0.1)';
                if (searchResults.length > 0) setShowResults(true);
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
              }}
            />
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none" 
              style={{ 
                position: 'absolute', 
                left: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--color-text-tertiary)'
              }}
            >
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading || !keyword.trim()}
            style={{
              padding: '10px 20px',
              fontSize: '15px',
              fontWeight: 500,
              backgroundColor: 'var(--color-blue)',
              color: 'white',
              border: 'none',
              borderRadius: '980px',
              cursor: 'pointer',
              opacity: (!keyword.trim() || isLoading) ? 0.4 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {isLoading ? '...' : '검색'}
          </button>
        </div>

        {/* Dropdown Results */}
        {showResults && searchResults.length > 0 && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setShowResults(false)}
            />
            
            {/* Results Dropdown */}
            <div 
              className="absolute left-0 right-0 mt-2 z-20 rounded-xl overflow-hidden animate-scaleIn"
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                maxHeight: '400px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Fixed Header */}
              <div 
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  flexShrink: 0
                }}
              >
                <p className="text-caption" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                  검색 결과 {searchResults.length}건
                </p>
                <button
                  onClick={() => setShowResults(false)}
                  aria-label="검색 결과 닫기"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'var(--color-background-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-text-tertiary)';
                    const svg = e.currentTarget.querySelector('svg');
                    if (svg) svg.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background-tertiary)';
                    const svg = e.currentTarget.querySelector('svg');
                    if (svg) svg.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 12 12" 
                    fill="none"
                    style={{ color: 'var(--color-text-secondary)', transition: 'color 0.15s ease' }}
                  >
                    <path 
                      d="M2 2L10 10M10 2L2 10" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Scrollable Results */}
              <div className="p-2" style={{ overflowY: 'auto', flex: 1 }}>
                {searchResults.map((book) => (
                  <button
                    key={book.itemId}
                    onClick={() => {
                      handleAddBook(book);
                    }}
                    disabled={isSelected(book.itemId)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left"
                    style={{
                      backgroundColor: isSelected(book.itemId) 
                        ? 'var(--color-background-tertiary)' 
                        : 'transparent',
                      opacity: isSelected(book.itemId) ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      transform: 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected(book.itemId)) {
                        e.currentTarget.style.backgroundColor = 'var(--color-background-tertiary)';
                        e.currentTarget.style.transform = 'scale(1.01)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isSelected(book.itemId) 
                        ? 'var(--color-background-tertiary)' 
                        : 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Cover */}
                    <div 
                      style={{
                        width: '40px',
                        height: '52px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        backgroundColor: 'var(--color-background-tertiary)',
                        flexShrink: 0
                      }}
                    >
                      {book.cover && <img src={book.cover} alt="" className="w-full h-full object-cover" />}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p 
                        className="truncate"
                        style={{ 
                          fontSize: '14px', 
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        {book.title}
                      </p>
                      <p 
                        className="truncate"
                        style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}
                      >
                        {book.author}
                      </p>
                    </div>
                    
                    {/* Status */}
                    {isSelected(book.itemId) ? (
                      <span className="apple-tag" style={{ fontSize: '11px' }}>추가됨</span>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--color-text-primary)' }}>
                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <line x1="10" y1="6" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <p className="text-center mt-3" style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  // ============ FULL MODE (Google-like) ============
  return (
    <div className="w-full">
      {/* Main Search Box - Google Style */}
      <div 
        className="flex items-center gap-3 px-5 py-4 rounded-full transition-all"
        style={{
          backgroundColor: 'var(--color-background)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.borderColor = 'transparent';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
      >
        {/* Search Icon / Loading */}
        {isLoading ? (
          <div className="apple-spinner apple-spinner-dark" style={{ width: '20px', height: '20px', flexShrink: 0 }} />
        ) : (
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <line x1="13.5" y1="13.5" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
        
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="책 제목, 저자, ISBN으로 검색 후 Enter"
          className="flex-1"
          style={{
            fontSize: '16px',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)'
          }}
        />
        
        {/* Clear Button - Always rendered to prevent layout shift */}
        <button
          onClick={() => setKeyword('')}
          style={{ 
            padding: '4px',
            color: 'var(--color-text-tertiary)',
            transition: 'all 0.15s ease',
            opacity: keyword && !isLoading ? 1 : 0,
            pointerEvents: keyword && !isLoading ? 'auto' : 'none',
            flexShrink: 0
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" fill="currentColor"/>
            <line x1="6" y1="6" x2="12" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="6" x2="6" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="mt-4 p-4 rounded-xl text-center"
          style={{ 
            backgroundColor: 'var(--color-background-tertiary)',
            color: 'var(--color-text-secondary)'
          }}
        >
          {error}
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div 
          className="mt-4 mb-4 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--color-background)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <p style={{ 
              fontSize: '14px',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-secondary)'
            }}>
              검색 결과 {searchResults.length}건
            </p>
          </div>
          
          <div>
            {searchResults.map((book) => (
              <div
                key={book.itemId}
                onClick={() => !isSelected(book.itemId) && handleAddBook(book)}
                className="flex items-center gap-4 p-4 border-b"
                style={{ 
                  borderColor: 'var(--color-border)',
                  backgroundColor: isSelected(book.itemId) 
                    ? 'var(--color-background-tertiary)' 
                    : 'transparent',
                  cursor: isSelected(book.itemId) ? 'default' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected(book.itemId)) {
                    e.currentTarget.style.transform = 'scale(1.01)';
                    e.currentTarget.style.backgroundColor = 'var(--color-background-secondary)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = isSelected(book.itemId) 
                    ? 'var(--color-background-tertiary)' 
                    : 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Book Cover */}
                <div 
                  style={{
                    width: '56px',
                    height: '74px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-background-tertiary)',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {book.cover ? (
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--color-text-tertiary)' }}>
                      📚
                    </div>
                  )}
                </div>
                
                {/* Book Info */}
                <div className="flex-1 min-w-0 flex items-center">
                  <div className="flex-1 min-w-0">
                    <h3 
                      style={{ 
                        fontSize: '16px',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text-primary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.4'
                      }}
                    >
                      {book.title}
                    </h3>
                    <p 
                      className="truncate mt-1"
                      style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}
                    >
                      {book.author}{book.publisher && ` · ${book.publisher}`}
                    </p>
                    {book.priceStandard && (
                      <p 
                        className="mt-1"
                        style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}
                      >
                        정가 {book.priceStandard.toLocaleString()}원
                      </p>
                    )}
                  </div>
                  
                  {/* 중고 개수 - 세로 가운데 배치 */}
                  {book.usedCount !== undefined && book.usedCount > 0 && (
                    <div 
                      className="flex flex-col items-center justify-center ml-3"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(52, 199, 89, 0.1)',
                        flexShrink: 0
                      }}
                    >
                      <span style={{ 
                        fontSize: '18px', 
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-green)',
                        lineHeight: 1
                      }}>
                        {book.usedCount}
                      </span>
                      <span style={{ 
                        fontSize: '11px', 
                        color: 'var(--color-green)',
                        marginTop: '2px'
                      }}>
                        중고
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Status Indicator */}
                <div style={{ flexShrink: 0 }}>
                  {isSelected(book.itemId) ? (
                    <div 
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-green)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ) : (
                    <div 
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <line x1="7" y1="3" x2="7" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="3" y1="7" x2="11" y2="7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
