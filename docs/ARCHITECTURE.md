# 📚 북번들 (BookBundle) 아키텍처 문서

## 🎯 프로젝트 목적

**문제**: 알라딘 중고서점에서 여러 책을 구매할 때, 각 책이 서로 다른 판매자에게서 판매되어 **배송비가 여러 번 발생**

**해결**: 여러 책을 동시에 보유한 판매자를 찾아 **한 번에 구매** → 배송비 절약!

---

## 🏗️ 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│                        Chrome Extension                          │
│  (알라딘 장바구니에서 책 정보 추출 → Frontend로 전송)              │
└─────────────────────────────┬────────────────────────────────────┘
                              │ URL Hash (Base64 인코딩된 책 목록)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)                 │
│  - 책 검색 UI                                                    │
│  - 책 목록 관리 (등급 설정)                                       │
│  - 분석 결과 표시                                                 │
└─────────────────────────────┬────────────────────────────────────┘
                              │ REST API (POST /api/bundle/analyze)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Backend (Spring Boot + Jsoup)                   │
│  ┌──────────────┐    ┌──────────────────┐    ┌────────────────┐ │
│  │BookController│───▶│BookBundleService │───▶│AladinCrawler   │ │
│  │  (REST API)  │    │  (비즈니스 로직)  │    │Service(크롤링) │ │
│  └──────────────┘    └──────────────────┘    └────────────────┘ │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTML 크롤링 (Jsoup)
                              ▼
                    ┌────────────────────┐
                    │   알라딘 웹사이트    │
                    │ www.aladin.co.kr   │
                    └────────────────────┘
```

---

## 🛠️ 기술 스택

### Backend
- Java 21
- Spring Boot 3.2
- Jsoup (HTML 크롤링)
- Lombok
- Gradle

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS (커스텀 스타일 포함)

### Extension
- Chrome Manifest V3
- Vanilla JavaScript

---

## 📦 주요 컴포넌트

### 1. Backend (Spring Boot)

| 파일 | 역할 |
|------|------|
| `BookController.java` | REST API 엔드포인트 (`/api/books/search`, `/api/bundle/analyze`) |
| `BookBundleService.java` | 핵심 비즈니스 로직 - 판매자 교집합 분석, 검증 |
| `AladinCrawlerService.java` | 알라딘 웹 크롤링 - 책 검색, 판매자 조회, 책 보유 확인 |

**주요 DTO**:
| DTO | 설명 |
|-----|------|
| `BookItem` | 사용자가 선택한 책 (itemId, title, minQuality 등) |
| `BookSearchResult` | 책 검색 결과 |
| `SellerInfo` | 판매자 정보 (sellerCode, books[], totalPrice) |
| `BundleRequest` | 분석 요청 (books[]) |
| `BundleResult` | 분석 결과 (sellers[], analysisTimeMs) |

### 2. Frontend (React + TypeScript)

| 파일 | 역할 |
|------|------|
| `App.tsx` | 메인 컴포넌트 - 상태 관리, 확장 데이터 수신 |
| `BookSearch.tsx` | 책 검색 UI (검색창 + 결과 목록) |
| `BookList.tsx` | 선택된 책 목록 표시, 등급 설정 |
| `BundleResultView.tsx` | 분석 결과 - 판매자별 보유 책 표시 |
| `bookApi.ts` | API 호출 함수 |
| `types/index.ts` | TypeScript 타입 정의 |

### 3. Chrome Extension

| 파일 | 역할 |
|------|------|
| `content.js` | 알라딘 장바구니 페이지에서 책 정보 추출 |
| `popup.js` | 확장 팝업 UI 로직, Frontend로 데이터 전송 |
| `popup.html/css` | 확장 팝업 UI |
| `manifest.json` | 확장 설정 (Manifest V3) |

---

## 🔄 데이터 흐름

### 시나리오 1: 직접 검색

```
1. 사용자가 Frontend에서 책 검색
2. GET /api/books/search → AladinCrawlerService.searchBooks()
3. 검색 결과에서 책 선택 → books[] 상태에 추가
4. "판매자 찾기" 클릭 → POST /api/bundle/analyze
5. BookBundleService.analyzeBundle() 실행
6. 결과 표시
```

### 시나리오 2: 장바구니 연동 (확장)

```
1. 사용자가 알라딘 장바구니 방문
2. Chrome Extension 클릭 → content.js가 책 정보 추출
3. "북번들로 전송" 클릭 → URL Hash에 Base64 인코딩된 데이터 포함
4. Frontend가 URL에서 데이터 파싱 → books[] 상태에 로드
5. 이후 동일
```

---

## 🔍 핵심 알고리즘: `analyzeBundle()`

```
Phase 1: 각 책별 판매자 수집
─────────────────────────────
for (각 책) {
    원본 책 ID 추출 (getOriginalItemId)
    해당 책의 판매자 목록 조회 (getSellersByItemId)
    → bookSellersMap[책ID] = [판매자 목록]
}

Phase 2: 판매자별 교집합 분석
─────────────────────────────
for (각 책의 판매자) {
    sellerBundleMap[판매자코드].books.add(책)
}
→ 2권 이상 보유 판매자만 필터링

Phase 3: 판매자별 상세 검증
─────────────────────────────
for (후보 판매자 상위 30명) {
    for (모든 요청된 책) {
        판매자 상점에서 책 검색 (checkSellerHasBook)
        가격, 등급 정보 수집
    }
}

Phase 4: 결과 정렬 및 반환
─────────────────────────────
보유 권수 내림차순 → 총 가격 오름차순 정렬
상위 20명 반환
```

---

## 🔧 API 엔드포인트

| Method | Endpoint | 설명 | 요청 | 응답 |
|--------|----------|------|------|------|
| GET | `/api/books/search` | 책 검색 | `?keyword=클린코드` | `BookSearchResult[]` |
| POST | `/api/bundle/analyze` | 북번들 분석 | `BundleRequest` | `BundleResult` |
| GET | `/api/health` | 헬스 체크 | - | `"OK"` |

---

## ⚙️ 설정

### application.yml

```yaml
server:
  port: 8080

aladin:
  base-url: https://www.aladin.co.kr
  request-delay-ms: 500  # 요청 간격 (서버 부하 방지)
  user-agent: "Mozilla/5.0 ..."

cors:
  allowed-origins: http://localhost:5173
```

---

## 🚧 알려진 성능 이슈

| 문제 | 원인 | 해결 방안 |
|------|------|----------|
| 조회 시간 ~10분 (20권 기준) | 순차적 HTTP 요청 + 500ms 딜레이 | CompletableFuture 병렬 처리 |
| 불필요한 요청 | Phase 2에서 Phase 1 결과 미활용 | 스마트 필터링 |
| 타임아웃 | 단일 스레드 블로킹 | 비동기 처리 + 타임아웃 개선 |

### 개선 예정 사항

1. **병렬 처리 (CompletableFuture)**: 5-10배 성능 개선 예상
2. **Phase 2 스마트 필터링**: Phase 1에서 없는 것으로 확인된 책 스킵
3. **후보 판매자 수 조정**: 30명 → 15명
4. **캐싱**: 판매자 상점 페이지 캐싱

---

## 📂 디렉토리 구조

```
book-bundle-for-aladin/
├── backend/                     # Spring Boot 백엔드
│   ├── src/main/java/com/bookbundle/
│   │   ├── controller/          # REST API
│   │   │   └── BookController.java
│   │   ├── service/             # 비즈니스 로직
│   │   │   └── BookBundleService.java
│   │   ├── crawler/             # 알라딘 크롤링
│   │   │   └── AladinCrawlerService.java
│   │   ├── dto/                 # 데이터 객체
│   │   │   ├── BookItem.java
│   │   │   ├── BookSearchResult.java
│   │   │   ├── BundleRequest.java
│   │   │   ├── BundleResult.java
│   │   │   └── SellerInfo.java
│   │   └── config/              # CORS 등 설정
│   │       └── CorsConfig.java
│   ├── src/main/resources/
│   │   └── application.yml
│   └── build.gradle
│
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/          # UI 컴포넌트
│   │   │   ├── BookSearch.tsx
│   │   │   ├── BookList.tsx
│   │   │   ├── BundleResultView.tsx
│   │   │   └── index.ts
│   │   ├── api/                 # API 호출
│   │   │   └── bookApi.ts
│   │   ├── types/               # TypeScript 타입 정의
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── extension/                   # Chrome 확장
│   ├── content.js               # 장바구니 크롤링
│   ├── popup.html               # 확장 팝업 UI
│   ├── popup.js                 # 확장 팝업 로직
│   ├── popup.css                # 확장 팝업 스타일
│   ├── manifest.json            # 확장 설정 (Manifest V3)
│   ├── icons/                   # 확장 아이콘
│   └── README.md
│
├── docs/                        # 문서
│   ├── ARCHITECTURE.md          # 이 문서
│   └── 알라딘 Open API 매뉴얼.md
│
└── README.md
```

---

## 🚀 실행 방법

### Backend
```bash
cd backend
./gradlew bootRun
# http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### Extension
1. Chrome에서 `chrome://extensions/` 접속
2. 개발자 모드 활성화
3. "압축 해제된 확장 프로그램을 로드합니다" 클릭
4. `extension` 폴더 선택

---

## ⚠️ 주의사항

- 이 서비스는 알라딘 웹사이트를 크롤링하여 정보를 수집합니다
- 알라딘 서버 부하를 고려하여 요청 간격을 500ms로 설정했습니다
- 이 서비스는 알라딘과 무관한 개인 프로젝트입니다

---

*마지막 업데이트: 2026-01-06*

