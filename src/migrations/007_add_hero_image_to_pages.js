/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('pages', function(table) {
    table.string('hero_image').nullable(); // URL to the hero image
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('pages', function(table) {
    table.dropColumn('hero_image');
  });
};

