'use strict'

const functions = require('firebase-functions');
const moment = require('moment');

// Add more packages as you need them
const {
  dialogflow,
  SimpleResponse,
  Suggestions,
  Permission,
  SignIn
} = require('actions-on-google');
const admin = require('firebase-admin');

admin.initializeApp();

// Setup some variables for the paths to Firestore Database
const auth = admin.auth();
const db = admin.firestore();
const dbuser = {
  user: db.collection('user'),
};

// Just something to stop annoying error messages, ignore
db.settings({ timestampsInSnapshots: true });

// Version and logging
const version = 0.193;

const datetime = Date.now();
const when = moment(datetime).format('MMMM Do YYYY, h:mm:ss a');
console.info(`Deployed V${version} at ${when}`)

// Create a Firebase Environmental Variable yarn envset
const app = dialogflow({
  clientId: functions.config().fireconfig.id,
  debug: true,
});


//Middleware get's fired everytime before intents
app.middleware(async(conv) => {
  const { payload } = conv.user.profile
    // Get the email value from the Conversation User
  const { email } = conv.user;
  console.info(`Middleware conv.user object ${JSON.stringify(conv.user, null,2)}`);
  console.info(`Middleware conv.data object ${JSON.stringify(conv.data, null,2)}`);
  console.info(`Middleware email ${JSON.stringify(email, null,2)}`);
  console.info(`Middleware Payload ${JSON.stringify(conv.user.profile.payload, null,2)}`);
  console.info(`Middleware conv.ref ${JSON.stringify(conv.user.profile.payload, null,2)}`);
  if (!conv.data.uid && email) {
    try {
      // If there is no uid then grab the UID from the Firebase Email Address
      conv.data.uid = (await auth.getUserByEmail(email)).uid;
    } catch (e) {
      if (e.code !== 'auth/user-not-found') {
        throw e;
      }
      // If the user is not found, create a new Firebase auth user
      // using the email obtained from the Google Assistant
      conv.data.uid = (await auth.createUser({ email })).uid;
    }
  }
  if (conv.data.uid) {
    dbuser.user.doc(conv.data.uid).set({
      Email: payload.email,
      LastName: payload.family_name,
      FirstName: payload.given_name,
      FullName: payload.name,
      ProfileImage: payload.picture,
      ProfileCreated: payload.iat,
      ProfileExpires: payload.exp,
      GoogleID: payload.sub
    });
    console.info(`Middleware Payload Saved ${JSON.stringify(conv.user.profile.payload, null,2)}`);
  }
});
// End of Middleware


// Default Welcome Intent
app.intent('Default Welcome Intent', (conv) => {
  console.info(`Default Welcome Intent Fired`);
  conv.ask(new SimpleResponse(`Version ${version} welcome`))
  conv.ask(new Suggestions([`Open Account`, 'More Info']));
  return
});
// End Default Welcome Intent

// Sign In
app.intent("Start Sign-in", conv => {
  console.info(`Start Sign-in Intent Fired`);
  conv.ask(new SignIn("To use me"));
});
// End Sign In

// Get Sign In
app.intent("Get Sign In", (conv, params, signin) => {
  const { payload } = conv.user.profile
  console.info(`Get Sign In Fired`);
  console.info(`payload is ${JSON.stringify(payload, null, 2)}`);
  if (signin.status === "OK") {
    conv.ask("Sign-in Done.");
    console.info(`Sign-in Done Fired under Get Sign In Intent`);
  } else {
    conv.ask("You need to sign in to use me.");
    console.info(`You need to sign in to use me fired under Get Sign In Intent`);
  }
});
// End Get Sign In

exports.medbot = functions.https.onRequest(app);