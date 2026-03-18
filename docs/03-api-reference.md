# 03. API Reference

## 1) 공통 규칙

- Base Path: `/`
- Content-Type: `application/json`
- 키/값 타입: `string`
- 공통 성공 응답:

```json
{
  "success": true,
  "data": {}
}
```

- 공통 실패 응답:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid input"
  }
}
```

## 2) 상태 코드 규칙

| Status | 의미 |
| --- | --- |
| `200` | 조회/삭제/갱신 성공 |
| `201` | 생성 성공 |
| `400` | 입력 오류 |
| `404` | 키 없음 또는 만료 |

## 3) 엔드포인트 목록

| Method | Endpoint | 설명 |
| --- | --- | --- |
| `POST` | `/redis/set` | 키 저장 |
| `GET` | `/redis/get?key=...` | 값 조회 |
| `DELETE` | `/redis/del?key=...` | 키 삭제 |
| `POST` | `/redis/expire` | TTL 설정 |
| `GET` | `/redis/ttl?key=...` | TTL 조회 |
| `POST` | `/redis/invalidate` | prefix 무효화 |
| `GET` | `/demo/no-cache?id=...` | 캐시 미사용 비교 |
| `GET` | `/demo/with-cache?id=...` | 캐시 사용 비교 |

## 4) 핵심 API 상세

### `POST /redis/set`

Request:

```json
{
  "key": "user:1",
  "value": "kim",
  "ttlSeconds": 30
}
```

Success (`201`):

```json
{
  "success": true,
  "data": { "stored": true }
}
```

### `GET /redis/get?key=user:1`

Success (`200`):

```json
{
  "success": true,
  "data": { "key": "user:1", "value": "kim" }
}
```

Failure (`404`):

```json
{
  "success": false,
  "error": { "code": "KEY_NOT_FOUND", "message": "key not found or expired" }
}
```

### `POST /redis/expire`

Request:

```json
{
  "key": "user:1",
  "ttlSeconds": 10
}
```

Success (`200`):

```json
{
  "success": true,
  "data": { "updated": true }
}
```

### `GET /redis/ttl?key=user:1`

Success (`200`):

```json
{
  "success": true,
  "data": { "key": "user:1", "ttl": 7 }
}
```

TTL rule:
- `-2`: 키 없음(또는 만료됨)
- `-1`: 만료 시간 없음
- `>=0`: 남은 초

## 5) 에러 코드

- `INVALID_INPUT`: 요청 파라미터/바디 오류
- `KEY_NOT_FOUND`: 조회/만료 갱신 대상 키 없음