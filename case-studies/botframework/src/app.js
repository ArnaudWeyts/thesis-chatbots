import * as builder from 'botbuilder';

export default function (server) {
  const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
  });

  /**
   * Sets up a universal bot and a default message
   */
  const bot = new builder.UniversalBot(connector, (session) => {
    session.send(
      "Sorry, I didn't get that 🤔. Type 'help' if you need assistance or try a different sentence.",
      session.message.text,
    );
  });

  // Listen for messages from users
  server.post('/api/messages', connector.listen());

  // =========================================================
  // Bots Dialogs with LUIS Connection
  // =========================================================
  /* const recognizer = new builder.LuisRecognizer(process.env.LUIS_APP_URL);
  bot.recognizer(recognizer); */

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

  bot
    .dialog('orderButtonClick', [
      (session) => {
        builder.Prompts.choice(session, 'Thirsty? Want to order any drinks? 🥤', 'Yes|No drinks', {
          listStyle: builder.ListStyle.button,
        });
      },
      (session, results, next) => {
        if (results.response.entity === 'Yes') {
          session.beginDialog('orderDrink');
        } else {
          next();
        }
      },
      (session) => {
        builder.Prompts.choice(session, 'Want to order any starters?', 'Yes|No starters', {
          listStyle: builder.ListStyle.button,
        });
      },
      (session, results, next) => {
        if (results.response.entity === 'Yes') {
          session.beginDialog('orderStarters');
        } else {
          next();
        }
      },
      (session) => {
        builder.Prompts.choice(session, 'Want to order any mains?', 'Yes|No mains', {
          listStyle: builder.ListStyle.button,
        });
      },
      (session, results) => {
        if (results.response.entity === 'Yes') {
          session.beginDialog('orderMains');
        } else {
          session.send("Strange, you don't seem very interested in ordering food 🤔, let's try this again.");
          session.endDialog();
          session.beginDialog('orderButtonClick');
        }
      },
    ])
    .triggerAction({ matches: /^Order$/i });

  bot.dialog('orderDrink', [
    (session) => {
      const msg = new builder.Message(session);
      msg.attachmentLayout(builder.AttachmentLayout.carousel);
      msg.attachments([
        new builder.HeroCard(session)
          .title('Coca Cola')
          .subtitle('$2,49')
          .images([
            builder.CardImage.create(
              session,
              'http://southeasternbeers.co.uk/291-thickbox_default/330ml-coke-icon.jpg',
            ),
          ])
          .buttons([builder.CardAction.imBack(session, 'add Coca Cola to order', 'Add to order')]),
        new builder.HeroCard(session)
          .title('Fanta Orange')
          .subtitle('$2,49')
          .images([
            builder.CardImage.create(
              session,
              'https://groceries.morrisons.com/productImages/113/113954011_0_640x640.jpg?identifier=102f7a3939b720f25c633aa3259b3b9c',
            ),
          ])
          .buttons([
            builder.CardAction.imBack(session, 'add Fanta Orange to order', 'Add to order'),
          ]),
      ]);
      session.send(msg);
    },
  ]);

  bot.dialog('orderStarters', [
    (session) => {
      const msg = new builder.Message(session);
      msg.attachmentLayout(builder.AttachmentLayout.carousel);
      msg.attachments([
        new builder.HeroCard(session)
          .title('3 Chicken Wings')
          .subtitle('$6,49')
          .images([
            builder.CardImage.create(
              session,
              'https://chennaidines.files.wordpress.com/2013/06/dsc_0154.jpg',
            ),
          ])
          .buttons([
            builder.CardAction.imBack(session, 'add 3 Chicken Wings to order', 'Add to order'),
          ]),
        new builder.HeroCard(session)
          .title('Halloumi Sticks & Dip')
          .subtitle('$5,49')
          .images([
            builder.CardImage.create(
              session,
              'https://static.independent.co.uk/s3fs-public/styles/article_small/public/thumbnails/image/2018/02/26/13/halloumisticks.jpg',
            ),
          ])
          .buttons([
            builder.CardAction.imBack(
              session,
              'add Halloumi Sticks & Dip to order',
              'Add to order',
            ),
          ]),
      ]);
      session.send(msg);
    },
  ]);

  bot.dialog('orderMains', [
    (session) => {
      const msg = new builder.Message(session);
      msg.attachmentLayout(builder.AttachmentLayout.carousel);
      msg.attachments([
        new builder.HeroCard(session)
          .title('Sunset Burger')
          .subtitle('$10,49')
          .images([
            builder.CardImage.create(
              session,
              'https://www.styledepartment.co.uk/wp-content/uploads/2017/02/SunsetBurger-Low-Res.-opener.jpg',
            ),
          ])
          .buttons([
            builder.CardAction.imBack(session, 'add Sunset burger to order', 'Add to order'),
          ]),
        new builder.HeroCard(session)
          .title('Fino Pitta')
          .subtitle('$9,99')
          .images([
            builder.CardImage.create(session, 'https://pbs.twimg.com/media/DMwDJW7WkAEhZPO.jpg'),
          ])
          .buttons([builder.CardAction.imBack(session, 'add Fino Pitta to order', 'Add to order')]),
      ]);
      session.send(msg);
    },
  ]);

  bot
    .dialog('addToOrderButtonClick', [
      (session) => {
        builder.Prompts.text(session, 'How many of these would you like to order?');
      },
      (session, results, next) => {
        if (results.response < 1 || !parseInt(results.response, 10)) {
          session.send('Added 0 items to your order');
        } else {
          // add amount to order //
          session.send(`Succesfully added ${results.response} item${
            results.response < 2 ? '' : 's'
          } to your order 👌`);
        }
        next();
      },
      (session) => {
        builder.Prompts.choice(session, 'Want to order anything else?', 'Drinks|Starters|Mains|No');
      },
      (session, results, next) => {
        const choice = results.response.entity;
        if (choice !== 'No') {
          session.beginDialog(`order${choice}`);
        } else {
          next();
        }
      },
      (session) => {
        session.clearDialogStack();
        session.send('Summary of order');
      },
    ])
    .triggerAction({ matches: /add\s.*order/i });
}
