import * as builder from 'botbuilder';

import food from './food.json';

export default function (server) {
  const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
  });

  // Bot Storage: Here we register the state storage for your bot.
  // Default store: volatile in-memory store - Only for prototyping!
  const inMemoryStorage = new builder.MemoryBotStorage();

  /**
   * Sets up a universal bot and a default message
   */
  const bot = new builder.UniversalBot(connector, (session) => {
    session.send(
      "Sorry, I didn't get that 🤔. Type 'help' if you need assistance or try a different sentence.",
      session.message.text,
    );
  }).set('storage', inMemoryStorage);

  // Enable Conversation Data persistence
  bot.set('persistConversationData', true);

  // Listen for messages from users
  server.post('/api/messages', connector.listen());

  // Send welcome when conversation with bot is started, by initiating the root dialog
  bot.on('conversationUpdate', (message) => {
    if (message.membersAdded) {
      message.membersAdded.forEach((identity) => {
        if (identity.id === message.address.bot.id) {
          bot.beginDialog(message.address, '/welcome');
        }
      });
    }
  });

  /**
   * Welcome message, gives the user 2 options
   */
  bot.dialog('/welcome', (session) => {
    const msg = new builder.Message(session);
    msg.attachments([
      new builder.ThumbnailCard(session)
        .text('Hey there, how hangry are you right now? Want to order a bite? 🍽')
        .buttons([
          builder.CardAction.imBack(session, 'Order', 'Order'),
          builder.CardAction.openUrl(session, 'https://takeaway.com', 'Website'),
        ]),
    ]);
    session.send(msg);
  });

  /**
   * Order waterfall model
   */
  bot
    .dialog('orderButtonClick', [
      (session) => {
        // initialize order
        session.conversationData.order = [];
        builder.Prompts.confirm(session, 'Thirsty? Want to order any drinks? 🥤');
      },
      (session, { response }, next) => {
        if (response) {
          session.beginDialog('order', { category: 'drinks' });
        } else {
          next();
        }
      },
      (session) => {
        builder.Prompts.confirm(session, 'Want to order any starters?');
      },
      (session, { response }, next) => {
        if (response) {
          session.beginDialog('order', { category: 'starters' });
        } else {
          next();
        }
      },
      (session) => {
        builder.Prompts.confirm(session, 'Want to order any mains?');
      },
      (session, { response }, next) => {
        if (response) {
          session.beginDialog('order', { category: 'mains' });
        } else {
          next();
        }
      },
      (session) => {
        if (session.conversationData.order.length === 0) {
          session.send("Strange, you don't seem very interested in ordering food 🤔, let's try this again.");
          session.replaceDialog('orderButtonClick');
        } else {
          let totalPrice = 0;

          const items = session.conversationData.order.map((item) => {
            const exactItem =
              food.drinks.find(drink => drink.name === item.name) ||
              food.starters.find(starter => starter.name === item.name) ||
              food.mains.find(main => main.name === item.name);
            totalPrice += parseFloat(exactItem.price.substring(1)) * item.quantity;
            return builder.ReceiptItem.create(
              session,
              exactItem.price,
              `${item.quantity}x ${item.name}`,
            ).quantity(item.quantity);
          });

          const card = new builder.ReceiptCard(session)
            .title('Receipt for your order')
            .items(items)
            .total(`$${totalPrice}`)
            .buttons([
              builder.CardAction.openUrl(
                session,
                'https://azure.microsoft.com/en-us/pricing/',
                'More Information',
              ),
            ]);

          const msg = new builder.Message(session);
          msg.attachments([card]);
          session.send(msg);
        }
      },
    ])
    .triggerAction({ matches: /^Order$/i });

  /**
   * Ordering a specific category
   */
  bot.dialog('order', [
    (session, args) => {
      session.dialogData.category = args.category;
      const cards = food[args.category].map(item =>
        new builder.HeroCard(session)
          .title(item.name)
          .subtitle(item.price)
          .buttons([builder.CardAction.imBack(session, item.name, 'Add to order')])
          .images([builder.CardImage.create(session, item.image_url)]));

      const msg = new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(cards);

      builder.Prompts.choice(session, msg, food[args.category].map(item => item.name), {
        retryPrompt: msg,
      });
    },
    (session, results) => {
      session.dialogData.item = results.response.entity;
      builder.Prompts.number(
        session,
        `How many "${results.response.entity}" would you like to order?`,
      );
    },
    (session, results, next) => {
      if (results.response < 1 || !parseInt(results.response, 10)) {
        session.send('Added 0 items to your order');
      } else {
        session.conversationData.order = [
          ...session.conversationData.order,
          { name: session.dialogData.item, quantity: results.response },
        ];
        session.send(`Succesfully added ${results.response} item${
          results.response < 2 ? '' : 's'
        } to your order 👌`);
      }
      next();
    },
    (session) => {
      builder.Prompts.confirm(session, `Want to order any other ${session.dialogData.category}?`);
    },
    (session, { response }) => {
      if (response) {
        session.replaceDialog('order', { category: session.dialogData.category });
      } else {
        session.endDialog();
      }
    },
  ]);
}
