'use strict'

const functions = require('firebase-functions');
// Add more packages as you need them
const {
  dialogflow,
  SimpleResponse,
  Suggestions,
  Permission
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
const version = 0.1
const datetime = Date.now()
const datetimeString = datetime.toString()

console.log(`deploy V${version} on ${datetimeString}`)

// Create a Firebase Environmental Variable yarn envset
const app = dialogflow({
  clientId: functions.config().fireconfig.id,
  debug: true,
});

// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('Default Welcome Intent', (conv) => {
  // Asks the user's permission to know their name, for personalization.
  conv.ask(new Permission({
    context: `Hi, this is the Medicine Reminder Bot bot, can we please record your devices current location?`,
    permissions: ['DEVICE_COARSE_LOCATION'],
  }))
  conv.ask(new SimpleResponse('Choose'))
  conv.ask(new Suggestions([`Yes`, 'Cancel']));
  return
})

exports.medbot = functions.https.onRequest(app);