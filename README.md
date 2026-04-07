# Jeju Family Trip Planner

Next.js(App Router) + Firebase + Kakao Maps 기반 가족 여행 일정 관리 앱입니다.

## 로컬 실행

사전 준비:
- Node.js 20+
- Firebase 프로젝트
- Kakao Maps JavaScript API Key

1) 의존성 설치

```bash
npm install
```

2) 환경변수 파일 생성

`.env.example`를 참고해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.example .env.local
```

필수 값은 아래 문서에 있는 값을 사용하세요.
- Firebase 값: `C:\\dev\\firebase_api.md`
- Kakao 값: `C:\\dev\\kakao_maps_api.md`

주의:
- 민감한 키/설정은 코드나 JSON 파일에 하드코딩하지 않습니다.
- Kakao 키는 Developers 콘솔에서 `http://localhost:3000` 및 운영 도메인을 등록해야 동작합니다.

3) 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

## 주요 기술 스택
- Next.js 15 (App Router, TypeScript)
- Firebase Auth / Firestore
- react-kakao-maps-sdk
- Zustand
- @hello-pangea/dnd

## 데이터 모델
- `trips`
  - `title`, `startDate`, `endDate`, `totalBudget`, `ownerId`
- `trips/{tripId}/days`
  - `dayNumber`, `date`
- `trips/{tripId}/days/{dayId}/places`
  - `name`, `memo`, `cost`, `order`, `location`, `tags`, `externalLinks`, `routeNote`
