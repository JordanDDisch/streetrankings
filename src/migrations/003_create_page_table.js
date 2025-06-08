/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('sessions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('session_token').unique().notNullable();
    table.uuid('user_id').notNullable();
    table.timestamp('expires_at').notNullable();
    table.string('ip_address');
    table.string('user_agent');
    table.string('device_info');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_accessed_at').defaultTo(knex.fn.now());
    table.timestamps(true, true); // created_at and updated_at with default values
    
    // Foreign key constraint
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['session_token']);
    table.index(['user_id']);
    table.index(['expires_at']);
    table.index(['is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('sessions');
}; 