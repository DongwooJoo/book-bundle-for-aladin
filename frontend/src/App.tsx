import { useState, useEffect, useCallback } from 'react';
import { BookSearch, BookList, BundleResultView } from './components';
import type { BookItem, BundleResult, Quality } from './types';
import { analyzeBundle } from './api/bookApi';

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
          // Base64 디코딩 후 JSON 파싱
          const decodedData = decodeURIComponent(atob(encodedData));
          const parsedData = JSON.parse(decodedData) as ExtensionBookData[];
          
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            const convertedBooks = convertExtensionData(parsedData);
            setBooks(convertedBooks);
            setImportedFromExtension(true);
            
            // URL 정리 (해시와 파라미터 제거)
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

  // 페이지 로드 시 확장 데이터 확인 (URL 해시에서)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromExtension = urlParams.get('from') === 'extension';
    
    if (fromExtension) {
      // URL 해시에서 데이터 로드 시도
      loadExtensionDataFromHash();
    }
  }, [loadExtensionDataFromHash]);

  // 책 추가
  const handleAddBook = (book: BookItem) => {
    if (books.some((b) => b.itemId === book.itemId)) {
      return; // 이미 추가된 책
    }
    setBooks([...books, book]);
  };

  // 책 삭제
  const handleRemoveBook = (itemId: number) => {
    setBooks(books.filter((b) => b.itemId !== itemId));
  };

  // 등급 업데이트
  const handleUpdateQuality = (itemId: number, quality: Quality) => {
    setBooks(
      books.map((b) =>
        b.itemId === itemId ? { ...b, minQuality: quality } : b
      )
    );
  };

  // 북번들 분석
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

  // 결과 닫기
  const handleCloseResult = () => {
    setBundleResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <div>
              <h1 className="text-xl font-bold text-gray-800">북번들</h1>
              <p className="text-sm text-gray-500">
                알라딘 중고서점 판매자 묶음 찾기
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 확장에서 가져온 알림 */}
        {importedFromExtension && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-green-800 font-medium">
                알라딘 장바구니에서 {books.length}권의 책을 가져왔습니다!
              </p>
              <p className="text-green-600 text-sm">
                등급을 확인하고 &quot;판매자 찾기&quot; 버튼을 눌러주세요.
              </p>
            </div>
            <button
              onClick={() => setImportedFromExtension(false)}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* 설명 배너 */}
        {!importedFromExtension && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white">
            <h2 className="text-lg font-bold mb-2">💡 배송비를 아끼세요!</h2>
            <p className="text-blue-100 text-sm">
              여러 책을 한 판매자에게서 구매하면 배송비를 한 번만 내면 됩니다.
              <br />
              구매하고 싶은 책들을 검색해서 추가하고, 판매자 찾기 버튼을 눌러보세요.
            </p>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* 결과 표시 (있을 경우) */}
        {bundleResult && (
          <div className="mb-8">
            <BundleResultView result={bundleResult} onClose={handleCloseResult} />
          </div>
        )}

        {/* 2열 레이아웃 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 왼쪽: 책 검색 */}
          <BookSearch
            onAddBook={handleAddBook}
            selectedBookIds={books.map((b) => b.itemId)}
          />

          {/* 오른쪽: 책 목록 */}
          <BookList
            books={books}
            onRemoveBook={handleRemoveBook}
            onUpdateQuality={handleUpdateQuality}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-100 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-gray-400">
          <p>북번들 - 알라딘 중고서점 판매자 묶음 찾기 서비스</p>
          <p className="mt-1">이 서비스는 알라딘과 무관한 개인 프로젝트입니다.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
