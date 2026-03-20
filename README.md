# Service_AWS

<p align="left">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white"/>
  <img alt="Express" src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white"/>
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white"/>
  <img alt="AWS EC2" src="https://img.shields.io/badge/AWS_EC2-FF9900?style=flat-square&logo=amazonaws&logoColor=white"/>
</p>

AWS EC2에 배포된 **Node.js + Express** 기반의 백엔드 REST API 서버입니다.  
MySQL 데이터베이스를 사용하며 회원 관리, 메뉴 조회, 음악 목록, 매장 목록 기능을 제공합니다.

> 📄 **상세 문서**:
> - [프로젝트 분석 보고서](docs/ANALYSIS_REPORT.md)
> - [API 명세서](docs/API.md)
> - [아키텍처 문서](docs/ARCHITECTURE.md)

---

## 배포 정보

| 항목        | 값                                                    |
|-------------|-------------------------------------------------------|
| EC2 주소    | `ec2-13-125-131-14.ap-northeast-2.compute.amazonaws.com` |
| 도메인      | `yhjang1.shop`                                        |
| 포트        | `3000`                                                |
| 리전        | `ap-northeast-2` (서울)                               |

---

## 빠른 시작 (Quick Start)

### 1. 저장소 클론

```bash
git clone https://github.com/jang4292/Service_AWS.git
cd Service_AWS
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 설정 파일 생성

`config/` 디렉토리를 생성하고 아래 두 파일을 작성합니다.

**`config/db-config.json`**
```json
{
  "host": "YOUR_DB_HOST",
  "user": "YOUR_DB_USER",
  "password": "YOUR_DB_PASSWORD",
  "database": "service"
}
```

**`config/secret-config.json`**
```json
{
  "salt_round": 10
}
```

### 4. 서버 실행

```bash
npm start
```

서버가 `http://localhost:3000` 에서 실행됩니다.

---

## 프로젝트 구조

```
Service_AWS/
├── app.js                          # Express 앱 설정 및 라우터 등록
├── bin/
│   └── www                         # HTTP 서버 엔트리포인트 (포트 3000)
├── package.json                    # 프로젝트 메타데이터 및 의존성
├── public/
│   └── javascripts/
│       ├── DatabaseManager.js      # MySQL 연결 및 쿼리 유틸리티
│       └── Utils.js                # 시간 포맷 유틸리티 클래스
├── routes/
│   ├── users.js                    # 회원 등록 / 로그인 / 정보 수정
│   ├── menus.js                    # 메뉴 목록 조회
│   ├── musicRouter.js              # 음악 목록 조회
│   └── storeList.js                # 매장 목록 조회 및 등록
├── docs/
│   ├── ANALYSIS_REPORT.md          # 프로젝트 분석 보고서
│   ├── API.md                      # API 엔드포인트 상세 명세
│   └── ARCHITECTURE.md             # 아키텍처 및 설계 문서
└── config/ (gitignore — 직접 생성 필요)
    ├── db-config.json              # DB 접속 정보 (비공개)
    └── secret-config.json          # bcrypt salt round 등 (비공개)
```

---

## API 엔드포인트 요약

| 메서드 | 경로                    | 설명                              | CORS |
|--------|-------------------------|-----------------------------------|------|
| GET    | `/menus?type={type}`    | 메뉴 유형별 목록 조회              | ✅   |
| GET    | `/musics`               | 전체 음악 목록 조회                | ✅   |
| GET    | `/storeList?startPos=N` | 매장 목록 페이지네이션 조회        | ✅   |
| POST   | `/storeList/register`   | 새 매장 등록                       | ✅   |
| POST   | `/users/register`       | 회원 가입 (bcrypt 비밀번호 해싱)  | ❌   |
| POST   | `/users/login`          | 로그인 (bcrypt 비밀번호 검증)     | ❌   |
| POST   | `/users/update`         | 회원 정보 수정                     | ❌   |

> 자세한 요청/응답 스펙은 [API 명세서](docs/API.md)를 참조하세요.

---

## 의존성

| 패키지           | 버전      | 용도                       |
|-----------------|-----------|---------------------------|
| express         | ~4.16.1   | HTTP 서버 프레임워크        |
| mysql           | ^2.18.1   | MySQL 클라이언트            |
| bcrypt          | ^5.0.1    | 비밀번호 해싱               |
| moment          | ^2.29.1   | 날짜/시간 처리              |
| moment-timezone | ^0.5.33   | 시간대 처리                 |
| cors            | ^2.8.5    | CORS 헤더 처리              |
| cookie-parser   | ~1.4.4    | 쿠키 파싱                   |
| morgan          | ~1.9.1    | HTTP 요청 로깅              |
| debug           | ~2.6.9    | 디버그 출력                 |

---

## 주요 이슈 및 수정 이력

| 심각도 | 파일                    | 문제                              | 상태    |
|--------|-------------------------|-----------------------------------|---------|
| 🔴 보안 | `routes/menus.js`      | SQL 인젝션 취약점 (파라미터 직접 연결) | ✅ 수정됨 |
| 🟠 버그 | `routes/storeList.js`  | 문자열 + 숫자 타입 오류 (`"5"+10="510"`) | ✅ 수정됨 |
| 🟠 버그 | `routes/musicRouter.js`| DB 오류 시 응답 누락              | ✅ 수정됨 |
| 🟡 품질 | `public/javascripts/Utils.js` | `module.exports` 누락      | ✅ 수정됨 |
| 🟡 품질 | `routes/menus.js`      | 잘못된 HTTP 상태코드 (405→400/500) | ✅ 수정됨 |

> 상세 분석 내용은 [프로젝트 분석 보고서](docs/ANALYSIS_REPORT.md)를 참조하세요.

---

## 개선 권고사항

1. **인증/인가 미들웨어 도입**: `/users/update` 등 민감한 엔드포인트에 JWT 인증 적용 권장
2. **입력 유효성 검사**: `express-validator` 도입으로 요청 본문 검증 강화
3. **DB 연결 풀 전환**: 매 요청마다 새 연결 생성 → `mysql.createPool()` 사용으로 성능 개선
4. **환경설정 템플릿 제공**: `config/*.example.json` 파일 추가로 신규 개발자 온보딩 지원
5. **테스트 코드 작성**: Jest 또는 Mocha를 활용한 단위·통합 테스트 도입
6. **CORS 정책 통일**: `/users` 라우터의 CORS 미적용 여부 재검토

