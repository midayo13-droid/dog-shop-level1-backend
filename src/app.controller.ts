import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { query } from './common/db.js';
import { BREEDS, GENDERS, GROOMER_STATUSES, STYLES } from './common/validation.js';

@Controller()
export class AppController {
  /** 서버와 DB 가 잘 연결되어 있는지 확인해요. */
  @Get('health')
  async health() {
    try {
      await query('SELECT 1');
      return { status: '정상', server: 'ok', database: 'ok', time: new Date().toISOString() };
    } catch (error) {
      console.error('DB 연결 확인 실패:', error);
      throw new ServiceUnavailableException({
        status: '이상',
        server: 'ok',
        database: 'error',
        message: 'DB 연결에 실패했어요.',
      });
    }
  }

  /** 고르는 칸에 보여 줄 목록 */
  @Get('options')
  options() {
    return { breeds: BREEDS, genders: GENDERS, styles: STYLES, groomerStatuses: GROOMER_STATUSES };
  }

  /** 메인 화면에 보여 줄 최근 목록 모음 */
  @Get('summary')
  async summary() {
    const [dogs, guardians, records, groomers, notices, events] = await Promise.all([
      query(
        `SELECT d.id, d.name, d.breed, d.gender, d.age, g.name AS guardian_name
           FROM dogs d JOIN guardians g ON g.id = d.guardian_id
          ORDER BY d.id DESC LIMIT 6`,
      ),
      query(
        `SELECT g.id, g.name, g.phone,
                (SELECT COUNT(*) FROM dogs d WHERE d.guardian_id = g.id)::int AS dog_count
           FROM guardians g ORDER BY g.id DESC LIMIT 6`,
      ),
      query(
        `SELECT r.id, r.groomed_at, r.style, r.price, d.id AS dog_id, d.name AS dog_name, gr.name AS groomer_name
           FROM grooming_records r
           JOIN dogs d ON d.id = r.dog_id
           JOIN groomers gr ON gr.id = r.groomer_id
          ORDER BY r.groomed_at DESC, r.id DESC LIMIT 5`,
      ),
      query(
        `SELECT id, name, status FROM groomers ORDER BY (status = '근무중') DESC, id LIMIT 6`,
      ),
      query('SELECT id, title, created_at FROM notices ORDER BY created_at DESC, id DESC LIMIT 3'),
      query(
        `SELECT id, title, start_date, end_date, (CURRENT_DATE BETWEEN start_date AND end_date) AS ongoing
           FROM events ORDER BY (CURRENT_DATE BETWEEN start_date AND end_date) DESC, start_date DESC LIMIT 3`,
      ),
    ]);
    return { dogs, guardians, records, groomers, notices, events };
  }
}
