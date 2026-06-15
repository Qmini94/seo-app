# 코딩 컨벤션

## 디렉토리 구조

```
app/                          # Next.js App Router (라우팅 + 페이지)
├── (그룹명)/                  # Route Group — URL에 미포함, layout 공유용
│   ├── layout.tsx            # 그룹 공용 레이아웃
│   └── 페이지명/
│       ├── page.tsx          # 페이지 컴포넌트
│       └── _components/      # 이 페이지 전용 컴포넌트 (co-location)
├── api/                      # Route Handlers (컨트롤러 — 비즈니스 로직 ZERO)

features/                     # 도메인 비즈니스 로직 (서비스 레이어)
├── keyword/                  # service, repository, schema, types
├── serp/
└── ...

infrastructure/               # 외부 연동 (게이트웨이 레이어)
├── naver/                    # 네이버 API 클라이언트
├── database/                 # Prisma 싱글턴
├── cache/
└── crawler/

shared/                       # 도메인 무관 공용
├── config/                   # 환경변수 검증
├── errors/                   # 커스텀 에러 클래스
├── types/                    # 공용 타입 (ApiResponse 등)
└── utils/

components/ui/                # 공용 UI 컴포넌트 (shadcn/ui)
lib/                          # shadcn/ui 유틸 (cn 함수)
```

## 컴포넌트 배치 규칙

- **이 페이지에서만 쓰는 컴포넌트** → `_components/` (페이지 옆 co-location)
- **여러 페이지에서 공용** → `components/` (프로젝트 루트)
- **shadcn/ui 컴포넌트** → `components/ui/` (수정하지 않음)

## 파일 네이밍

- 컴포넌트: `PascalCase.tsx` (KeywordSearch.tsx, KeywordResult.tsx)
- 비 컴포넌트: `camelCase.ts` 또는 `kebab-case.ts` (searchAd.ts, prisma.ts)
- 타입 파일: `*.types.ts`
- 스키마 파일: `*.schema.ts`
- 테스트 파일: `*.test.ts`

## 서버 vs 클라이언트 컴포넌트

- **기본은 서버 컴포넌트** (아무 선언 없으면 서버)
- `"use client"` — useState, useEffect, onClick 등 브라우저 인터랙션 필요할 때만
- 서버 컴포넌트에서 DB 조회, API 키 접근 가능
- 클라이언트 컴포넌트에서 process.env 접근 불가 (NEXT_PUBLIC_ 제외)

## API Route Handler 규칙

- `app/api/` 안에 배치
- 비즈니스 로직 최소화 — 파싱 → 서비스 호출 → 응답 포맷팅만
- 에러 응답 형식 통일: `{ error: "메시지" }` + 적절한 status code

## 스타일

- Tailwind CSS v4 사용
- shadcn/ui 컴포넌트 기반
- 인라인 style 금지 — className으로만
- 색상: shadcn 시맨틱 변수 사용 (text-muted-foreground, bg-destructive 등)

## TypeScript

- strict 모드
- `any` 최소화 — 외부 API 응답 파싱 등 불가피한 경우만
- interface보다 type 선호 (단, export되는 객체 형태는 interface도 허용)
- non-null assertion(`!`) — 환경변수 등 확실한 경우만

## 기타

- 포맷팅: Prettier 기본 설정
- 한글 주석 허용 (도메인 특성상 한글이 더 명확한 경우)
- console.log 커밋 금지 — 디버깅 후 제거
- 환경변수: `.env.local` (gitignore), `.env.example` (커밋)
