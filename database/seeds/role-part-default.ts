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
    adminParts.push(part);
    switch (val.name) {
      case 'selling':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
      case 'koga':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
      case 'add':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
      case 'psula':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
      case 'create_psula':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
      case 'dept':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
      case 'less':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
      case 'mandub':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
      case 'customers':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
      case 'expense':
        cashierParts.push(part);
        accountantParts.push(part);

        return;
    }
  });
  rolePartDefault = [...adminParts, ...cashierParts, ...accountantParts];

  await knex('role_part').del();
  await knex('role_part').insert(rolePartDefault);
};

export { seed };
