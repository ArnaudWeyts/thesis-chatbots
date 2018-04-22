import test from 'ava';
import restify from 'restify';
import * as builder from 'botbuilder';

test('Set up without crashing', (t) => {
  // Create server
  const server = restify.createServer();

  server.listen(process.env.port || process.env.PORT || 3978);

  const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
  });

  const bot = new builder.UniversalBot(connector, (session) => {
    session.send('You said: %s', session.message.text);
  });

  server.post('/api/messages', connector.listen());

  // Close server again
  server.close();

  t.pass();
});

test.cb('Sending start message', (t) => {
  t.plan(1);

  const connector = new builder.ConsoleConnector();
  const bot = new builder.UniversalBot(connector);

  bot.on('conversationUpdate', (message) => {
    if (message.membersAdded) {
      message.membersAdded.forEach((identity) => {
        if (identity.id === message.address.bot.id) {
          bot.beginDialog(message.address, '/welcome');
        }
      });
    }
  });

  bot.dialog('/welcome', (session) => {
    session.send("Hello, I'm SIBA, what would you like to do?");
  });

  bot.on('send', (message) => {
    t.is(message.text, "Hello, I'm SIBA, what would you like to do?");
    t.end();
  });

  const event = {
    address: { bot: { id: '0' }, user: { id: 0 } },
    agent: 'botbuilder',
    source: 'facebook',
    sourceEvent: '',
    type: 'conversationUpdate',
    membersAdded: [{ id: '0', isGroup: false, name: 'test' }],
    user: { id: '0', isGroup: false, name: 'test' },
  };

  connector.processEvent(event);
});
