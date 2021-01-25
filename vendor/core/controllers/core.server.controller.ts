import config from '@config/index';

const { vendor } = (config as any).files.server.modules;

/**
 * Render the main application page
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const renderIndex = async function renderIndex(
  req: { user: { toJSON: (arg0: { virtuals: boolean }) => any } },
  res: { render: (arg0: string, arg1: { user: any }) => void },
) {
  res.render(`${vendor}/core/views/index`, {
    user: req.user ? req.user.toJSON({ virtuals: true }) : null,
  });
};

/**
 * Render the server error page
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const renderServerError = async function renderServerError(
  req: { i18n: { setDefaultNamespace: (arg0: string) => void }; t: (arg0: string) => any },
  res: {
    status: (
      arg0: number,
    ) => {
      (): any;
      new (): any;
      render: { (arg0: string, arg1: { title: any; error: any }): void; new (): any };
    };
  },
) {
  req.i18n.setDefaultNamespace('vendor:core');
  res.status(500).render(`${vendor}/core/views/500`, {
    title: req.t('ERROR_500_TITLE'),
    error: req.t('ERROR_500'),
  });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
export const renderNotFound = async function renderNotFound(
  req: {
    i18n: { setDefaultNamespace: (arg0: string) => void };
    t: (arg0: string, arg1?: { url: any } | undefined) => any;
    originalUrl: any;
  },
  res: {
    status: (
      arg0: number,
    ) => {
      (): any;
      new (): any;
      format: {
        (arg0: { 'text/html': () => void; 'application/json': () => void; default(): void }): void;
        new (): any;
      };
    };
    render: (arg0: string, arg1: { title: any; details: any }) => void;
    json: (arg0: { error: any }) => void;
    send: (arg0: any) => void;
  },
) {
  req.i18n.setDefaultNamespace('vendor:core');
  res.status(404).format({
    'text/html': () => {
      res.render(`${vendor}/core/views/404`, {
        title: req.t('PAGE_NOT_FOUND_TITLE'),
        details: req.t('PAGE_NOT_FOUND_DETAILS', {
          url: req.originalUrl,
        }),
      });
    },
    'application/json': () => {
      res.json({
        error: req.t('ERROR_404'),
      });
    },
    default() {
      res.send(req.t('ERROR_404'));
    },
  });
};
