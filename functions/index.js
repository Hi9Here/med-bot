'use strict'

const functions = require('firebase-functions');
const moment = require('moment');

// Add more packages as you need them
const {
  dialogflow,
  SimpleResponse,
  Suggestions,
  Permission,
  SignIn,
  List,
  Image
} = require('actions-on-google');
const admin = require('firebase-admin');

admin.initializeApp();

// Setup some variables for the paths to Firestore Database
const auth = admin.auth();
const db = admin.firestore();

// Just something to stop annoying error messages, ignore
db.settings({ timestampsInSnapshots: true });

// Version and logging
const version = 0.24;

const datetime = Date.now();
const when = moment(datetime).format('MMMM Do YYYY, h:mm:ss a');
console.info(`* Deployed * V${version} at ${when}`)

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
  console.info(`* middleware * conv.user ${JSON.stringify(conv.user, null, 2)}`);
  console.info(`* middleware * conv.data.uid ${JSON.stringify(conv.data.uid, null, 2)}`);
  console.info(`* middleware * email const ${JSON.stringify(email, null, 2)}`);
  console.info(`* middleware * payload const ${JSON.stringify(conv.user.profile.payload, null, 2)}`);
  if (!conv.data.uid && email) {
    try {
      // If there is no uid then grab the UID from the Firebase Email Address
      conv.data.uid = (await auth.getUserByEmail(email)).uid;
      console.info(`* middleware * conv.data.uid. If no uid then use UID from Firebase ${JSON.stringify(conv.data.uid, null, 2)}`);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw console.error(`* middleware * error is ${error}`);
      }
      // If the user is not found, create a new Firebase auth user
      // using the email obtained from the Google Assistant
      conv.data.uid = (await auth.createUser({ email })).uid;
      console.info(`* middleware * conv.data.uid. If user not found. Create a new Firebase auth user from the Google Profile ${JSON.stringify(conv.data.uid, null,2)}`);
    }
  }
  if (conv.data.uid) {
    try {
      db.collection('user').doc(conv.data.uid).set({
        Email: payload.email,
        LastName: payload.family_name,
        FirstName: payload.given_name,
        FullName: payload.name,
        ProfileImage: payload.picture,
        ProfileCreated: payload.iat,
        ProfileExpires: payload.exp,
        GoogleID: payload.sub
      });
    } catch (error) {
      throw console.error(`* middleware * try to save payload data ${error}`);
    }
    console.info(`* Middleware Payload Saved ${JSON.stringify(conv.user.profile.payload, null, 2)}`);
  }
});
// End of Middleware

// Default Welcome Intent
app.intent('Default Welcome Intent', (conv) => {
  console.info(`* Default Welcome Intent * Fired`);
  conv.ask(new SimpleResponse(`Version ${version} welcome`))
  conv.ask(new Suggestions([`Open Account`, 'More Info']));
  return
});
// End Default Welcome Intent

// Sign In
app.intent("Start Sign-in", conv => {
  console.info(`* Start Sign-in * Intent Fired`);
  conv.ask(new SignIn("To use me"));
});
// End Sign In

// Get Sign In
app.intent("Get Sign In", (conv, params, signin) => {
  const { payload } = conv.user.profile
  console.info(`* Get Sign In * Fired`);
  console.info(`* Get Sign In * payload const is ${JSON.stringify(payload, null, 2)}`);
  if (signin.status === "OK") {
    conv.ask("Sign-in Done.");
    console.info(`* Get Sign In * Sign-in Done Fired`);
    return
  } else {
    conv.ask("You need to sign in to use me.");
    console.info(`* Get Sign In * You need to sign in to use me fired`);
    return
  }
});
// End Get Sign In

// List Users
// TODO Needs to be minimum 2 and the user asking must be an Admin
app.intent('List Users', (conv) => {
    var listitems = {}
    console.info(`* List Users Fired *`);
    conv.ask(new SimpleResponse({
      speech: `Here is the List`,
      text: `This is the List`
    }));
    return db.collection('user').get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.warn(`* List Users * No matching list items`);
          return;
        }
        snapshot.docs
          .map(doc => doc.data())
          .forEach(element => {
            listitems[element.Email] = {
              title: element.Email,
              description: `${element.LastName} ${element.Email} `,
              image: new Image({
                url: element.ProfileImage,
                alt: element.FullName
              })
            }
          })
        conv.ask(new List({
          title: 'User List',
          items: listitems
        }));
        console.info(`* List Users * listitems is ${JSON.stringify(listitems, null, 2)}`)
      })
      .catch(error => {
        console.error(`* List Users * Error getting list of users under ${error}`);
      });
  })
  // End List Users

exports.medbot = functions.https.onRequest(app);