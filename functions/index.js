'use strict'

const functions = require('firebase-functions');
const {
  dialogflow
} = require('actions-on-google');

const admin = require('firebase-admin');

admin.initializeApp();

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

// Create 
const app = dialogflow({
  // TODO Change this to process.env
  clientId: functions.config().fireconfig.id,
  debug: true,
});