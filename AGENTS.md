<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->

---

## 나눗(Nanoot) 프로젝트 공통 개발 지침

### 기술 스택
- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Database: Supabase
- State: Zustand

### UI 공통 규칙
- max-width: 440px 모바일 프레임 유지
- 기존 `Button`, `Input` 컴포넌트 재사용
- 색상: 메인 컬러 `#84CC16` (초록)

### 스켈레톤 UI 규칙
모든 페이지에서 데이터 로딩 중일 때 반드시 스켈레톤 UI를 표시한다.

스켈레톤 기본 스타일:
- 배경색: `bg-gray-200`
- 애니메이션: `animate-pulse`
- 텍스트 영역: `rounded-md`
- 이미지 영역: `rounded-lg`

페이지별 스켈레톤 구성:
- 홈(공구 목록): 카드 3~4개 반복 (이미지 + 텍스트 라인)
- 공구 상세: 상단 이미지 + 텍스트 블록 + 버튼
- 내 공구 리스트: 카드 3개 반복
- 참여한 공구 상세: 이미지 + 타임라인 + 텍스트 블록
- 마이페이지: 프로필 원형 + 메뉴 리스트 라인

### 로딩 스피너 규칙
데이터 로딩이 아닌 액션(버튼 클릭, 폼 제출 등) 처리 중일 때 버튼 내부에 스피너를 표시한다.

스피너 기본 스타일:
- 크기: `w-4 h-4`
- 색상: 버튼 텍스트 색상과 동일
- 애니메이션: `animate-spin`
- 위치: 버튼 텍스트 왼쪽

스피너 적용 기준:
- 로그인/회원가입 버튼 클릭 시
- 공구 참여하기 버튼 클릭 시
- 수량 수정하기 버튼 클릭 시
- 수령 완료 버튼 클릭 시
- 어드민 상태 변경 버튼 클릭 시
- 공구 등록/수정 저장 버튼 클릭 시

### 에러 처리 규칙
- 데이터 로딩 실패 시 "다시 시도" 버튼 표시
- 빈 데이터 시 빈 상태(empty state) UI 표시

### 코드 규칙
- 새 파일 작업 전 항상 기존 컴포넌트 재사용 여부 확인
- Supabase 쿼리는 server component에서 처리
- 클라이언트 상태는 Zustand로 관리
- 작업 완료 후 항상 `git push`까지 완료

