import Iam from '../helpers/iam.server.helper';
// Create the chat configuration
export default (io: { use: (arg0: (s: any, next: any) => void) => void }) => {
  const iam = new Iam();

  io.use((s: { request: any }, next: () => any) => {
    const { request: req } = s;
    const roles = req.user && Array.isArray(req.user.roles) ? req.user.roles : ['guest'];

    iam
      .IAMsFromRoles(roles)
      .then((list: any[]) => {
        req.iams = list.map((item: { resource: string | RegExp }) => ({
          ...item,
          resource: new RegExp(item.resource, 'i'),
        }));
        return next();
      })
      .catch(next);
  });
};
