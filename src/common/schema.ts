import { pool, query } from './db.js';

const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS guardians (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  phone VARCHAR(13) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  emergency_name VARCHAR(20),
  emergency_phone VARCHAR(13),
  message VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dogs (
  id SERIAL PRIMARY KEY,
  guardian_id INTEGER NOT NULL REFERENCES guardians(id) ON DELETE RESTRICT,
  name VARCHAR(20) NOT NULL,
  breed VARCHAR(20) NOT NULL,
  gender VARCHAR(4) NOT NULL,
  age INTEGER NOT NULL,
  weight NUMERIC(4,1) NOT NULL,
  birthday DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dog_notes (
  id SERIAL PRIMARY KEY,
  dog_id INTEGER NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  content VARCHAR(300) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS groomers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  phone VARCHAR(13),
  status VARCHAR(4) NOT NULL DEFAULT '근무중',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grooming_records (
  id SERIAL PRIMARY KEY,
  dog_id INTEGER NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  groomer_id INTEGER NOT NULL REFERENCES groomers(id) ON DELETE RESTRICT,
  groomed_at DATE NOT NULL,
  style VARCHAR(20) NOT NULL,
  price INTEGER NOT NULL,
  memo VARCHAR(500),
  photo_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notices (
  id SERIAL PRIMARY KEY,
  title VARCHAR(50) NOT NULL,
  content VARCHAR(1000) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(50) NOT NULL,
  content VARCHAR(1000) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dogs_guardian ON dogs(guardian_id);
CREATE INDEX IF NOT EXISTS idx_notes_dog ON dog_notes(dog_id);
CREATE INDEX IF NOT EXISTS idx_records_dog ON grooming_records(dog_id);
CREATE INDEX IF NOT EXISTS idx_records_date ON grooming_records(groomed_at);
`;

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** 테이블이 없으면 만들고, 데이터가 하나도 없으면 가상 데이터를 채워 넣어요. */
export async function initDatabase() {
  await query(CREATE_TABLES);
  const [{ count }] = await query<{ count: string }>('SELECT COUNT(*) AS count FROM guardians');
  if (Number(count) === 0) {
    await seedDatabase();
  }
}

/** 모두 가상의 이름·번호예요. 실제 사람과 관련이 없어요. */
async function seedDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const guardians = [
      ['김가은', '010-5550-0101', 'gaeun.kim@example.com', '김도현', '010-5550-0201', '발톱 깎을 때 천천히 부탁드려요.'],
      ['이준호', '010-5550-0102', 'junho.lee@example.com', null, null, null],
      ['박서연', '010-5550-0103', 'seoyeon.park@example.com', '박민준', '010-5550-0203', '미용 후 사진 보내 주세요.'],
      ['최민재', '010-5550-0104', 'minjae.choi@example.com', null, null, null],
      ['정유나', '010-5550-0105', 'yuna.jung@example.com', '정하준', '010-5550-0205', null],
      ['한지우', '010-5550-0106', 'jiwoo.han@example.com', null, null, '예약 전에 문자 주세요.'],
      ['오세린', '010-5550-0107', 'serin.oh@example.com', '오지훈', '010-5550-0207', null],
      ['윤태오', '010-5550-0108', 'taeo.yoon@example.com', null, null, null],
    ];
    const gIds: number[] = [];
    for (const g of guardians) {
      const r = await client.query(
        `INSERT INTO guardians (name, phone, email, emergency_name, emergency_phone, message)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        g,
      );
      gIds.push(r.rows[0].id);
    }

    // [보호자 순번, 이름, 견종, 성별, 나이, 몸무게, 생일]
    const dogs: [number, string, string, string, number, number, string | null][] = [
      [0, '몽실이', '말티즈', '암컷', 4, 3.5, '2022-03-14'],
      [0, '보리', '푸들', '수컷', 2, 4.2, '2024-06-02'],
      [1, '초코', '푸들', '수컷', 6, 5.8, '2020-11-21'],
      [2, '구름이', '비숑', '암컷', 3, 6.1, '2023-04-09'],
      [2, '두부', '포메라니안', '수컷', 5, 2.9, null],
      [2, '별이', '시츄', '암컷', 8, 7.4, '2018-08-30'],
      [3, '콩이', '치와와', '암컷', 1, 2.1, '2025-02-17'],
      [4, '밤톨이', '웰시코기', '수컷', 4, 11.5, '2022-09-05'],
      [5, '루비', '골든리트리버', '암컷', 3, 27.3, '2023-01-26'],
      [6, '하루', '믹스견', '수컷', 7, 8.8, null],
      [6, '달이', '말티즈', '암컷', 2, 3.2, '2024-10-11'],
      [7, '쿠키', '푸들', '암컷', 5, 4.9, '2021-05-19'],
    ];
    const dIds: number[] = [];
    for (const d of dogs) {
      const r = await client.query(
        `INSERT INTO dogs (guardian_id, name, breed, gender, age, weight, birthday)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [gIds[d[0]], d[1], d[2], d[3], d[4], d[5], d[6]],
      );
      dIds.push(r.rows[0].id);
    }

    const groomers = [
      ['강다은', '010-5550-0301', '근무중'],
      ['송민기', '010-5550-0302', '근무중'],
      ['임수빈', '010-5550-0303', '근무중'],
      ['배진우', '010-5550-0304', '퇴사'],
    ];
    const grIds: number[] = [];
    for (const g of groomers) {
      const r = await client.query(
        'INSERT INTO groomers (name, phone, status) VALUES ($1,$2,$3) RETURNING id',
        g,
      );
      grIds.push(r.rows[0].id);
    }

    // [강아지 순번, 내용, 며칠 전]
    const notes: [number, string, number][] = [
      [0, '발톱 깎을 때 예민해요. 천천히 달래 주세요.', 120],
      [0, '귀 청소는 싫어해서 짧게 해 주세요.', 30],
      [2, '드라이기 소리를 무서워해요.', 90],
      [3, '얼굴 주변을 만지면 으르렁거려요. 조심!', 60],
      [3, '미용 후 간식(닭가슴살) 주면 좋아해요.', 14],
      [5, '관절이 약해서 오래 세워 두지 않기.', 45],
      [8, '털이 많이 빠져요. 목욕 시간을 넉넉히.', 20],
      [9, '다른 강아지와 같이 두면 흥분해요.', 10],
    ];
    for (const n of notes) {
      await client.query(
        `INSERT INTO dog_notes (dog_id, content, created_at)
         VALUES ($1,$2, now() - ($3 || ' days')::interval)`,
        [dIds[n[0]], n[1], String(n[2])],
      );
    }

    // [강아지 순번, 관리사 순번, 며칠 전, 스타일, 가격, 메모]
    const records: [number, number, number, string, number, string | null][] = [
      [0, 0, 2, '가위컷', 45000, '귀 주변 둥글게 잘랐어요.'],
      [1, 0, 2, '전체 클리핑', 40000, null],
      [2, 1, 3, '목욕만', 25000, '피부 상태 양호.'],
      [3, 2, 5, '가위컷', 55000, '얼굴 라인은 짧게.'],
      [4, 2, 5, '위생미용', 20000, null],
      [5, 1, 7, '목욕만', 30000, '관절 때문에 짧게 진행.'],
      [6, 0, 8, '부분미용', 18000, '첫 방문이었어요.'],
      [7, 1, 10, '전체 클리핑', 50000, null],
      [8, 2, 12, '목욕만', 60000, '털 빠짐 많음.'],
      [9, 0, 14, '위생미용', 22000, null],
      [10, 0, 14, '가위컷', 42000, '리본 달아 드렸어요.'],
      [11, 1, 18, '전체 클리핑', 40000, null],
      [0, 0, 32, '가위컷', 45000, '지난번과 같은 스타일.'],
      [1, 2, 35, '목욕만', 25000, null],
      [2, 1, 40, '전체 클리핑', 45000, null],
      [3, 2, 44, '가위컷', 55000, null],
      [5, 1, 50, '위생미용', 22000, null],
      [7, 3, 55, '전체 클리핑', 50000, null],
      [8, 2, 62, '목욕만', 60000, null],
      [9, 0, 70, '부분미용', 18000, null],
      [4, 2, 75, '위생미용', 20000, null],
      [11, 3, 80, '가위컷', 48000, '구름 모양으로 다듬었어요.'],
      [6, 0, 90, '목욕만', 20000, null],
      [10, 1, 100, '전체 클리핑', 38000, null],
      [0, 3, 120, '가위컷', 45000, null],
    ];
    for (const r of records) {
      await client.query(
        `INSERT INTO grooming_records (dog_id, groomer_id, groomed_at, style, price, memo)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [dIds[r[0]], grIds[r[1]], daysAgo(r[2]), r[3], r[4], r[5]],
      );
    }

    const notices = [
      ['추석 연휴 영업 안내', '연휴 기간에는 오전 10시부터 오후 3시까지만 운영해요. 예약은 미리 전화 주세요.', 20],
      ['여름철 털 관리 안내', '더운 날씨에는 짧은 미용을 추천드려요. 상담은 언제든 환영이에요.', 8],
      ['주차 안내', '매장 앞 주차 공간이 좁아요. 건물 뒤편 주차장을 이용해 주세요.', 2],
    ];
    for (const n of notices) {
      await client.query(
        `INSERT INTO notices (title, content, created_at)
         VALUES ($1,$2, now() - ($3 || ' days')::interval)`,
        [n[0], n[1], String(n[2])],
      );
    }

    // [제목, 내용, 시작일(며칠 전), 종료일(며칠 전, 음수면 앞으로)]
    const events = [
      ['첫 방문 10% 할인', '처음 오시는 강아지는 미용 요금을 10% 깎아 드려요.', 10, -40],
      ['생일 강아지 리본 선물', '생일이 있는 달에는 예쁜 리본을 무료로 달아 드려요.', 5, -25],
      ['친구 소개 이벤트', '친구를 소개해 주시면 다음 목욕이 1회 무료예요.', -3, -60],
    ];
    for (const e of events) {
      await client.query(
        'INSERT INTO events (title, content, start_date, end_date) VALUES ($1,$2,$3,$4)',
        [e[0], e[1], daysAgo(e[2] as number), daysAgo(e[3] as number)],
      );
    }

    await client.query('COMMIT');
    console.log('가상 데이터를 채워 넣었어요.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
