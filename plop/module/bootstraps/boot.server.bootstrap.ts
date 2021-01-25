import debugImport from 'debug';
const debug = debugImport('modules:{{{lowercase name}}}');

export = async () => {
  debug('Module "{{{lowercase name}}}" bootstraped');
};
