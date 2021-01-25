const core = require('../controllers/core.server.controller');

export default (app: {
  route: (arg0: string) => { (): any; new (): any; get: { (arg0: any): void; new (): any } };
}) => {
  // Define error pages
  app.route('/server-error').get(core.renderServerError);

  // Return a 404 for all undefined api, module or lib routes
  app.route('/:url(api)/*').get(core.renderNotFound);

  // Define application route
  app.route('/').get(core.renderIndex);
  app.route('/*').get(core.renderNotFound);
};
