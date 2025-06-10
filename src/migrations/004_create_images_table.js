/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('images', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('image_url').notNullable();
    table.string('image_description').notNullable();
    table.string('image_alt').notNullable();
    table.string('image_caption').notNullable();
    table.uuid('page_id'); // Make page_id optional since an image can belong to multiple pages
    table.specificType('page_ids', 'uuid[]').defaultTo('{}'); // Array of page IDs that this image belongs to
    table.timestamps(true, true); // created_at and updated_at with default values
    
    // Foreign key constraint
    table.foreign('page_id').references('id').inTable('pages').onDelete('CASCADE');

    // Indexes
    table.index(['image_url']);
    table.index(['page_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('images');
}; 