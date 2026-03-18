# mini_redis

해시 테이블 기반 인메모리 Mini Redis를 구현하고, 동 성일 API에서 캐시 미사용 대비 사용능을 비교하는 프로젝트입니다.

## 프로젝트 소개

- 목표: Redis 핵심 동작(set/get/del/expire/ttl/invalidate)을 직접 구현
- 중점: TTL 만료 처리, 동시성 안정성(단일 이벤트 루프), API 제공
- 결과물: 동작 가능한 서버 + 테스트 + 성능 비교 지표

## 핵심 기능

- `POST /redis/set`: 키-값 저장(선택 TTL)
- `GET /redis/get`: 키 조회(만료 키는 자동 삭제)
- `DELETE /redis/del`: 키 삭제
- `POST /redis/expire`: TTL 설정
- `GET /redis/ttl`: TTL 조회(`-2/-1/초`)
- `POST /redis/invalidate`: prefix 기반 무효화
- `GET /demo/no-cache`, `GET /demo/with-cache`: 캐시 성능 비교

## 아키텍처 요약

- API 서버: Fastify
- 저장소 엔진: `Map<string, { value, expiresAt }>`
- 만료 전략:
  - Lazy expiration: 조회 시 만료 검사
  - Active cleanup: 주기적 만료 키 정리
- 비교 실험: 느린 데이터 소스를 캐시 유무로 분리 호출

## Quick Start

### 1) 설치

```bash
npm install
```

### 2) 개발 서버 실행

```bash
npm run dev
```

- Base URL: `http://localhost:3000`

### 3) 테스트

```bash
npm test
```

### 4) 성능 측정

```bash
npm run benchmark
```

## 성능 측정 조건

- 비교 대상: `GET /demo/no-cache?id=bench` vs `GET /demo/with-cache?id=bench`
- 워밍업: 20 요청
- 본측정: 300 요청
- 동시성: 30
- 수집 지표: 평균 응답시간(avg), p95, 처리량(req/s), 에러 수

## 성능 결과

`npm run benchmark` 실행 후 아래 표를 갱신합니다.


| Scenario   | avg(ms) | p95(ms) | req/s(avg) | errors |
| ---------- | ------- | ------- | ---------- | ------ |
| no-cache   | 96.51   | 114.90  | 309.22     | 0      |
| with-cache | 10.96   | 16.19   | 2669.14    | 0      |


## 데모 시나리오

1. `POST /redis/set`으로 키를 저장한다.
2. `GET /redis/get`과 `GET /redis/ttl`로 값/만료를 확인한다.
3. `GET /demo/no-cache`를 연속 호출해 지연을 확인한다.
4. `GET /demo/with-cache`를 연속 호출해 캐시 hit와 성능 개선을 확인한다.

## 프로젝트 구조

```text
mini_redis/
├─ src/
│  ├─ app.ts
│  ├─ server.ts
│  ├─ lib/mini-redis/store.ts
│  └─ services/slow-data.ts
├─ tests/
├─ scripts/benchmark.ts
├─ docs/
├─ AGENTS.md
└─ README.md
```

## 문서

- [Codex 작업 규칙](AGENTS.md)
- [기획](docs/01-product-planning.md)
- [아키텍처](docs/02-architecture.md)
- [API 명세](docs/03-api-reference.md)
- [개발 가이드](docs/04-development-guide.md)
- [학습 가이드](docs/05-study-guide.md)

## Known Limitations

- 영속성(AOF/RDB)이 없어 서버 재시작 시 데이터가 사라집니다.
- 단일 프로세스 기준 동작이며 분산 환경 동기화는 미구현입니다.

