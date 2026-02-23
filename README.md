# Service_AWS

<p align="left">
 <img src="https://img.shields.io/badge/node-dot?style=flat-square&logo=Node&logoColor=white"/>
</p>

 
## url : ec2-13-125-131-14.ap-northeast-2.compute.amazonaws.com
## url-domain : yhjang1.shop
----------------------------------------------------------------
port 3000

* get 

1. /menus    json file about main menu list.


* post

1. /users
	1-1 /users/register
		- name
		- password

---

## 프로젝트 분석 보고 (Project Analysis Report)

### 개요 (Overview)

Node.js + Express 기반의 백엔드 REST API 서버입니다. AWS EC2에 배포되며, MySQL 데이터베이스를 사용합니다.

### 프로젝트 구조 (Project Structure)

```
Service_AWS/
├── app.js                          # Express 앱 설정 및 라우터 등록
├── bin/www                         # HTTP 서버 엔트리포인트 (포트 3000)
├── package.json                    # 프로젝트 의존성
├── public/
│   └── javascripts/
│       ├── DatabaseManager.js      # MySQL 연결 및 쿼리 유틸리티
│       └── Utils.js                # 시간 포맷 유틸리티 클래스
├── routes/
│   ├── users.js                    # 회원 등록 / 로그인 / 정보 수정
│   ├── menus.js                    # 메뉴 목록 조회
│   ├── musicRouter.js              # 음악 목록 조회
│   └── storeList.js                # 매장 목록 조회 및 등록
└── config/ (gitignore)
    ├── db-config.json              # DB 접속 정보 (비공개)
    └── secret-config.json          # bcrypt salt round 등 (비공개)
```

### API 엔드포인트 (API Endpoints)

| Method | Path                  | 설명                        |
|--------|-----------------------|-----------------------------|
| GET    | /menus?type={type}    | 메뉴 유형별 목록 조회        |
| GET    | /musics               | 전체 음악 목록 조회          |
| GET    | /storeList?startPos=N | 매장 목록 페이지네이션 조회  |
| POST   | /storeList/register   | 매장 등록                    |
| POST   | /users/register       | 회원 가입 (bcrypt 비밀번호) |
| POST   | /users/login          | 로그인 (bcrypt 검증)        |
| POST   | /users/update         | 회원 정보 수정               |

### 의존성 (Dependencies)

| 패키지           | 버전     | 용도                          |
|-----------------|---------|-------------------------------|
| express         | ~4.16.1 | HTTP 서버 프레임워크           |
| mysql           | ^2.18.1 | MySQL 클라이언트               |
| bcrypt          | ^5.0.1  | 비밀번호 해싱                  |
| moment          | ^2.29.1 | 날짜/시간 처리                 |
| moment-timezone | ^0.5.33 | 시간대 처리                    |
| cors            | ^2.8.5  | CORS 헤더 처리                 |
| cookie-parser   | ~1.4.4  | 쿠키 파싱                      |
| morgan          | ~1.9.1  | HTTP 요청 로깅                 |

### 발견된 문제점 및 수정 사항 (Issues Found and Fixed)

#### 🔴 보안 취약점 (Security Vulnerabilities)

1. **SQL 인젝션 취약점 — `routes/menus.js`** *(수정됨)*
   - 문제: `type` 쿼리 파라미터가 SQL 쿼리에 직접 연결(concatenation)되어 SQL 인젝션 공격에 취약했습니다.
   - 수정: 허용된 컬럼명 화이트리스트(`ALLOWED_MENU_TYPES`)를 도입하여 유효하지 않은 값을 400 오류로 거부합니다.

#### 🟠 버그 (Bugs)

2. **타입 강제 변환 오류 — `routes/storeList.js`** *(수정됨)*
   - 문제: `req.query.startPos`는 문자열(string)이므로 `startPos + 10`이 숫자 덧셈이 아닌 문자열 연결로 처리되었습니다. (예: `"5" + 10 = "510"`)
   - 수정: `parseInt(req.query.startPos, 10)`을 사용하여 명시적으로 정수로 변환합니다.

3. **DB 오류 시 응답 누락 — `routes/musicRouter.js`** *(수정됨)*
   - 문제: DB 쿼리 오류 발생 시 오류를 로깅만 하고 계속 실행하여 `undefined`를 200 응답으로 반환했습니다.
   - 수정: 오류 발생 시 500 상태코드와 오류 메시지를 반환하고 함수를 즉시 종료합니다.

#### 🟡 코드 품질 (Code Quality)

4. **`Utils.js` module.exports 누락** *(수정됨)*
   - `Utils` 클래스가 정의되어 있으나 `module.exports`가 없어 외부에서 사용 불가능했습니다.

5. **잘못된 HTTP 상태코드 — `routes/menus.js`** *(수정됨)*
   - 입력 오류에 405 (Method Not Allowed)를 사용하고 있었으며, 400 (Bad Request) 및 500 (Internal Server Error)으로 정정했습니다.

### 개선 권고사항 (Recommendations)

1. **인증/인가 미들웨어 부재**: 현재 `/users/update`와 같은 민감한 엔드포인트에 인증이 없습니다. JWT 또는 세션 기반 인증 도입을 권장합니다.
2. **입력 유효성 검사 미비**: `express-validator` 등의 라이브러리를 사용한 요청 본문 검증이 필요합니다.
3. **DB 연결 풀 미사용**: `DatabaseManager.js`가 매 요청마다 새 연결을 생성합니다. `mysql.createPool()`을 사용하여 성능을 개선할 수 있습니다.
4. **config 파일 템플릿 부재**: `config/db-config.json` 및 `config/secret-config.json`에 대한 예시 파일(`*.example.json`)을 제공하면 신규 개발자의 환경 설정에 도움이 됩니다.
5. **테스트 코드 부재**: 단위 테스트 및 통합 테스트가 없습니다. Jest 또는 Mocha를 사용한 테스트 도입을 권장합니다.
6. **`/users` 라우터에 CORS 미적용**: 다른 라우터와 달리 `/users`에는 CORS 미들웨어가 적용되지 않았습니다. 의도적인 설계인지 확인이 필요합니다.

