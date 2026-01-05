import { useState } from 'react';
import type { BookSearchResult, BookItem, Quality } from '../types';
import { searchBooks } from '../api/bookApi';

interface BookSearchProps {
  onAddBook: (book: BookItem) => void;
  selectedBookIds: number[];
  compact?: boolean;
}

export function BookSearch({ onAddBook, selectedBookIds, compact = false }: BookSearchProps) {
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
    } catch (err) {
      setError('검색에 실패했습니다. 서버 연결을 확인해주세요.');
      console.error(err);
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
                overflowY: 'auto'
              }}
            >
              <div className="p-2">
                <p className="text-caption px-3 py-2">
                  검색 결과 {searchResults.length}건
                </p>
                {searchResults.map((book) => (
                  <button
                    key={book.itemId}
                    onClick={() => {
                      handleAddBook(book);
                    }}
                    disabled={isSelected(book.itemId)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                    style={{
                      backgroundColor: isSelected(book.itemId) 
                        ? 'var(--color-background-tertiary)' 
                        : 'transparent',
                      opacity: isSelected(book.itemId) ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected(book.itemId)) {
                        e.currentTarget.style.backgroundColor = 'var(--color-background-tertiary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isSelected(book.itemId) 
                        ? 'var(--color-background-tertiary)' 
                        : 'transparent';
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
      {/* Main Search Box */}
      <div 
        className="rounded-2xl overflow-hidden transition-all"
        style={{
          backgroundColor: 'var(--color-background)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4">
          <svg 
            width="22" 
            height="22" 
            viewBox="0 0 22 22" 
            fill="none" 
            style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}
          >
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <line x1="15" y1="15" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="책 제목, 저자, ISBN으로 검색"
            className="flex-1"
            style={{
              fontSize: '18px',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary)'
            }}
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              style={{ 
                padding: '4px',
                color: 'var(--color-text-tertiary)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" fill="currentColor"/>
                <line x1="6" y1="6" x2="12" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="12" y1="6" x2="6" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Search Button */}
        <div className="px-4 pb-4">
          <button
            onClick={handleSearch}
            disabled={isLoading || !keyword.trim()}
            className="apple-button apple-button-primary w-full"
            style={{ 
              height: '48px',
              borderRadius: 'var(--radius-md)',
              fontSize: '16px',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="apple-spinner" />
                검색 중...
              </span>
            ) : (
              '책 검색'
            )}
          </button>
        </div>
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
          className="mt-4 rounded-2xl overflow-hidden"
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
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {searchResults.map((book) => (
              <div
                key={book.itemId}
                className="flex items-center gap-4 p-4 border-b transition-colors"
                style={{ 
                  borderColor: 'var(--color-border)',
                  backgroundColor: isSelected(book.itemId) 
                    ? 'var(--color-background-tertiary)' 
                    : 'transparent'
                }}
              >
                {/* Book Cover */}
                <div 
                  style={{
                    width: '50px',
                    height: '66px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-background-tertiary)',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
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
                <div className="flex-1 min-w-0">
                  <h3 
                    className="truncate"
                    style={{ 
                      fontSize: '15px',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    {book.title}
                  </h3>
                  <p 
                    className="truncate mt-0.5"
                    style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}
                  >
                    {book.author}{book.publisher && ` · ${book.publisher}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {book.priceStandard && (
                      <span className="apple-tag" style={{ fontSize: '11px' }}>
                        정가 {book.priceStandard.toLocaleString()}원
                      </span>
                    )}
                    {book.usedCount !== undefined && book.usedCount > 0 && (
                      <span className="apple-tag apple-tag-green" style={{ fontSize: '11px' }}>
                        중고 {book.usedCount}개
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Add Button */}
                <button
                  onClick={() => handleAddBook(book)}
                  disabled={isSelected(book.itemId)}
                  className="apple-button apple-button-small"
                  style={{
                    backgroundColor: isSelected(book.itemId) 
                      ? 'var(--color-background-tertiary)' 
                      : 'var(--color-blue)',
                    color: isSelected(book.itemId) 
                      ? 'var(--color-text-tertiary)' 
                      : 'white',
                    flexShrink: 0
                  }}
                >
                  {isSelected(book.itemId) ? '추가됨' : '+ 추가'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
