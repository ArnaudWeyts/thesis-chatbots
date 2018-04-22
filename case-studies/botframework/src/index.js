import restify from 'restify';

import app from './app';

let server = restify.createServer();

const createNewServer = () => {
  const newServer = restify.createServer();
  newServer.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log('%s Started new server at %s', newServer.name, newServer.url);
  });
  app(newServer);
  server = newServer;
};

createNewServer();

if (module.hot) {
  module.hot.accept('./app', () => {
    server.close(createNewServer);
  });
}
