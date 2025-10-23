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
      // Check if identifier is email or username
      const identifier = username.toLowerCase();

      // Find user by username or email in regular users table
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [
            { username: identifier },
            { email: identifier }
          ]
        },
        populate: ['role']
      });

      if (!user) {
        ctx.status = 400;
        return ctx.send({
          success: false,
          message: 'Invalid username or password',
          errors: ['User not found']
        });
      }

      // Verify password using bcrypt directly (more reliable)
      const bcrypt = require('bcryptjs');
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        ctx.status = 400;
        return ctx.send({
          success: false,
          message: 'Invalid username or password',
          errors: ['Invalid password']
        });
      }

      // Check if user is blocked
      if (user.blocked) {
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
            username: user.username,
            role: user.role?.name || 'authenticated',
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
      const bcrypt = require('bcryptjs');
      const validPassword = await bcrypt.compare(oldPassword, fullUser.password);

      if (!validPassword) {
        ctx.status = 400;
        return ctx.send({
          success: false,
          message: 'Current password is incorrect',
          errors: ['Invalid old password']
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

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
