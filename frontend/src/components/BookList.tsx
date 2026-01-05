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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">📦</span>
          내 책 목록
          {books.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-sm rounded-full">
              {books.length}권
            </span>
          )}
        </h2>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <span className="text-4xl mb-2 block">📚</span>
          <p>책을 검색해서 목록에 추가해주세요</p>
        </div>
      ) : (
        <>
          {/* 책 목록 */}
          <div className="space-y-3 mb-6">
            {books.map((book, index) => (
              <div
                key={book.itemId}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                {/* 번호 */}
                <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {index + 1}
                </span>
                
                {/* 책 표지 */}
                <div className="w-12 h-16 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                  {book.cover ? (
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      📚
                    </div>
                  )}
                </div>
                
                {/* 책 정보 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 truncate text-sm">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-xs text-gray-500 truncate">{book.author}</p>
                  )}
                </div>
                
                {/* 등급 필터 */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">최소 등급:</label>
                  <select
                    value={book.minQuality}
                    onChange={(e) => onUpdateQuality(book.itemId, e.target.value as Quality)}
                    className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {QUALITY_OPTIONS.map((q) => (
                      <option key={q} value={q}>
                        {q} 이상
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 삭제 버튼 */}
                <button
                  onClick={() => onRemoveBook(book.itemId)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* 분석 버튼 */}
          <button
            onClick={onAnalyze}
            disabled={books.length < 2 || isAnalyzing}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 disabled:shadow-none"
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                분석 중...
              </span>
            ) : (
              `🔍 판매자 찾기 (${books.length}권)`
            )}
          </button>
          
          {books.length < 2 && (
            <p className="text-center text-sm text-gray-400 mt-2">
              2권 이상 추가해야 분석할 수 있습니다
            </p>
          )}
        </>
      )}
    </div>
  );
}

