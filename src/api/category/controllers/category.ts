import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::category.category', ({ strapi }) => ({
  // Override default find to populate image
  async find(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: {
        image: {
          fields: ['url', 'alternativeText', 'formats'],
        },
      },
    };

    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  // Override default findOne to populate image
  async findOne(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: {
        image: {
          fields: ['url', 'alternativeText', 'formats'],
        },
      },
    };

    const { data, meta } = await super.findOne(ctx);
    return { data, meta };
  },

  // Custom toggle-status endpoint
  async toggleStatus(ctx) {
    const { id } = ctx.params;

    try {
      // Get the current category
      const category = await strapi.entityService.findOne('api::category.category', id);

      if (!category) {
        return ctx.notFound('Category not found');
      }

      // Toggle the isActive status
      const updatedCategory = await strapi.entityService.update('api::category.category', id, {
        data: {
          isActive: !category.isActive,
        },
      });

      // Populate image before returning
      const populated = await strapi.entityService.findOne('api::category.category', id, {
        populate: {
          image: {
            fields: ['url', 'alternativeText', 'formats'],
          },
        },
      });

      return { data: populated };
    } catch (error) {
      strapi.log.error('Toggle category status error:', error);
      return ctx.badRequest('Failed to toggle category status');
    }
  },
}));
