/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('username').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('first_name');
    table.string('last_name');
    table.string('avatar_url');
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    table.timestamps(true, true); // created_at and updated_at with default values
    
    // Indexes
    table.index(['email']);
    table.index(['username']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
}; 