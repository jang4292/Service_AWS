# 프로젝트 분석 보고서

## 프로젝트: Service_AWS

---

## 1. 개요

| 항목       | 내용                                                          |
|------------|--------------------------------------------------------------|
| 프로젝트명  | Service_AWS                                                  |
| 기술 스택  | Node.js, Express.js, MySQL, bcrypt, moment                   |
| 배포 환경  | AWS EC2 (`ap-northeast-2`, 서울 리전)                         |
| 접속 주소  | `ec2-13-125-131-14.ap-northeast-2.compute.amazonaws.com:3000` |
| 도메인     | `yhjang1.shop`                                               |
| 목적       | 모바일/웹 클라이언트를 위한 REST API 백엔드 서버              |

본 프로젝트는 음식점 서비스를 위한 백엔드 API로, 회원 관리, 메뉴 조회, 음악 재생 목록 제공, 매장 정보 관리 기능을 제공합니다.

---

## 2. 파일별 역할 분석

### 2.1 `app.js` — 앱 엔트리포인트

Express 애플리케이션을 초기화하고 미들웨어와 라우터를 등록합니다.

```
미들웨어 체인:
  morgan('dev')           → HTTP 요청 로그 출력
  express.json()          → JSON 요청 본문 파싱
  express.urlencoded()    → URL-encoded 요청 본문 파싱
  cookieParser()          → 쿠키 파싱
  express.static(public/) → 정적 파일 서빙

라우터 등록:
  /users      → routes/users.js
  /menus      → routes/menus.js
  /musics     → routes/musicRouter.js
  /storeList  → routes/storeList.js
```

**특이사항**: CORS 미들웨어가 앱 전역이 아닌 각 라우터 핸들러 단위로 적용되어 있습니다. `/users` 라우터에는 CORS가 적용되어 있지 않아 동일 출처 요청만 허용됩니다.

---

### 2.2 `bin/www` — HTTP 서버 부트스트랩

Node.js 기본 `http` 모듈로 서버를 생성하고 포트 `3000`에서 리슨합니다.  
환경변수 `PORT`가 설정된 경우 해당 포트를 사용합니다.

---

### 2.3 `public/javascripts/DatabaseManager.js` — DB 유틸리티

MySQL 연결 관리 및 쿼리 실행 유틸리티입니다.

```
구조: 즉시 실행 함수(IIFE)로 싱글톤 객체 생성
메서드:
  query(queryString, callback, queryObj?)
    1. mysql.createConnection(db_config) 으로 새 연결 생성
    2. Promise 기반으로 쿼리 실행
    3. 결과를 callback(err, results, fields)으로 전달
    4. connection.end()로 연결 종료
```

**구조적 문제**: 매 쿼리마다 새 DB 연결을 생성/종료합니다. 연결 풀(`createPool`)을 사용하지 않으므로 동시 요청이 많을 경우 성능 저하 및 연결 한도 초과 위험이 있습니다.

---

### 2.4 `public/javascripts/Utils.js` — 유틸리티 클래스

시간(초)을 사람이 읽기 좋은 문자열로 변환하는 `Utils` 클래스를 제공합니다.

```
메서드: _toTimeString(seconds)
  - 음수 입력 → 0으로 보정
  - 24시간 초과 → "N DAYS" 형태 반환
  - 24시간 이하 → "HH:MM:SS" 형태 반환
```

**특이사항**: 메서드명이 `_toTimeString`으로 underscore prefix를 사용하고 있어 private 메서드임을 나타내지만, 실질적으로 private으로 동작하지는 않습니다.

---

### 2.5 `routes/users.js` — 회원 관리 라우터

회원 가입, 로그인, 정보 수정 3개의 POST 엔드포인트를 제공합니다.

**`POST /users/register`**
- `req.body.password`를 bcrypt로 해싱 후 원본 삭제
- 현재 시간(UTC)을 `register_time`, `update_time`으로 설정
- `INSERT INTO users SET ?` 쿼리로 사용자 등록

**`POST /users/login`**
- `name`으로 사용자 조회 후 `bcrypt.compare`로 비밀번호 검증
- 검증 성공 시 `'Success'`, 실패 시 `'Not Allowed'` 반환
- **문제**: 로그인 성공/실패 응답 모두 200 상태코드 반환 (실패 시 401이 적절)

**`POST /users/update`**
- 현재 비밀번호 검증 후 사용자 정보 업데이트
- `UPDATE users SET ? WHERE name LIKE ?` 쿼리 사용

---

### 2.6 `routes/menus.js` — 메뉴 조회 라우터

**`GET /menus?type={type}`**

- 허용 타입: `breakfast`, `lunch`, `dinner`, `dessert`, `drink`
- 화이트리스트(`ALLOWED_MENU_TYPES`)로 SQL 인젝션 방지
- 유효하지 않은 타입 → 400 반환
- DB 조회: `SELECT * FROM service.menus WHERE \`{column}\` = 1`

---

### 2.7 `routes/musicRouter.js` — 음악 조회 라우터

**`GET /musics`**

- `SELECT * FROM service.musics` 전체 조회
- DB 오류 시 500 반환
- 결과를 JSON 배열로 응답

---

### 2.8 `routes/storeList.js` — 매장 관리 라우터

**`GET /storeList?startPos=N`**

- `startPos`를 `parseInt`로 정수 변환 (기본값 0)
- 유효하지 않은 값 → 400 반환
- `SELECT * FROM service.storeList LIMIT {startPos}, {startPos+10}` 페이지네이션
- `isNext: results.length === 10`으로 다음 페이지 존재 여부 반환

**`POST /storeList/register`**

- 매장 정보(이름, 유형, 거리, 할인율, 위치) 등록
- `INSERT INTO service.storeList SET ?`

---

## 3. 데이터베이스 스키마 추론

소스 코드에서 추론한 테이블 구조입니다. (실제 스키마는 DB 직접 확인 필요)

### `service.users`

| 컬럼명        | 타입         | 설명                  |
|---------------|--------------|-----------------------|
| name          | VARCHAR      | 사용자 이름 (식별자)   |
| hashPassword  | VARCHAR(60)  | bcrypt 해시 비밀번호  |
| register_time | DATETIME     | 가입 시각 (UTC)        |
| update_time   | DATETIME     | 마지막 수정 시각       |

### `service.menus`

| 컬럼명    | 타입    | 설명                           |
|-----------|---------|--------------------------------|
| (id 등)   | -       | 기타 메뉴 정보 컬럼            |
| breakfast | TINYINT | 1이면 아침 메뉴에 해당         |
| lunch     | TINYINT | 1이면 점심 메뉴에 해당         |
| dinner    | TINYINT | 1이면 저녁 메뉴에 해당         |
| dessert   | TINYINT | 1이면 디저트 메뉴에 해당       |
| drink     | TINYINT | 1이면 음료 메뉴에 해당         |

### `service.musics`

| 컬럼명  | 타입    | 설명         |
|---------|---------|--------------|
| (id 등) | -       | 음악 정보 컬럼 |

### `service.storeList`

| 컬럼명      | 타입    | 설명                |
|-------------|---------|---------------------|
| name        | VARCHAR | 매장 이름            |
| title       | VARCHAR | 매장 제목            |
| store_type  | VARCHAR | 매장 유형            |
| distance    | FLOAT   | 거리 (km 등)         |
| maxDiscount | INT     | 최대 할인율           |
| minDiscount | INT     | 최소 할인율           |
| location    | VARCHAR | 매장 위치 정보        |

---

## 4. 발견된 문제점 및 수정 이력

### 4.1 🔴 보안 취약점

#### SQL 인젝션 — `routes/menus.js`

**문제 코드 (수정 전)**
```js
const type = req.query.type;
const query = `SELECT * FROM service.menus WHERE \`${type}\` = 1`;
// type에 임의 SQL을 주입할 수 있음
// 예: type = "1\`=1 OR 1=1 --"  (1=1 조건으로 전체 데이터 노출)
```

**수정 코드**
```js
const ALLOWED_MENU_TYPES = ['breakfast', 'lunch', 'dinner', 'dessert', 'drink'];
const MENU_TYPE_COLUMNS = { breakfast: 'breakfast', ... };

if (!ALLOWED_MENU_TYPES.includes(type.toString())) {
    return res.status(400).json({ result: -1, error: "invalid menus type" });
}
const column = MENU_TYPE_COLUMNS[type.toString()];
const query = `SELECT * FROM service.menus WHERE \`${column}\` = 1`;
```

---

### 4.2 🟠 버그

#### 타입 강제 변환 오류 — `routes/storeList.js`

**문제 코드 (수정 전)**
```js
const startPos = req.query.startPos || 0;
// req.query.startPos는 문자열("5")이므로
// "5" + 10 = "510" → 쿼리가 LIMIT 5, 510이 됨 (숫자 덧셈이 아닌 문자열 이어붙기)
const query = `... LIMIT ${startPos}, ${startPos + 10}`;
```

**수정 코드**
```js
const startPos = req.query.startPos ? parseInt(req.query.startPos, 10) : 0;
if (isNaN(startPos) || startPos < 0) { return res.status(400)... }
```

---

#### DB 오류 시 응답 누락 — `routes/musicRouter.js`

**문제 코드 (수정 전)**
```js
db.query(query, (err, results, fields) => {
    if (err) {
        console.log(err);
        // return 없이 계속 실행 — 오류가 있어도 아래 코드로 진행됨
    }
    res.status(200);
    res.json(results); // err 발생 시 results = undefined → 500 오류 발생
});
```

**수정 코드**
```js
if (err) {
    console.log(err);
    res.status(500);
    res.json({ result: -2, error: "Internal server error" }); // 서버 내부 오류
    return; // 즉시 종료 — 이후 코드 실행하지 않음
}
```

---

### 4.3 🟡 코드 품질

#### `Utils.js` `module.exports` 누락 (수정됨)

```js
// 수정 전: module.exports 누락 — 외부에서 require()로 불러올 수 없음
// 수정 후: module.exports 추가 — 외부 파일에서 사용 가능
module.exports = Utils;
```

#### 잘못된 HTTP 상태코드 — `routes/menus.js` (수정됨)

```js
// 수정 전: 입력 오류에 405 반환 (잘못된 사용)
res.status(405); // 405 Method Not Allowed — HTTP 메서드가 허용되지 않을 때 사용하는 코드

// 수정 후: 의미에 맞는 코드 사용
res.status(400); // 400 Bad Request — 잘못된 입력 파라미터
res.status(500); // 500 Internal Server Error — 서버 내부(DB) 오류
```

---

## 5. 개선 권고사항

### 5.1 인증/인가 미들웨어 부재 (우선순위: 높음)

`/users/update`와 같은 민감한 엔드포인트에 인증이 없어 누구든 다른 사용자 정보를 수정할 수 있습니다.

**권고**: JWT 기반 인증 미들웨어 도입
```js
// 예시
const jwt = require('jsonwebtoken');
router.post('/update', authenticate, async (req, res) => { ... });
```

---

### 5.2 입력 유효성 검사 미비 (우선순위: 높음)

현재 `/users/register`에서 요청 본문의 필드 존재 여부, 형식, 길이 등을 전혀 검증하지 않습니다.

**권고**: `express-validator` 또는 `joi` 도입
```js
const { body, validationResult } = require('express-validator');
router.post('/register',
    body('name').isLength({ min: 3, max: 20 }),
    body('password').isLength({ min: 8 }),
    (req, res) => { ... }
);
```

---

### 5.3 DB 연결 풀 미사용 (우선순위: 중간)

현재 모든 쿼리마다 새 연결을 생성하고 종료합니다. 트래픽이 증가할 경우 성능 저하 및 `Too many connections` 오류가 발생할 수 있습니다.

**권고**: `mysql.createPool()` 사용
```js
// DatabaseManager.js 개선안
const pool = mysql.createPool(db_config);
pool.query(queryString, queryObj, callback);
```

---

### 5.4 환경설정 템플릿 파일 부재 (우선순위: 낮음)

`config/` 디렉토리가 `.gitignore`에 포함되어 있어 신규 개발자가 필요한 설정 파일 구조를 알 수 없습니다.

**권고**: 예시 파일 추가
- `config/db-config.example.json`
- `config/secret-config.example.json`

---

### 5.5 테스트 코드 부재 (우선순위: 중간)

단위 테스트, 통합 테스트가 전혀 없어 코드 변경 시 회귀 버그 검출이 어렵습니다.

**권고**: Jest + supertest 기반 테스트 도입
```bash
npm install --save-dev jest supertest
```

---

### 5.6 로그인 응답 상태코드 개선 (우선순위: 낮음)

로그인 실패 시 `'Not Allowed'`를 HTTP 200으로 반환합니다. REST 관례상 인증 실패는 401을 반환해야 합니다.

---

## 6. 요약

| 항목                  | 상태        |
|-----------------------|-------------|
| 전체 라우터 수        | 4개         |
| 전체 API 엔드포인트   | 7개         |
| 수정된 보안 취약점    | 1건         |
| 수정된 버그           | 2건         |
| 수정된 코드 품질 이슈 | 2건         |
| 잔존 개선 권고사항    | 6건         |
| 테스트 커버리지       | 0% (없음)   |
