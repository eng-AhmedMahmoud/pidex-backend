export default {
  routes: [
    {
      method: 'PUT',
      path: '/categories/:id/toggle-status',
      handler: 'category.toggleStatus',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
