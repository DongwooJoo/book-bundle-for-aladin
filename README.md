# 📚 북번들 (BookBundle)

알라딘 온라인 중고서점에서 여러 책을 한 판매자에게 일괄 구매하여 배송비를 절약할 수 있도록, 장바구니 책들을 함께 파는 판매자를 찾아주는 서비스입니다.

## 🎯 문제 해결

**문제**: 알라딘 중고서점에서 책을 구매할 때, 각 책이 서로 다른 판매자에게서 판매되어 배송비가 여러 번 발생

**해결**: 여러 책을 동시에 보유한 판매자를 찾아 한 번에 구매 → 배송비 절약!

## 🛠️ 기술 스택

### Backend
- Java 21
- Spring Boot 3.2
- Jsoup (HTML 크롤링)
- Gradle

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS

## 🚀 실행 방법

### 1. Backend 실행

```bash
cd backend
./gradlew bootRun
```

서버가 `http://localhost:8080`에서 실행됩니다.

### 2. Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173`을 열어주세요.

## 📖 사용 방법

1. **책 검색**: 구매하고 싶은 책의 제목을 검색합니다
2. **책 추가**: 검색 결과에서 원하는 책을 목록에 추가합니다
3. **등급 설정**: 각 책마다 원하는 최소 등급(최상/상/중/하)을 설정합니다
4. **판매자 찾기**: 버튼을 클릭하면 여러 책을 보유한 판매자를 분석합니다
5. **결과 확인**: 보유 권수가 많은 순으로 판매자 목록이 표시됩니다

## 📁 프로젝트 구조

```
book-bundle-for-aladin/
├── backend/                    # Spring Boot 백엔드
│   ├── src/main/java/com/bookbundle/
│   │   ├── controller/         # REST API 컨트롤러
│   │   ├── service/            # 비즈니스 로직
│   │   ├── crawler/            # 알라딘 크롤링
│   │   ├── dto/                # 데이터 객체
│   │   └── config/             # 설정
│   └── build.gradle
│
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── components/         # React 컴포넌트
│   │   ├── api/                # API 호출
│   │   └── types/              # TypeScript 타입
│   └── package.json
│
└── docs/                       # 문서
    └── 알라딘 Open API 매뉴얼.md
```

## 🔧 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/books/search?keyword={검색어}` | 책 검색 |
| POST | `/api/bundle/analyze` | 북번들 분석 |
| GET | `/api/health` | 헬스 체크 |

## ⚠️ 주의사항

- 이 서비스는 알라딘 웹사이트를 크롤링하여 정보를 수집합니다
- 알라딘 서버 부하를 고려하여 요청 간격을 500ms로 설정했습니다
- 이 서비스는 알라딘과 무관한 개인 프로젝트입니다

## 📝 라이선스

MIT License

