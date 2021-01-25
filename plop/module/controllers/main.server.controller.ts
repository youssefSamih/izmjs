/**
 * Check if the module "{{{lowercase name}}}" is up and running
 * @controller Check "{{{lowercase name}}}" module
 * @param {import('express').Request} _req The request
 * @param {import('express').Response} res The response
 */
const ok = async function ok(_req: any, res: { json: (arg0: boolean) => void }) {
  res.json(true);
};

export default ok;
