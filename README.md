# SEO App

네이버 키워드 리서치 및 SEO 분석 도구.

## 기술 스택

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui
- Prisma (PostgreSQL)

## 시작하기

```bash
# 의존성 설치
npm install

# DB 마이그레이션
npx prisma generate

# 개발 서버
npm run dev
```

http://localhost:3000

## 환경변수

`.env.local` 파일에 아래 값 설정:

```
DATABASE_URL=postgresql://...
NAVER_AD_API_KEY=
NAVER_AD_SECRET_KEY=
NAVER_AD_CUSTOMER_ID=
```

## 주요 기능

- 키워드 리서치: 네이버 검색광고 API 기반 연관 키워드 확장, 검색량/경쟁도/CTR 분석
- 정렬/필터: 컬럼별 정렬, 경쟁도 필터링

## 디렉토리 구조

```
app/                  # Next.js App Router
├── (dashboard)/      # 대시보드 레이아웃 그룹
│   └── keywords/     # 키워드 리서치 페이지
├── api/              # Route Handlers
components/ui/        # shadcn/ui 공용 컴포넌트
services/             # 외부 API 클라이언트
lib/                  # Prisma 등 인프라 싱글턴
prisma/               # DB 스키마
```
