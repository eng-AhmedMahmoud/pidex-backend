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
    // Create frontend admin user from environment variables if it doesn't exist
    const adminUsername = process.env.ADMIN_USERNAME || 'pidexadmin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'pidex@123';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pidex-store.com';

    try {
      // Check if user already exists
      const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [
            { username: adminUsername },
            { email: adminEmail }
          ]
        }
      });

      if (!existingUser) {
        strapi.log.info('🔧 Creating frontend admin user from environment variables...');

        // Get the "authenticated" role (default role for regular users)
        const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
          where: { type: 'authenticated' }
        });

        if (!authenticatedRole) {
          strapi.log.error('❌ Authenticated role not found!');
          return;
        }

        // Hash the password
        const passwordService = strapi.plugin('users-permissions').service('user');
        const hashedPassword = await passwordService.hashPassword({ password: adminPassword });

        // Create the user
        const newUser = await strapi.entityService.create('plugin::users-permissions.user', {
          data: {
            username: adminUsername,
            email: adminEmail,
            password: hashedPassword,
            role: authenticatedRole.id,
            confirmed: true,
            blocked: false
          }
        });

        strapi.log.info(`✅ Frontend admin user created successfully: ${newUser.username}`);
        strapi.log.info(`📧 Email: ${newUser.email}`);
      } else {
        strapi.log.info(`ℹ️  Frontend admin user already exists: ${existingUser.username} (${existingUser.email})`);
      }
    } catch (error) {
      strapi.log.error('❌ Error creating frontend admin user:', error);
    }
  },
};
