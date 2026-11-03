// Firebase settings for player accounts and cloud saves (js/account.js).
//
// Leave this as null to keep accounts switched off: progress still saves in each browser. To switch
// accounts on, create a free Firebase project, add a Web app, enable Authentication (Google and
// Email/Password) and Cloud Firestore, then paste the web app's config object here. These values
// are public by design (they identify the project); the Firestore rules in README.md are what keep
// each player's save private to them.
window.FIREBASE_CONFIG = null;
