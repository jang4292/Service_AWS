# 아키텍처 문서

## 프로젝트: Service_AWS

---

## 1. 시스템 구성도

```
[클라이언트 (모바일/웹)]
        │
        │ HTTP (포트 3000)
        ▼
┌──────────────────────────────────────────────┐
│              AWS EC2 인스턴스                 │
│         (ap-northeast-2, 서울)                │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │          Node.js + Express           │    │
│  │                                      │    │
│  │  ┌─────────────────────────────┐     │    │
│  │  │       app.js (미들웨어)      │     │    │
│  │  │  morgan / json / cookie /    │     │    │
│  │  │  static / urlencoded        │     │    │
│  │  └──────────┬──────────────────┘     │    │
│  │             │                        │    │
│  │  ┌──────────▼──────────────────┐     │    │
│  │  │        라우터 레이어         │     │    │
│  │  │  /users  /menus             │     │    │
│  │  │  /musics /storeList         │     │    │
│  │  └──────────┬──────────────────┘     │    │
│  │             │                        │    │
│  │  ┌──────────▼──────────────────┐     │    │
│  │  │    DatabaseManager.js       │     │    │
│  │  │    (쿼리 유틸리티)           │     │    │
│  │  └──────────┬──────────────────┘     │    │
│  └─────────────│──────────────────────┘    │
│                │ mysql 드라이버              │
│  ┌─────────────▼──────────────────────┐    │
│  │           MySQL DB                  │    │
│  │  service.users / service.menus      │    │
│  │  service.musics / service.storeList │    │
│  └─────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

---

## 2. 기술 스택

| 계층       | 기술                        | 버전      |
|------------|----------------------------|-----------|
| 런타임     | Node.js                     | LTS       |
| 웹 프레임워크 | Express.js                 | ~4.16.1   |
| 데이터베이스 | MySQL                      | -         |
| DB 드라이버 | mysql (npm)                 | ^2.18.1   |
| 인증       | bcrypt                      | ^5.0.1    |
| 날짜 처리  | moment + moment-timezone    | ^2.29.1   |
| CORS       | cors (npm)                  | ^2.8.5    |
| 로깅       | morgan                      | ~1.9.1    |
| 쿠키       | cookie-parser               | ~1.4.4    |
| 배포       | AWS EC2 (ap-northeast-2)    | -         |

---

## 3. 디렉토리 구조

```
Service_AWS/
│
├── app.js                 # Express 앱 초기화 및 미들웨어/라우터 등록
│
├── bin/
│   └── www                # HTTP 서버 생성 및 포트 바인딩 (포트 3000)
│
├── package.json           # 프로젝트 메타데이터 및 의존성 목록
├── package-lock.json      # 의존성 잠금 파일
├── Service_AWS.iml        # IntelliJ IDEA 프로젝트 파일
│
├── public/
│   └── javascripts/
│       ├── DatabaseManager.js   # MySQL 연결 및 쿼리 헬퍼
│       └── Utils.js             # 시간 변환 유틸리티
│
├── routes/
│   ├── users.js           # POST /users/register, /login, /update
│   ├── menus.js           # GET  /menus?type={type}
│   ├── musicRouter.js     # GET  /musics
│   └── storeList.js       # GET  /storeList, POST /storeList/register
│
├── docs/
│   ├── ANALYSIS_REPORT.md # 프로젝트 분석 보고서
│   ├── API.md             # API 엔드포인트 상세 명세
│   └── ARCHITECTURE.md    # 아키텍처 및 설계 문서 (이 파일)
│
└── config/                # ⚠️ .gitignore로 제외됨 — 직접 생성 필요
    ├── db-config.json     # MySQL 접속 정보
    └── secret-config.json # bcrypt salt round 등 비밀 설정
```

---

## 4. 요청 처리 흐름

### 일반 GET 요청 (예: `GET /menus?type=lunch`)

```
요청
  │
  ▼
app.js 미들웨어 체인 실행
  (morgan → json → urlencoded → cookieParser → static)
  │
  ▼
Express 라우터 매칭 (/menus → routes/menus.js)
  │
  ▼
cors() 미들웨어 실행 (CORS 헤더 추가)
  │
  ▼
쿼리 파라미터 검증
  ├─ type 없음 → 400 응답
  └─ type 유효하지 않음 → 400 응답
  │
  ▼
DatabaseManager.query() 호출
  │
  ├─ mysql.createConnection() → DB 연결
  ├─ connection.query() → SQL 실행
  └─ connection.end() → 연결 종료
  │
  ▼
콜백 실행
  ├─ 오류 → 500 응답 (JSON)
  └─ 성공 → 200 응답 (JSON)
```

### POST 회원가입 요청 (`POST /users/register`)

```
요청 (name, password)
  │
  ▼
bcrypt.hash(password, salt_round) → hashedPassword 생성
  │
  ▼
현재 시각(UTC) 생성 (moment)
  │
  ▼
queryObj = { name, hashPassword, register_time, update_time }
  │
  ▼
DatabaseManager.query(INSERT INTO users SET ?, callback, queryObj)
  │
  ├─ 오류 → 500 응답
  └─ 성공 → 200 응답
```

---

## 5. 데이터베이스 접근 패턴

`DatabaseManager.js`는 IIFE(즉시 실행 함수)로 싱글톤 객체를 생성합니다.

```js
const db = (() => {
    const db_config = require('../../config/db-config.json');
    return {
        async query(queryString, callback, queryObj = null) {
            const connection = mysql.createConnection(db_config); // 새 DB 연결 생성
            const obj = await new Promise(resolve =>
                connection.query(queryString, queryObj, (err, results, fields) =>
                    resolve({ err, results, fields })
                )
            );
            connection.end(); // 연결 종료
            return callback(obj.err, obj.results, obj.fields);
        }
    };
})();
```

**현재 패턴**: 요청마다 새 연결 생성 → 쿼리 실행 → 연결 종료  
**권고 패턴**: `mysql.createPool()`을 사용한 연결 풀(Connection Pool) 관리

---

## 6. CORS 정책

라우터별 CORS 적용 현황:

| 라우터         | CORS 적용 | 비고                            |
|----------------|----------|---------------------------------|
| `/menus`       | ✅        | 핸들러 레벨에서 `cors()` 적용    |
| `/musics`      | ✅        | 핸들러 레벨에서 `cors()` 적용    |
| `/storeList`   | ✅        | 핸들러 레벨에서 `cors()` 적용    |
| `/users`       | ❌        | CORS 미적용 — 동일 출처만 허용   |

> **설계 의도 추정**: `/users` 엔드포인트(회원가입/로그인/수정)는 동일 서버 내 애플리케이션에서만 호출되도록 의도된 것으로 보입니다.

---

## 7. 보안 아키텍처

### 현재 구현된 보안 수단

| 수단                | 적용 위치          | 설명                          |
|---------------------|--------------------|-------------------------------|
| bcrypt 해싱         | `/users/register`  | salt_round=10으로 비밀번호 해싱 |
| bcrypt 검증         | `/users/login`     | 저장된 해시와 입력 비밀번호 비교 |
| SQL 인젝션 방어     | `/menus`           | 화이트리스트 방식으로 컬럼명 검증 |

### 미구현 보안 수단 (권고)

| 수단                  | 적용 필요 위치        | 설명                                          |
|-----------------------|-----------------------|-----------------------------------------------|
| 인증 미들웨어         | `/users/update`       | JWT 또는 세션 기반 인증                        |
| 요청 속도 제한        | 전체                  | `express-rate-limit` 도입 (무차별 대입 공격 방지) |
| Helmet                | 전체                  | HTTP 보안 헤더 자동 설정 (보안 헤더 미들웨어)  |
| 입력 유효성 검사      | 모든 POST 엔드포인트  | `express-validator` 도입 (요청 본문 검증)      |
| HTTPS                 | 전체                  | SSL/TLS 인증서 적용 (전송 구간 암호화)         |

---

## 8. 설정 관리

설정 파일은 `config/` 디렉토리에 위치하며, `.gitignore`에 의해 버전 관리에서 제외됩니다.

### `config/db-config.json`

MySQL 연결 정보를 담습니다.

```json
{
  "host": "DB_HOST",
  "user": "DB_USER",
  "password": "DB_PASSWORD",
  "database": "service"
}
```

### `config/secret-config.json`

비밀번호 해싱에 사용할 bcrypt salt round를 담습니다.

```json
{
  "salt_round": 10
}
```

> **주의**: 이 파일들은 절대 버전 관리 시스템(Git)에 커밋하면 안 됩니다.

---

## 9. 배포 환경

| 항목          | 값                                                      |
|---------------|---------------------------------------------------------|
| 클라우드      | AWS                                                     |
| 서비스        | EC2 (t2.micro 추정)                                    |
| 리전          | ap-northeast-2 (서울)                                   |
| 퍼블릭 DNS    | `ec2-13-125-131-14.ap-northeast-2.compute.amazonaws.com` |
| 커스텀 도메인 | `yhjang1.shop`                                          |
| 포트          | 3000                                                    |
| 실행 명령     | `npm start` (`node ./bin/www`)                          |
