'use strict';

const { Telegraf } = require('telegraf');
const node_cache = require('node-cache');
const watson_assistant = require('./watson_assistant');
const vision = require('./vision');

const local_cache = new node_cache();

const SELFIE_REQUEST_MESSAGE = 'E por fim precisamos de uma selfie sua!';

function text_message_broker(message) {
  return new Promise(async (resolve, reject) => {
    try {
      const chat_id = message.chat.id;

      const isAwaitingSelfie = local_cache.get(`${chat_id}_selfie`) || false;
      if (isAwaitingSelfie) return resolve([{response_type: 'text', text: SELFIE_REQUEST_MESSAGE}]);

      const full_context = local_cache.get(chat_id) || {
        skills: { 'actions skill': { skill_variables: {} } },
      };
      const context = full_context.skills['actions skill'].skill_variables;

      context.first_name = message.chat.first_name;

      full_context.skills['actions skill'].skill_variables = context;
      const res = await watson_assistant.message({
        text: message.text,
        id: chat_id,
        context: full_context,
      });
      console.debug('**************************');
      console.debug('session_ID ->', res.context.global.session_id);
      console.debug('output ->', res.output.generic);
      console.debug('**************************');

      local_cache.set(chat_id, res.context);
      console.log(`selfie lock: ${res.output.generic[0].text === SELFIE_REQUEST_MESSAGE} message: ${res.output.generic[0].text}`)
      local_cache.set(`${chat_id}_selfie`, res.output.generic[0].text === SELFIE_REQUEST_MESSAGE);

      resolve(res.output.generic);
    } catch (err) {
      reject(err);
    }
  });
}

const foto_message_broker = async (ctx) => {
  const chat_id = ctx.message.chat.id;

  const isAwaitingSelfie = local_cache.get(`${chat_id}_selfie`) || false;
  if (!isAwaitingSelfie) return [{response_type: 'text', text: 'Não é permitido o envio de imagens agora.'}];

  const photo = ctx.message.photo[ctx.message.photo.length - 1].file_id;
  const fileUrl = await ctx.telegram.getFileLink(photo);

  try {
    const hasFace = await vision.hasFace(fileUrl.href);
    local_cache.set(`${chat_id}_selfie`, false);
    ctx.message.text = hasFace ? 'Sim' : 'Não';
    //return [{response_type: 'text', text: 'ok.'}]
    return await text_message_broker(ctx.message);
  } catch (error) {
    console.error(error);
    return [{response_type: 'text', text: 'Por favor tente novamente mais tarde.'}];
  }
};

module.exports = {
  start: () => {
    try {
      const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
      bot.start((ctx) => ctx.reply(`Bem-vindo ${ctx.message.chat.first_name}`));

      bot.on('text', async (ctx) => {
        const response = await text_message_broker(ctx.message);

        response.forEach((element) => {
          if (element.response_type === 'text') {
            ctx.reply(element.text);
          }
        });
      });

      bot.on('photo', async (ctx) => {
        const response = await foto_message_broker(ctx);
        response.forEach((element) => {
          if (element.response_type === 'text') {
            ctx.reply(element.text);
          }
        });
      });

      bot.launch();
    } catch (err) {
      console.error(err);
    }
  },
};
