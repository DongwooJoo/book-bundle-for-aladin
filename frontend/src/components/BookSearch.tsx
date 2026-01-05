import { useState } from 'react';
import type { BookSearchResult, BookItem, Quality } from '../types';
import { searchBooks } from '../api/bookApi';

interface BookSearchProps {
  onAddBook: (book: BookItem) => void;
  selectedBookIds: number[];
}

export function BookSearch({ onAddBook, selectedBookIds }: BookSearchProps) {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchBooks(keyword);
      setSearchResults(results);
    } catch (err) {
      setError('검색에 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🔍</span>
        책 검색
      </h2>
      
      {/* 검색 입력 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="책 제목을 입력하세요"
          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !keyword.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '검색 중...' : '검색'}
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-2">
            검색 결과: {searchResults.length}건
          </p>
          {searchResults.map((book) => (
            <div
              key={book.itemId}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                isSelected(book.itemId)
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              {/* 책 표지 */}
              <div className="w-16 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                {book.cover ? (
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    📚
                  </div>
                )}
              </div>
              
              {/* 책 정보 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-800 truncate">{book.title}</h3>
                <p className="text-sm text-gray-500 truncate">
                  {book.author} {book.publisher && `| ${book.publisher}`}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {book.priceStandard && (
                    <span className="text-sm text-gray-400">
                      정가 {book.priceStandard.toLocaleString()}원
                    </span>
                  )}
                  {book.usedCount !== undefined && book.usedCount > 0 && (
                    <span className="text-sm text-green-600">
                      중고 {book.usedCount}개
                    </span>
                  )}
                </div>
              </div>
              
              {/* 추가 버튼 */}
              <button
                onClick={() => handleAddBook(book)}
                disabled={isSelected(book.itemId)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSelected(book.itemId)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {isSelected(book.itemId) ? '추가됨' : '+ 추가'}
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* 빈 상태 */}
      {searchResults.length === 0 && !isLoading && !error && (
        <div className="text-center py-8 text-gray-400">
          <span className="text-4xl mb-2 block">📖</span>
          <p>책 제목을 검색해서 목록에 추가하세요</p>
        </div>
      )}
    </div>
  );
}

