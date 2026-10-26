import { Body, ConflictException, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
import { query, queryOne } from '../common/db.js';
import { Checker, GROOMER_STATUSES, likePattern, parseId } from '../common/validation.js';

function validateGroomer(body: any) {
  const c = new Checker();
  const value = {
    name: c.text(body, 'name', '이름', { required: true, min: 2, max: 20 }),
    phone: c.phone(body, 'phone', '휴대폰 번호', true),
    status: c.choice(body, 'status', '근무 상태', GROOMER_STATUSES, true),
  };
  c.done();
  return value;
}

async function findGroomer(id: number) {
  const groomer = await queryOne('SELECT * FROM groomers WHERE id = $1', [id]);
  if (!groomer) throw new NotFoundException('관리사 정보를 찾을 수 없어요. 이미 삭제되었을 수 있어요.');
  return groomer;
}

@Controller('groomers')
export class GroomersController {
  /** 관리사 목록 + 이름 검색 (status=근무중 으로 근무 중인 사람만 볼 수 있어요) */
  @Get()
  async list(@Query('q') q?: string, @Query('status') status?: string) {
    const like = likePattern(q);
    return query(
      `SELECT g.id, g.name, g.phone, g.status, g.created_at,
              (SELECT COUNT(*) FROM grooming_records r WHERE r.groomer_id = g.id)::int AS record_count
         FROM groomers g
        WHERE ($1::text IS NULL OR g.name ILIKE $1)
          AND ($2::text IS NULL OR g.status = $2)
        ORDER BY (g.status = '근무중') DESC, g.id`,
      [like, GROOMER_STATUSES.includes(status ?? '') ? status : null],
    );
  }

  @Get(':id')
  async detail(@Param('id') idText: string) {
    return findGroomer(parseId(idText));
  }

  @Post()
  async create(@Body() body: any) {
    const v = validateGroomer(body);
    return queryOne('INSERT INTO groomers (name, phone, status) VALUES ($1,$2,$3) RETURNING *', [
      v.name,
      v.phone,
      v.status,
    ]);
  }

  @Put(':id')
  async update(@Param('id') idText: string, @Body() body: any) {
    const id = parseId(idText);
    await findGroomer(id);
    const v = validateGroomer(body);
    return queryOne('UPDATE groomers SET name=$1, phone=$2, status=$3 WHERE id=$4 RETURNING *', [
      v.name,
      v.phone,
      v.status,
      id,
    ]);
  }

  /** 미용기록이 있는 관리사는 삭제하지 않고 "퇴사"로 바꾸게 안내해요. */
  @Delete(':id')
  async remove(@Param('id') idText: string) {
    const id = parseId(idText);
    await findGroomer(id);
    const [{ count }] = await query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM grooming_records WHERE groomer_id = $1',
      [id],
    );
    if (count > 0) {
      throw new ConflictException('미용기록이 있는 관리사는 삭제할 수 없어요. 근무 상태를 "퇴사"로 바꿔 주세요.');
    }
    await query('DELETE FROM groomers WHERE id = $1', [id]);
    return { message: '삭제했어요.' };
  }
}
