# 05. Study Guide

이 문서는 현재 `mini_redis` 코드를 빠르게 이해하고 설명 가능 상태까지 가기 위한 학습 가이드입니다.

## 1) 학습 목표

- Mini Redis 핵심 로직(`set/get/del/expire/ttl/invalidate`)을 코드로 설명할 수 있다.
- API 요청이 어떤 내부 메서드를 타는지 흐름을 설명할 수 있다.
- 캐시 사용 전/후 성능 차이의 이유를 지표와 함께 설명할 수 있다.

## 2) 권장 학습 순서

### Step 1. 전체 맥락 파악 (20분)

읽을 파일:
- `README.md`
- `docs/01-product-planning.md`
- `docs/02-architecture.md`

확인 포인트:
- 왜 Mini Redis를 직접 구현했는가?
- 어떤 기능이 MVP 범위인가?
- 성능 비교는 어떤 시나리오로 측정했는가?

### Step 2. 서버 진입 흐름 이해 (25분)

읽을 파일:
- `src/server.ts`
- `src/app.ts`

확인 포인트:
- 서버가 어디서 시작되는가?
- 각 라우트가 어떤 store 메서드를 호출하는가?
- 에러 응답 포맷(`INVALID_INPUT`, `KEY_NOT_FOUND`)은 어떻게 통일되는가?

### Step 3. 핵심 엔진 정복 (40분)

읽을 파일:
- `src/lib/mini-redis/store.ts`

핵심 개념:
- 저장 구조: `Map<string, { value, expiresAt }>`
- TTL 규칙:
  - `-2`: 키 없음/만료됨
  - `-1`: 만료 시간 없음
  - `>=0`: 남은 초
- 만료 전략:
  - Lazy expiration: 조회 시 만료 검사
  - Active cleanup: 주기적으로 만료 키 정리

자기 점검 질문:
- `get()`에서 만료 키를 왜 즉시 삭제하는가?
- `ttl()`이 `Math.ceil`을 쓰는 이유는 무엇인가?
- `invalidatePrefix()`는 어떤 상황에서 유용한가?

### Step 4. 테스트로 역추적 (35분)

읽을 파일:
- `tests/store.test.ts`
- `tests/api.test.ts`

확인 포인트:
- 어떤 요구사항이 테스트로 보장되는가?
- 만료/미존재/정상 흐름이 모두 커버되는가?
- API 테스트에서 통합적으로 검증되는 경계는 어디까지인가?

실행:

```bash
npm test
```

### Step 5. 성능 측정 코드 이해 (30분)

읽을 파일:
- `scripts/benchmark.ts`
- `src/services/slow-data.ts`

확인 포인트:
- no-cache vs with-cache 차이는 어디서 발생하는가?
- 워밍업/요청수/동시성은 어떻게 설정되는가?
- avg, p95, req/s 계산 방식은 무엇인가?

실행:

```bash
npm run benchmark
```

## 3) 실습 과제 (핵심 이해 강화)

### 실습 A. TTL 체감

1. `POST /redis/set`으로 `ttlSeconds=3` 설정
2. 즉시 `GET /redis/get` 호출
3. 4초 뒤 다시 호출
4. 결과가 404로 바뀌는지 확인

### 실습 B. Invalidate 체감

1. `user:1`, `user:2`, `post:1` 저장
2. `/redis/invalidate`에 `prefix=user:` 전달
3. user 키만 삭제되는지 확인

### 실습 C. 성능 체감

1. `/demo/no-cache?id=bench` 반복 호출
2. `/demo/with-cache?id=bench` 반복 호출
3. 응답 지연과 `cacheHit` 필드 비교

## 4) 1일 학습 루틴 예시 (2.5~3시간)

- 0:00~0:20 문서(README + architecture) 읽기
- 0:20~0:45 `server.ts`/`app.ts` 흐름 분석
- 0:45~1:25 `store.ts` 깊게 이해 + 메서드별 요약 작성
- 1:25~1:45 테스트 코드 읽고 `npm test` 실행
- 1:45~2:10 벤치마크 실행 + 수치 해석
- 2:10~2:40 API 직접 호출 실습(TTL, invalidate, demo)
- 2:40~3:00 발표 4분 스크립트 리허설

## 5) 발표 대비 체크리스트

- 왜 해시 테이블(Map)을 선택했는지 설명 가능
- TTL 값 `-2/-1/양수` 의미를 설명 가능
- Lazy expiration과 Active cleanup 차이를 설명 가능
- no-cache vs with-cache 성능 차이 원인을 코드 기반으로 설명 가능
- 테스트가 어떤 실패를 방지하는지 말할 수 있음

## 6) 다음 확장 학습 주제

- 영속성 추가(AOF/RDB 유사 방식)
- eviction 정책(LRU/LFU) 추가
- 멀티 인스턴스 환경에서의 동기화/일관성 전략
- RESP 프로토콜 서버 구현으로 Redis 클라이언트 호환
