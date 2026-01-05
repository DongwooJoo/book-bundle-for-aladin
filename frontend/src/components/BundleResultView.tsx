import type { BundleResult } from '../types';

interface BundleResultViewProps {
  result: BundleResult;
  onClose: () => void;
}

export function BundleResultView({ result, onClose }: BundleResultViewProps) {
  const { sellers, totalRequestedCount, hasCompleteSeller, analysisTimeMs } = result;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          분석 결과
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>

      {/* 요약 정보 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{totalRequestedCount}권</p>
          <p className="text-sm text-blue-600">검색한 책</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{sellers.length}명</p>
          <p className="text-sm text-green-600">발견된 판매자</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">
            {(analysisTimeMs / 1000).toFixed(1)}초
          </p>
          <p className="text-sm text-amber-600">분석 시간</p>
        </div>
      </div>

      {/* 완벽한 판매자 알림 */}
      {hasCompleteSeller && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
          <p className="font-bold text-green-700 flex items-center gap-2">
            <span className="text-xl">🎉</span>
            모든 책을 한 판매자에게서 구매할 수 있습니다!
          </p>
          <p className="text-sm text-green-600 mt-1">
            배송비를 1회만 내면 됩니다.
          </p>
        </div>
      )}

      {/* 판매자 목록 */}
      {sellers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <span className="text-4xl mb-2 block">😢</span>
          <p>조건에 맞는 판매자를 찾지 못했습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sellers.map((seller, index) => {
            const coveragePercent = Math.round(
              (seller.totalBookCount / totalRequestedCount) * 100
            );
            const isComplete = seller.totalBookCount === totalRequestedCount;

            return (
              <div
                key={seller.sellerCode}
                className={`p-5 rounded-xl border-2 transition-all ${
                  isComplete
                    ? 'border-green-300 bg-green-50/50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {/* 판매자 헤더 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                      index === 0 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        {seller.sellerName}
                        {isComplete && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            ✨ 완벽!
                          </span>
                        )}
                      </h3>
                      {seller.sellerType && (
                        <span className="text-xs text-gray-500">{seller.sellerType}</span>
                      )}
                    </div>
                  </div>
                  
                  <a
                    href={seller.shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    상점 바로가기 →
                  </a>
                </div>

                {/* 보유 현황 바 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      보유: {seller.totalBookCount}/{totalRequestedCount}권
                    </span>
                    <span className={`font-medium ${
                      isComplete ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {coveragePercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isComplete ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${coveragePercent}%` }}
                    />
                  </div>
                </div>

                {/* 보유 책 목록 */}
                <div className="space-y-2">
                  {seller.books.map((book) => (
                    <div
                      key={book.itemId}
                      className="flex items-center justify-between text-sm p-2 bg-white rounded-lg"
                    >
                      <span className="text-gray-700 truncate flex-1">
                        ✅ {book.title}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {book.quality && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {book.quality}
                          </span>
                        )}
                        {book.price !== undefined && book.price > 0 && (
                          <span className="font-medium text-gray-800">
                            {book.price.toLocaleString()}원
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 총 가격 */}
                {seller.totalPrice > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-gray-600">총 가격</span>
                    <span className="text-lg font-bold text-gray-800">
                      {seller.totalPrice.toLocaleString()}원
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

