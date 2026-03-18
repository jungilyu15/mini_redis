# 04. Development Guide

## 1) 브랜치 전략

- `feature/<name>`
- `fix/<name>`
- `docs/<name>`
- `test/<name>`
- `chore/<name>`

권장 단위:
- 엔진 로직
- API 계약
- 테스트
- 문서

## 2) 커밋 규칙

```text
<type>: <subject>
```

예시:
- `feat: add ttl support to mini redis store`
- `test: add expiration integration tests`
- `docs: update benchmark section in readme`

## 3) 구현 순서

1. Node/TypeScript 서버 부트스트랩
2. `MiniRedisStore` 핵심 로직(set/get/del/expire/ttl)
3. Redis API 라우트 구현
4. 캐시 비교용 `/demo` API 구현
5. 단위/통합 테스트 강화
6. 벤치마크 실행 및 README 반영

## 4) 테스트 전략

- Unit Test: 저장소 로직 검증
  - set/get/del
  - ttl 만료
  - invalidate
- Integration Test: API 동작 검증
  - 성공 시나리오
  - 입력 오류(400)
  - 키 미존재(404)
  - 캐시 hit/miss
- Performance Test:
  - `/demo/no-cache` vs `/demo/with-cache`
  - 평균, p95, req/s, error rate 기록

## 5) 실행 명령

```bash
npm install
npm run dev
npm run build
npm test
npm run benchmark
```

## 6) PR 체크리스트

- [ ] 변경 목적 명확
- [ ] 테스트 통과
- [ ] API 문서 동기화
- [ ] README 성능 결과 최신화