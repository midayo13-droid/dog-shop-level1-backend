import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
import { query, queryOne } from '../common/db.js';
import { Checker, likePattern, parseId } from '../common/validation.js';

/** 공지사항 */
@Controller('notices')
export class NoticesController {
  private check(body: any) {
    const c = new Checker();
    const value = {
      title: c.text(body, 'title', '제목', { required: true, max: 50 }),
      content: c.text(body, 'content', '내용', { required: true, max: 1000 }),
    };
    c.done();
    return value;
  }

  @Get()
  list(@Query('q') q?: string) {
    return query(
      `SELECT id, title, content, created_at FROM notices
        WHERE $1::text IS NULL OR title ILIKE $1
        ORDER BY created_at DESC, id DESC`,
      [likePattern(q)],
    );
  }

  @Get(':id')
  async detail(@Param('id') idText: string) {
    const row = await queryOne('SELECT * FROM notices WHERE id = $1', [parseId(idText)]);
    if (!row) throw new NotFoundException('공지사항을 찾을 수 없어요. 이미 삭제되었을 수 있어요.');
    return row;
  }

  @Post()
  create(@Body() body: any) {
    const v = this.check(body);
    return queryOne('INSERT INTO notices (title, content) VALUES ($1,$2) RETURNING *', [v.title, v.content]);
  }

  @Put(':id')
  async update(@Param('id') idText: string, @Body() body: any) {
    const id = parseId(idText);
    const v = this.check(body);
    const row = await queryOne('UPDATE notices SET title=$1, content=$2 WHERE id=$3 RETURNING *', [
      v.title,
      v.content,
      id,
    ]);
    if (!row) throw new NotFoundException('공지사항을 찾을 수 없어요. 이미 삭제되었을 수 있어요.');
    return row;
  }

  @Delete(':id')
  async remove(@Param('id') idText: string) {
    const rows = await query('DELETE FROM notices WHERE id = $1 RETURNING id', [parseId(idText)]);
    if (rows.length === 0) throw new NotFoundException('공지사항을 찾을 수 없어요. 이미 삭제되었을 수 있어요.');
    return { message: '삭제했어요.' };
  }
}

/** 이벤트 */
@Controller('events')
export class EventsController {
  private check(body: any) {
    const c = new Checker();
    const value = {
      title: c.text(body, 'title', '제목', { required: true, max: 50 }),
      content: c.text(body, 'content', '내용', { required: true, max: 1000 }),
      start_date: c.date(body, 'start_date', '시작일', { required: true }),
      end_date: c.date(body, 'end_date', '종료일', { required: true }),
    };
    if (value.start_date && value.end_date && value.end_date < value.start_date) {
      c.fail('end_date', '종료일은 시작일 이후로 골라 주세요.');
    }
    c.done();
    return value;
  }

  @Get()
  list(@Query('q') q?: string) {
    return query(
      `SELECT id, title, content, start_date, end_date, created_at,
              (CURRENT_DATE BETWEEN start_date AND end_date) AS ongoing
         FROM events
        WHERE $1::text IS NULL OR title ILIKE $1
        ORDER BY start_date DESC, id DESC`,
      [likePattern(q)],
    );
  }

  @Get(':id')
  async detail(@Param('id') idText: string) {
    const row = await queryOne(
      `SELECT *, (CURRENT_DATE BETWEEN start_date AND end_date) AS ongoing FROM events WHERE id = $1`,
      [parseId(idText)],
    );
    if (!row) throw new NotFoundException('이벤트를 찾을 수 없어요. 이미 삭제되었을 수 있어요.');
    return row;
  }

  @Post()
  create(@Body() body: any) {
    const v = this.check(body);
    return queryOne(
      'INSERT INTO events (title, content, start_date, end_date) VALUES ($1,$2,$3,$4) RETURNING *',
      [v.title, v.content, v.start_date, v.end_date],
    );
  }

  @Put(':id')
  async update(@Param('id') idText: string, @Body() body: any) {
    const id = parseId(idText);
    const v = this.check(body);
    const row = await queryOne(
      'UPDATE events SET title=$1, content=$2, start_date=$3, end_date=$4 WHERE id=$5 RETURNING *',
      [v.title, v.content, v.start_date, v.end_date, id],
    );
    if (!row) throw new NotFoundException('이벤트를 찾을 수 없어요. 이미 삭제되었을 수 있어요.');
    return row;
  }

  @Delete(':id')
  async remove(@Param('id') idText: string) {
    const rows = await query('DELETE FROM events WHERE id = $1 RETURNING id', [parseId(idText)]);
    if (rows.length === 0) throw new NotFoundException('이벤트를 찾을 수 없어요. 이미 삭제되었을 수 있어요.');
    return { message: '삭제했어요.' };
  }
}
