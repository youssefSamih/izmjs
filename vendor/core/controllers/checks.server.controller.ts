/**
 * Simple request check, just send a "true" word
 * @param {import('express').Request} _req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export async function ok(_req: any, res: { json: (arg0: boolean) => void }) {
  res.json(true);
}
