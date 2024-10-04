import { Knex } from 'knex';
import { Limit, Page } from 'src/types/global';

export const generatePaginationInfo = async <T>(
  table: Knex.QueryBuilder<T>,
  page: Page,
  limit: Limit,
  deleted: boolean,
  reservation?: boolean,
  year?: number,
  month?: number,
  day?: number,
): Promise<{
  total: number;
  hasNextPage: boolean;
}> => {
  const totalItems = deleted
    ? !reservation
      ? await table.where('deleted', true).count({ count: '*' }).first()
      : await table
          .where('deleted', true)
          .count({ count: '*' })
          .andWhere(function () {
            // Filtering by month and year
            this.whereRaw('EXTRACT(YEAR FROM reservation.date_time) = ?', [
              year,
            ])
              .andWhereRaw('EXTRACT(MONTH FROM reservation.date_time) = ?', [
                month,
              ])
              .andWhereRaw('EXTRACT(DAY FROM reservation.date_time) = ?', [
                day,
              ]);
          })
          .first()
    : !reservation
      ? await table.where('deleted', false).count({ count: '*' }).first()
      : await table
          .where('deleted', false)
          .count({ count: '*' })
          .andWhere(function () {
            // Filtering by month and year
            this.whereRaw('EXTRACT(YEAR FROM reservation.date_time) = ?', [
              year,
            ]).andWhereRaw('EXTRACT(MONTH FROM reservation.date_time) = ?', [
              month,
            ]);
          })
          .first();
  const total = parseInt(totalItems.count as string, 10);
  const hasNextPage = page * limit < total;
  return { total, hasNextPage };
};

export async function checkCityInTables(
  cityId: number,
  tables: Knex.QueryBuilder<any, any>[],
): Promise<boolean> {
  for (const table of tables) {
    const result = await table
      .where('city_id', cityId)
      .count('id as count')
      .first();

    if (result && result.count > 0) {
      return true;
    }
  }
  return false;
}
export function formatTimestampToDate(timestamp: number): string {
  const date = new Date(timestamp);
  const formattedDate = date.toLocaleDateString('en-GB');

  return formattedDate;
}

export function timestampToDateString(timestamp: number): string {
  // Create a Date object from the timestamp
  const date = new Date(timestamp);

  // Extract year, month, and day from the Date object
  const year = date.getFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getUTCDate() + 1).padStart(2, '0');

  // Format the date string as YYYY-MM-DD
  return `${year}-${month}-${day}`;
}
