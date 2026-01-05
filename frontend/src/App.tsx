import { useState, useEffect, useCallback } from 'react';
import { BookSearch, BookList, BundleResultView } from './components';
import type { BookItem, BundleResult, Quality } from './types';
import { analyzeBundle } from './api/bookApi';
import './App.css';

// 확장에서 전달받은 책 데이터 타입
interface ExtensionBookData {
  itemId: number;
  title: string;
  quality: string;
  price: number;
  qty: number;
  cover: string;
  minQuality: string;
  productUrl: string;
}

function App() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [bundleResult, setBundleResult] = useState<BundleResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedFromExtension, setImportedFromExtension] = useState(false);
  const [showBookList, setShowBookList] = useState(false);
  const [addedBookAnimation, setAddedBookAnimation] = useState<{ id: number; title: string } | null>(null);

  // 컴팩트 모드: 책 목록 보기를 클릭했거나 결과가 있을 때
  const isCompactMode = showBookList || bundleResult !== null;

  // 확장에서 전달받은 데이터를 BookItem 형식으로 변환
  const convertExtensionData = useCallback((data: ExtensionBookData[]): BookItem[] => {
    return data.map((item) => ({
      itemId: item.itemId,
      title: item.title,
      cover: item.cover,
      priceStandard: item.price,
      minQuality: (item.minQuality || item.quality || '상') as Quality,
    }));
  }, []);

  // URL 해시에서 확장 데이터 로드
  const loadExtensionDataFromHash = useCallback(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('data=')) {
        const encodedData = hash.split('data=')[1];
        if (encodedData) {
          const decodedData = decodeURIComponent(atob(encodedData));
          const parsedData = JSON.parse(decodedData) as ExtensionBookData[];
          
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            const convertedBooks = convertExtensionData(parsedData);
            setBooks(convertedBooks);
            setImportedFromExtension(true);
            window.history.replaceState({}, '', window.location.pathname);
            console.log(`[북번들] 확장에서 ${convertedBooks.length}권의 책을 가져왔습니다.`);
            return true;
          }
        }
      }
      return false;
    } catch (err) {
      console.error('[북번들] 확장 데이터 로드 오류:', err);
      return false;
    }
  }, [convertExtensionData]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromExtension = urlParams.get('from') === 'extension';
    if (fromExtension) {
      loadExtensionDataFromHash();
    }
  }, [loadExtensionDataFromHash]);

  const handleAddBook = (book: BookItem) => {
    if (books.some((b) => b.itemId === book.itemId)) return;
    setBooks([...books, book]);
    
    // 책 추가 애니메이션
    setAddedBookAnimation({ id: book.itemId, title: book.title });
    setTimeout(() => setAddedBookAnimation(null), 1500);
  };

  const handleRemoveBook = (itemId: number) => {
    setBooks(books.filter((b) => b.itemId !== itemId));
  };

  const handleUpdateQuality = (itemId: number, quality: Quality) => {
    setBooks(books.map((b) => b.itemId === itemId ? { ...b, minQuality: quality } : b));
  };

  const handleAnalyze = async () => {
    if (books.length < 2) return;
    setIsAnalyzing(true);
    setError(null);
    setBundleResult(null);
    
    try {
      const result = await analyzeBundle({ books });
      setBundleResult(result);
    } catch (err) {
      setError('분석에 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloseResult = () => {
    setBundleResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Navigation */}
      <nav className="apple-nav border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="apple-container">
          <div className="apple-nav-inner">
            <a 
              href="/"
              className="flex items-center gap-3"
              style={{ textDecoration: 'none' }}
              onClick={(e) => {
                e.preventDefault();
                setBooks([]);
                setBundleResult(null);
                setError(null);
                setShowBookList(false);
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="5" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <rect x="9" y="3" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="var(--color-background)"/>
                <line x1="12" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="12" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="12" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span style={{ 
                fontSize: '21px', 
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: '-0.02em',
                color: 'var(--color-text-primary)'
              }}>
                북번들
              </span>
            </a>

            {/* Book basket button */}
            {books.length > 0 && (
              <button
                onClick={() => setShowBookList(true)}
                className="flex items-center gap-2"
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-blue)',
                  color: 'white',
                  borderRadius: '980px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4h2l2 9h8l2-7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <circle cx="7" cy="15" r="1" fill="currentColor"/>
                  <circle cx="13" cy="15" r="1" fill="currentColor"/>
                </svg>
                <span>내 책 목록 ({books.length})</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Book Added Animation Toast */}
      {addedBookAnimation && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            right: '24px',
            backgroundColor: 'var(--color-green)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'flyToCart 0.5s ease-out'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M6 10L9 13L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: 500 }}>책이 담겼습니다!</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {!isCompactMode ? (
          /* ============ INITIAL STATE: Google-like Search ============ */
          <div 
            className="flex flex-col items-center justify-center"
            style={{ minHeight: 'calc(100vh - 52px - 80px)' }}
          >
            <div className="w-full px-6 py-16 text-center" style={{ maxWidth: '720px' }}>
              {/* Logo & Title */}
              <div className="mb-8 animate-fadeInUp">
                <div 
                  className="inline-flex items-center justify-center mb-6"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    backgroundColor: 'var(--color-blue)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
                    <rect x="3" y="5" width="16" height="20" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
                    <rect x="9" y="3" width="16" height="20" rx="2" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.2)"/>
                    <line x1="12" y1="8" x2="22" y2="8" stroke="white" strokeWidth="1.5"/>
                    <line x1="12" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1.5"/>
                    <line x1="12" y1="16" x2="18" y2="16" stroke="white" strokeWidth="1.5"/>
                  </svg>
                </div>
                <h1 className="text-headline">북번들</h1>
                <p className="text-intro mt-3">
                  여러 책을 한 판매자에게서 구매하고 배송비를 아끼세요
                </p>
              </div>

              {/* Search Box */}
              <div className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                <BookSearch
                  onAddBook={handleAddBook}
                  selectedBookIds={books.map((b) => b.itemId)}
                  compact={false}
                />
              </div>

              {/* Tips */}
              <div 
                className="mt-12 animate-fadeInUp" 
                style={{ animationDelay: '0.2s' }}
              >
                <p className="text-caption mb-4">이렇게 사용하세요</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <span className="apple-tag">1. 책 검색 후 추가</span>
                  <span className="apple-tag">2. 2권 이상 모으기</span>
                  <span className="apple-tag">3. 판매자 찾기 클릭</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============ COMPACT STATE: Results View ============ */
          <div className="apple-container" style={{ paddingTop: '24px', paddingBottom: '80px' }}>
            {/* Compact Search */}
            <div className="mb-6">
              <BookSearch
                onAddBook={handleAddBook}
                selectedBookIds={books.map((b) => b.itemId)}
                compact={true}
              />
        </div>

            {/* Extension Import Notification */}
        {importedFromExtension && (
              <div 
                className="apple-notification apple-notification-success mb-6 animate-scaleIn"
              >
                <div 
                  className="apple-notification-icon"
                  style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
                >
                  ✓
                </div>
                <div className="flex-1">
                  <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                    장바구니에서 {books.length}권의 책을 가져왔습니다
                  </p>
                  <p className="text-caption mt-1">
                    등급을 확인하고 판매자 찾기를 시작하세요.
              </p>
            </div>
            <button
              onClick={() => setImportedFromExtension(false)}
                  className="apple-button apple-button-secondary apple-button-small"
            >
                  닫기
            </button>
          </div>
        )}

            {/* Error Message */}
            {error && (
              <div className="apple-notification apple-notification-error mb-6 animate-scaleIn">
                <div 
                  className="apple-notification-icon"
                  style={{ backgroundColor: 'var(--color-blue)', color: 'white' }}
                >
                  !
                </div>
                <div className="flex-1">
                  <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                    오류가 발생했습니다
                  </p>
                  <p className="text-caption mt-1">{error}</p>
          </div>
          </div>
        )}

            {/* Book List */}
            {books.length > 0 && !bundleResult && (
              <div className="mb-6 animate-fadeInUp">
          <BookList
            books={books}
            onRemoveBook={handleRemoveBook}
            onUpdateQuality={handleUpdateQuality}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        </div>
            )}

            {/* Bundle Result */}
            {bundleResult && (
              <div className="animate-fadeInUp">
                {/* Selected Books Summary */}
                <div 
                  className="mb-6 p-4 rounded-xl"
                  style={{ backgroundColor: 'var(--color-background-tertiary)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-primary)'
                    }}>
                      선택한 책 {books.length}권
                    </span>
                    <button
                      onClick={handleCloseResult}
                      className="apple-button apple-button-secondary apple-button-small"
                    >
                      다시 검색
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {books.map((book) => (
                      <span 
                        key={book.itemId}
                        className="apple-tag"
                        style={{ maxWidth: '200px' }}
                      >
                        <span className="truncate">{book.title}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <BundleResultView result={bundleResult} onClose={handleCloseResult} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="apple-footer">
        <div className="apple-container">
          <div className="apple-footer-content">
            <p className="text-caption">
              북번들 — 알라딘 중고서점 판매자 묶음 찾기 서비스
            </p>
            <p className="text-caption mt-1" style={{ fontSize: '12px' }}>
              이 서비스는 알라딘과 무관한 개인 프로젝트입니다.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
