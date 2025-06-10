/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('pages', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('page_name').notNullable();
    table.string('page_url').notNullable();
    table.string('page_description').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true); // created_at and updated_at with default values
    
    // Indexes
    table.index(['page_name']);
    table.index(['page_url']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('pages');
}; 