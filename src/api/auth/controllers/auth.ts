export default {
  // Login endpoint matching the old API structure
  async login(ctx) {
    const { username, password } = ctx.request.body;

    if (!username || !password) {
      ctx.status = 400;
      return ctx.send({
        success: false,
        message: 'Username and password are required',
        errors: ['Missing credentials']
      });
    }

    try {
      const identifier = username.toLowerCase();
      let user = null;
      let isAdminUser = false;

      // First, try to find in regular users (plugin::users-permissions.user)
      user = await strapi.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [
            { username: identifier },
            { email: identifier }
          ]
        },
        populate: ['role']
      });

      // If not found, try admin users (admin::user)
      if (!user) {
        const adminUser = await strapi.query('admin::user').findOne({
          where: {
            $or: [
              { username: identifier },
              { email: identifier }
            ]
          }
        });

        if (adminUser) {
          user = adminUser;
          isAdminUser = true;
        }
      }

      if (!user) {
        ctx.status = 400;
        return ctx.send({
          success: false,
          message: 'Invalid username or password',
          errors: ['User not found']
        });
      }

      // Verify password
      let validPassword = false;

      if (isAdminUser) {
        // For admin users, use admin auth service
        const adminAuthService = strapi.admin.services.auth;
        validPassword = await adminAuthService.validatePassword(password, user.password);
      } else {
        // For regular users, use users-permissions service
        validPassword = await strapi
          .plugin('users-permissions')
          .service('user')
          .validatePassword(password, user.password);
      }

      if (!validPassword) {
        ctx.status = 400;
        return ctx.send({
          success: false,
          message: 'Invalid username or password',
          errors: ['Invalid password']
        });
      }

      // Check if user is blocked (only for regular users)
      if (!isAdminUser && user.blocked) {
        ctx.status = 400;
        return ctx.send({
          success: false,
          message: 'Your account has been blocked',
          errors: ['Account blocked']
        });
      }

      // Generate JWT token
      const jwt = strapi
        .plugin('users-permissions')
        .service('jwt')
        .issue({ id: user.id });

      // Return response in the format expected by the frontend
      ctx.send({
        success: true,
        message: 'Login successful',
        data: {
          token: jwt,
          user: {
            id: user.id.toString(),
            username: user.username || user.email,
            role: isAdminUser ? 'admin' : (user.role?.name || 'authenticated'),
            email: user.email
          }
        }
      });
    } catch (error) {
      strapi.log.error('Login error:', error);
      ctx.status = 500;
      return ctx.send({
        success: false,
        message: 'An error occurred during login',
        errors: [error.message]
      });
    }
  },

  // Logout endpoint
  async logout(ctx) {
    // Logout is typically handled client-side by removing the token
    ctx.send({
      success: true,
      message: 'Logged out successfully'
    });
  },

  // Verify token endpoint
  async verify(ctx) {
    try {
      // Get the authenticated user from the context
      const user = ctx.state.user;

      if (user) {
        ctx.send({
          success: true,
          message: 'Token is valid',
          data: {
            id: user.id.toString(),
            username: user.username,
            role: user.role?.name || 'authenticated',
            email: user.email
          }
        });
      } else {
        ctx.status = 401;
        return ctx.send({
          success: false,
          message: 'Invalid or expired token'
        });
      }
    } catch (error) {
      strapi.log.error('Verify token error:', error);
      ctx.status = 401;
      return ctx.send({
        success: false,
        message: 'Invalid or expired token',
        errors: [error.message]
      });
    }
  },

  // Change password endpoint
  async changePassword(ctx) {
    const { oldPassword, newPassword } = ctx.request.body;
    const user = ctx.state.user;

    if (!user) {
      ctx.status = 401;
      return ctx.send({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!oldPassword || !newPassword) {
      ctx.status = 400;
      return ctx.send({
        success: false,
        message: 'Old and new passwords are required',
        errors: ['Missing password fields']
      });
    }

    try {
      // Get full user data with password
      const fullUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: user.id }
      });

      // Verify old password
      const validPassword = await strapi
        .plugin('users-permissions')
        .service('user')
        .validatePassword(oldPassword, fullUser.password);

      if (!validPassword) {
        ctx.status = 400;
        return ctx.send({
          success: false,
          message: 'Current password is incorrect',
          errors: ['Invalid old password']
        });
      }

      // Hash new password
      const passwordService = strapi.plugin('users-permissions').service('user');
      const hashedPassword = await passwordService.hashPassword({ password: newPassword });

      // Update user password
      await strapi.entityService.update('plugin::users-permissions.user', user.id, {
        data: { password: hashedPassword }
      });

      ctx.send({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      strapi.log.error('Change password error:', error);
      ctx.status = 500;
      return ctx.send({
        success: false,
        message: 'Failed to change password',
        errors: [error.message]
      });
    }
  },
};
