// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Configure public permissions for API access
    try {
      strapi.log.info('🔧 Configuring public API permissions...');

      // Get the public role
      const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' }
      });

      if (!publicRole) {
        strapi.log.error('❌ Public role not found!');
        return;
      }

      // Define the permissions we want to enable
      const permissionsToEnable = [
        { controller: 'category', action: 'find' },
        { controller: 'category', action: 'findOne' },
        { controller: 'product', action: 'find' },
        { controller: 'product', action: 'findOne' },
        { controller: 'order', action: 'create' },
        { controller: 'order', action: 'find' },
        { controller: 'order', action: 'findOne' },
      ];

      // Enable each permission
      for (const perm of permissionsToEnable) {
        const permission = await strapi.query('plugin::users-permissions.permission').findOne({
          where: {
            action: `api::${perm.controller}.${perm.controller}.${perm.action}`,
            role: publicRole.id,
          }
        });

        if (permission && !permission.enabled) {
          await strapi.query('plugin::users-permissions.permission').update({
            where: { id: permission.id },
            data: { enabled: true }
          });
          strapi.log.info(`✅ Enabled public permission: ${perm.controller}.${perm.action}`);
        } else if (permission) {
          strapi.log.info(`ℹ️  Permission already enabled: ${perm.controller}.${perm.action}`);
        } else {
          strapi.log.warn(`⚠️  Permission not found: ${perm.controller}.${perm.action}`);
        }
      }

      strapi.log.info('✅ Public API permissions configured successfully!');
    } catch (error) {
      strapi.log.error('❌ Error configuring public permissions:', error);
    }
  },
};
