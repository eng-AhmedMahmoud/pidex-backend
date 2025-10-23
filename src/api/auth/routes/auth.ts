export default {
  routes: [
    {
      method: 'POST',
      path: '/Auth/login',
      handler: 'auth.login',
      config: {
        auth: false, // No authentication required for login
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/Auth/Logout',
      handler: 'auth.logout',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/Auth/verify',
      handler: 'auth.verify',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/Auth/change-password',
      handler: 'auth.changePassword',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
