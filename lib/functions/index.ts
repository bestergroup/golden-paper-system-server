import { Knex } from 'knex';
import { puppeteerConfig } from 'lib/static/pdf';
import puppeteer, { Browser, Page as PuppeteerPage } from 'puppeteer';
import { Limit, Page } from 'src/types/global';

export const generatePaginationInfo = async <T>(
  table: Knex.QueryBuilder<T>,
  page: Page,
  limit: Limit,
  deleted: boolean,
  dept?: boolean,
): Promise<{
  total: number;
  hasNextPage: boolean;
}> => {
  const totalItems = deleted
    ? !dept
      ? await table.where('deleted', true).count({ count: '*' }).first()
      : await table
          .where('deleted', true)
          .andWhere('dept', true)
          .count({ count: '*' })
          .first()
    : !dept
      ? await table.where('deleted', false).count({ count: '*' }).first()
      : await table
          .where('deleted', false)
          .andWhere('dept', true)
          .count({ count: '*' })
          .first();

  const total = parseInt(totalItems.count as string, 10);
  const hasNextPage = page * limit < total;
  return { total, hasNextPage };
};

export function formatTimestampToDate(timestamp: number): string {
  const date = new Date(timestamp);
  const formattedDate = date.toLocaleDateString('en-GB');
  return formattedDate;
}

export function timestampToDateString(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
export function formatDateToDDMMYY(dateString: string): string {
  const date = new Date(dateString);

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = String(date.getUTCFullYear());
  return `${day}/${month}/${year}`;
}

export function formatMoney(value: any): string {
  const numValue = Number(value);

  if (isNaN(numValue) || value === null || value === undefined) {
    return '0';
  }

  return numValue
    .toFixed(0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export const generatePuppeteer = async ({
  pageViewW = 1080,
  pageViewH = 1024,
}: {
  pageViewW?: number;
  pageViewH?: number;
}): Promise<{
  browser: Browser;
  page: PuppeteerPage;
}> => {
  try {
    const browser: Browser = await puppeteer.launch(puppeteerConfig);
    const page: PuppeteerPage = await browser.newPage();
    await page.setViewport({ width: pageViewW, height: pageViewH });

    return { browser, page };
  } catch (error) {
    throw new Error(error.message);
  }
};
