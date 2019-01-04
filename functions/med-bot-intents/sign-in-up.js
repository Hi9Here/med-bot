const { SignIn } = require('actions-on-google');

module.exports = {

  'ask_for_sign_in': (conv) => {
    conv.ask(new SignIn());
  },

  'ask_for_sign_in_confirmation': (conv, params, signin) => {
    if (signin.status !== 'OK') {
      return conv.ask('You need to sign in before using the app.');
    }
    // const access = conv.user.access.token;
    // possibly do something with access token
    return conv.ask('Great! Thanks for signing in.');
  },

};