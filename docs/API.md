# API 명세서

## 기본 정보

| 항목           | 값                           |
|----------------|------------------------------|
| 기본 URL       | `http://yhjang1.shop:3000`   |
| 인코딩         | UTF-8                        |
| 응답 형식      | JSON                         |

> ⚠️ **보안 권고**: 프로덕션 환경에서는 반드시 HTTPS를 사용하여 전송 중 데이터를 보호하세요.

---

## 공통 응답 형식

### 성공 응답

```json
{
  "result": 1,
  "data": [ ... ]
}
```

### 오류 응답

```json
{
  "result": -1,
  "error": "오류 설명"
}
```

---

## 메뉴 API (`/menus`)

### GET /menus

메뉴 유형에 따라 메뉴 목록을 조회합니다.

**CORS**: 허용됨

#### 쿼리 파라미터

| 파라미터 | 타입   | 필수 | 허용 값                                           | 설명          |
|----------|--------|------|--------------------------------------------------|---------------|
| type     | string | ✅   | `breakfast` \| `lunch` \| `dinner` \| `dessert` \| `drink` | 메뉴 유형 |

#### 응답 예시 (성공)

```http
GET /menus?type=lunch
HTTP/1.1 200 OK
```

```json
{
  "result": 1,
  "data": [
    { "id": 1, "name": "비빔밥", "lunch": 1, "price": 9000 },
    { "id": 2, "name": "된장찌개", "lunch": 1, "price": 8000 }
  ]
}
```

#### 오류 응답

| 상태코드 | 조건                   | 응답 본문                                           |
|----------|------------------------|-----------------------------------------------------|
| 400      | `type` 파라미터 누락   | `{ "result": -1, "error": "menus type is null" }`   |
| 400      | 허용되지 않은 `type`   | `{ "result": -1, "error": "invalid menus type" }`   |
| 500      | DB 쿼리 오류           | `{ "result": -2, "error": "sql error", "data": { "errorNo": ..., "message": ... } }` |

---

## 음악 API (`/musics`)

### GET /musics

전체 음악 목록을 조회합니다.

**CORS**: 허용됨

#### 요청

파라미터 없음.

```http
GET /musics
```

#### 응답 예시 (성공)

```http
HTTP/1.1 200 OK
```

```json
[
  { "id": 1, "title": "Song A", "artist": "Artist X" },
  { "id": 2, "title": "Song B", "artist": "Artist Y" }
]
```

#### 오류 응답

| 상태코드 | 조건         | 응답 본문                                              |
|----------|--------------|--------------------------------------------------------|
| 500      | DB 쿼리 오류 | `{ "result": -2, "error": "Internal server error" }`   |

---

## 매장 API (`/storeList`)

### GET /storeList

매장 목록을 페이지네이션으로 조회합니다. 한 번에 최대 10개를 반환합니다.

**CORS**: 허용됨

#### 쿼리 파라미터

| 파라미터 | 타입   | 필수 | 기본값 | 설명                     |
|----------|--------|------|--------|--------------------------|
| startPos | number | ❌   | 0      | 조회 시작 위치 (0-based) |

#### 응답 예시 (성공)

```http
GET /storeList?startPos=0
HTTP/1.1 200 OK
```

```json
{
  "result": 1,
  "isNext": true,
  "data": [
    {
      "id": 1,
      "name": "강남 맛집",
      "title": "강남 맛집",
      "store_type": "한식",
      "distance": 0.5,
      "maxDiscount": 20,
      "minDiscount": 5,
      "location": "서울 강남구"
    }
  ]
}
```

> `isNext: true`이면 다음 페이지가 존재합니다. 다음 요청 시 `startPos`를 10씩 증가시킵니다.

#### 오류 응답

| 상태코드 | 조건                         | 응답 본문                                      |
|----------|------------------------------|------------------------------------------------|
| 400      | `startPos`가 숫자가 아님     | `{ "result": -1, "error": "invalid startPos" }` |
| 400      | `startPos`가 음수            | `{ "result": -1, "error": "invalid startPos" }` |
| 500      | DB 쿼리 오류                 | `{ "result": -2, "error": "sql error", ... }`   |

---

### POST /storeList/register

새 매장을 등록합니다.

**CORS**: 허용됨

#### 요청 본문 (application/json)

| 필드        | 타입   | 필수 | 설명             |
|-------------|--------|------|------------------|
| title       | string | ✅   | 매장 이름 및 제목 |
| type        | string | ✅   | 매장 유형        |
| distance    | number | ✅   | 거리 (km)        |
| maxDiscount | number | ✅   | 최대 할인율       |
| minDiscount | number | ✅   | 최소 할인율       |
| location    | string | ✅   | 매장 위치        |

#### 요청 예시

```http
POST /storeList/register
Content-Type: application/json

{
  "title": "신촌 카페",
  "type": "카페",
  "distance": 1.2,
  "maxDiscount": 15,
  "minDiscount": 5,
  "location": "서울 서대문구 신촌"
}
```

#### 응답 예시

```http
HTTP/1.1 200 OK
```

#### 오류 응답

| 상태코드 | 조건         | 응답 본문 |
|----------|--------------|-----------|
| 500      | DB 쿼리 오류 | (빈 본문) |

---

## 회원 API (`/users`)

> ⚠️ **주의**: `/users` 라우터는 CORS가 적용되어 있지 않습니다.

### POST /users/register

신규 회원을 등록합니다. 비밀번호는 bcrypt로 해싱되어 저장됩니다.

#### 요청 본문 (application/json)

| 필드     | 타입   | 필수 | 설명       |
|----------|--------|------|------------|
| name     | string | ✅   | 사용자 이름 |
| password | string | ✅   | 평문 비밀번호 (서버에서 해싱) |

#### 요청 예시

```http
POST /users/register
Content-Type: application/json

{
  "name": "hong_gildong",
  "password": "mypassword123"
}
```

#### 응답 예시

```http
HTTP/1.1 200 OK
```

#### 오류 응답

| 상태코드 | 조건         | 응답 본문 |
|----------|--------------|-----------|
| 500      | DB 쿼리 오류 | (빈 본문) |

---

### POST /users/login

사용자 이름과 비밀번호로 로그인합니다.

#### 요청 본문 (application/json)

| 필드     | 타입   | 필수 | 설명         |
|----------|--------|------|--------------|
| name     | string | ✅   | 사용자 이름   |
| password | string | ✅   | 평문 비밀번호 |

#### 요청 예시

```http
POST /users/login
Content-Type: application/json

{
  "name": "hong_gildong",
  "password": "mypassword123"
}
```

#### 응답 예시 (성공)

```http
HTTP/1.1 200 OK

Success
```
> 응답 본문: `Success` (성공)

#### 응답 예시 (비밀번호 불일치)

```http
HTTP/1.1 200 OK

Not Allowed
```
> 응답 본문: `Not Allowed` (거부됨)

> ⚠️ 로그인 실패 시에도 200 상태코드가 반환됩니다. 클라이언트는 응답 본문으로 성공/실패를 구분해야 합니다.

#### 오류 응답

| 상태코드 | 조건              | 응답 본문                                               |
|----------|-------------------|---------------------------------------------------------|
| 400      | `name` 파라미터 없음 | `no data of name : {name}` (이름 데이터 없음)        |
| 500      | 사용자를 찾지 못함  | `query no result` (조회 결과 없음)                    |
| 500      | DB 쿼리 오류      | `query error : {err}` (쿼리 오류)                      |

---

### POST /users/update

회원 정보를 수정합니다. 현재 비밀번호 인증 후 업데이트합니다.

#### 요청 본문 (application/json)

| 필드     | 타입   | 필수 | 설명                     |
|----------|--------|------|--------------------------|
| name     | string | ✅   | 수정할 사용자 이름 (식별자) |
| password | string | ✅   | 현재 비밀번호 (인증용)    |
| ...      | -      | ❌   | 수정할 기타 필드들        |

#### 요청 예시

```http
POST /users/update
Content-Type: application/json

{
  "name": "hong_gildong",
  "password": "mypassword123",
  "email": "hong@example.com"
}
```

#### 응답 예시 (성공)

```http
HTTP/1.1 200 OK

Update Success
```
> 응답 본문: `Update Success` (정보 수정 성공)

#### 오류 응답

| 상태코드 | 조건                  | 응답 본문                                            |
|----------|-----------------------|------------------------------------------------------|
| 400      | `name` 파라미터 없음  | `no data of name : {name}` (이름 데이터 없음)        |
| 500      | 비밀번호 불일치       | `wrong password` (비밀번호 오류)                     |
| 500      | 사용자를 찾지 못함    | `query no result` (조회 결과 없음)                   |
| 500      | DB 쿼리 오류          | `query error : {err}` (쿼리 오류)                    |
