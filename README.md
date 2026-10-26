# 몽실 미용실 관리 – 백엔드 (Level 1)

반려동물 미용실의 **고객(보호자)·강아지·주의사항·미용 기록·관리사·공지사항·이벤트**를 관리하는 서버예요.
NestJS + PostgreSQL로 만들었고, **Render**에 올리도록 준비했어요.

- 화면(프론트) 저장소: `dog-shop-level1-frontend`
- 기획서: [기획서.md](./기획서.md)

> ⏳ **첫 접속이 느릴 수 있어요.**
> Render 무료 서버는 한동안 아무도 쓰지 않으면 잠들어요. 잠든 뒤 처음 접속하면 깨어나는 데 **1분 가까이** 걸릴 수 있어요.
> 화면이 멈춘 것처럼 보여도 잠깐 기다린 뒤 새로고침하면 정상으로 열려요.

## 확인 주소

| 주소 | 내용 |
|---|---|
| `/health` | 서버와 DB가 잘 연결됐는지 확인. 정상이면 `{"status":"정상", ...}` |
| `/summary` | 메인 화면용 최근 목록 |
| `/options` | 견종·성별·스타일 같은 선택 목록 |

주요 데이터 주소: `/guardians`, `/registrations`, `/dogs`, `/dogs/:id/notes`, `/notes/:id`, `/groomers`, `/records`, `/records/:id/photo`, `/notices`, `/events`

## 데이터 구조

보호자 1 ─ N 강아지 1 ─ N 주의사항 / 미용기록 N ─ 1 관리사. 공지사항과 이벤트는 따로 있어요.
처음 켜면 테이블을 자동으로 만들고, 데이터가 하나도 없으면 **가상 데이터**를 채워 넣어요. (실제 개인정보는 없어요.)

## 서버가 지키는 규칙

- 휴대폰 번호는 숫자 11자리(010 시작), 같은 번호의 고객은 두 번 등록할 수 없어요.
- 나이·몸무게·가격 칸에 글자를 보내면 쉬운 한글 안내로 돌려줘요. 필수 칸이 비어도 마찬가지예요.
- 주의사항은 추가와 삭제만 되고 **수정은 없어요**.
- 강아지가 남아 있는 고객은 삭제할 수 없어요. 강아지를 지우면 주의사항·미용 기록도 함께 지워져요.
- 미용 기록이 있는 관리사는 삭제할 수 없고 "퇴사"로 바꿔요. 새 기록에는 "근무중" 관리사만 고를 수 있어요.
- 사진은 jpg/png, 5MB 이하만 받고 DB에 저장해요.

## 설정값 (환경 변수)

값은 **서버 설정 화면이나 `.env` 파일에만** 넣어요. `.env`는 GitHub에 올라가지 않아요. 예시는 [.env.example](./.env.example)에 있어요.

| 이름 | 뜻 | 예시 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 접속 주소. Render DB 화면의 **Internal Database URL**(같은 Render 안) 또는 External Database URL | `postgresql://사용자:비밀번호@주소/DB이름` |
| `CORS_ORIGIN` | 이 서버를 불러도 되는 화면(프론트) 주소. 쉼표로 여러 개 가능. 비워 두면 모두 허용 | `https://내-앱.vercel.app` |
| `PORT` | 서버가 열릴 번호. Render가 자동으로 넣어 줘서 직접 안 적어도 돼요 | `4000` (내 컴퓨터용) |
| `NODE_VERSION` | (Render) 쓸 Node 버전 | `22` |

## 내 컴퓨터에서 실행

```bash
npm install
cp .env.example .env     # .env 를 열어 DATABASE_URL 을 채워 주세요
npm run start:dev
```

서버: http://localhost:4000 · 확인: http://localhost:4000/health

## Render에 올리기

1. Render에서 **New → Web Service**를 고르고 이 저장소를 연결해요.
2. 아래처럼 적어요.

| 칸 | 값 |
|---|---|
| Language | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start:prod` |
| Instance Type | Free |

3. **Environment**에 위 표의 `DATABASE_URL`, `CORS_ORIGIN`, `NODE_VERSION`을 넣어요.
   `CORS_ORIGIN`은 Vercel 주소가 정해진 뒤에 넣고 다시 배포해도 돼요.
4. 배포가 끝나면 `https://내-서버주소.onrender.com/health`를 열어 `"정상"`인지 확인해요.
5. 이 서버 주소를 프론트엔드 저장소의 `NEXT_PUBLIC_API_URL`에 넣어요.

> Render의 무료 데이터베이스는 사용 기간 제한이 있을 수 있어요. Render 화면에서 만료일을 확인해 주세요.
