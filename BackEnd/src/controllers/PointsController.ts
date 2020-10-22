import { Request, Response } from 'express';
import knex from '../database/connection';

export default class PointController {
  async index(request: Request, response: Response) {
    const { city, uf, items } = request.query;

    const parsedItems = String(items)
      .split(',')
      .map(item => Number(item.trim()));

    const points = await knex('points')
      .join('point_items', 'points.id', '=', 'points_items.point_id')
      .whereIn('point_items.item_id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*');

    return response.json(points);
  }

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const point = await knex('points').where('id', id).first();

    if (!point) {
      return response.status(400).json({ message: 'Point not found' });
    }

    const items = await knex('items')
      .join('point_items', 'items.id', '=', 'point_items.item_id')
      .where('point_items.point_id', id)
      .select('items.title');

    return response.json({ point, items });
  }

  async create(request: Request, response: Response) {
    const {
      name,
      email,
      whatsapp,
      city,
      uf,
      latitude,
      longitude,
      items,
    } = request.body;

    const trx = await knex.transaction();

    const point = {
      image:
        'https://img.resized.co/lovindublin_com/eyJkYXRhIjoie1widXJsXCI6XCJodHRwczpcXFwvXFxcL2ltYWdlcy5sb3ZpbmR1Ymxpbi5jb21cXFwvdXBsb2Fkc1xcXC8yMDIwXFxcLzA4XFxcLzEzMTEyMTI3XFxcL1NjcmVlbi1TaG90LTIwMjAtMDgtMTMtYXQtMTEuMjAuMDAucG5nXCIsXCJ3aWR0aFwiOjY0NyxcImhlaWdodFwiOjM0MCxcImRlZmF1bHRcIjpcImh0dHBzOlxcXC9cXFwvZDI2aGUwMzhhNzBkZ3MuY2xvdWRmcm9udC5uZXRcXFwvd3AtY29udGVudFxcXC90aGVtZXNcXFwvbG92aW5cXFwvYXNzZXRzXFxcL2ltZ1xcXC9jYXJkLWRlZmF1bHQtbG92aW4tZHVibGluLnBuZ1wiLFwib3B0aW9uc1wiOltdfSIsImhhc2giOiIyYWViZTA1MWRiZjg4ZWQ0N2NhNDQxNDRhM2Y5MGI4OTRhNzVkYWIzIn0=/a-french-style-mini-food-market-is-happening-in-dublin-tomorrow.png',
      name,
      email,
      whatsapp,
      city,
      uf,
      latitude,
      longitude,
    };

    const insertedIds = await trx('points').insert(point);

    const point_id = insertedIds[0];

    const pointItems = items.map((item_id: number) => {
      return {
        item_id,
        point_id,
      };
    });

    await trx('point_items').insert(pointItems);

    await trx.commit();

    return response.json({
      id: point_id,
      ...point,
    });
  }
}
