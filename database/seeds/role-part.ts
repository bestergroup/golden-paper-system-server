/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

import { Part, Role } from 'database/types';
import { Knex } from 'knex';

let rolePartDefault = [];

const seed = async function (knex: Knex) {
  let roles: Role[] = await knex<Role>('role').select('*');
  let parts: Part[] = await knex<Part>('part').select('*');

  let superParts = [];
  let adminParts = [];
  let cashierParts = [];
  let accountantParts = [];

  parts.forEach((val: Part, _index: number) => {
    let part = {
      role_id: roles.filter(
        (val: Role, _index: number) => val.name == 'ئەدمین',
      )[0].id,
      part_id: val.id,
      created_at: new Date(),
    };
    let superPart = {
      role_id: roles.filter(
        (val: Role, _index: number) => val.name == 'سوپەر ئەدمین',
      )[0].id,
      part_id: val.id,
      created_at: new Date(),
    };
    adminParts.push(part);
    superParts.push(part);

    switch (val.name) {
      case 'کۆگا':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
      case 'داغڵکردنی مواد':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
      case 'پسولەکان':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
      case 'پسولەی فرۆشتن':
        cashierParts.push(part);
        accountantParts.push(part);

        return;

      case 'کڕیارەکان':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
      case 'خەرجی':
        cashierParts.push(part);
        accountantParts.push(part);
        return;
    }
  });
  rolePartDefault = [
    ...superParts,
    ...adminParts,
    ...cashierParts,
    ...accountantParts,
  ];

  await knex('role_part').del();
  await knex('role_part').insert(rolePartDefault);
};

export { seed };
