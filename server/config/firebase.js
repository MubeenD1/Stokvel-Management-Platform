const admin = require('firebase-admin')

if (!admin.apps.length) {
  let credential

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // on Azure — read from environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    credential = admin.credential.cert(serviceAccount)
  } else {
    // locally — read from file
    const serviceAccount = require('../serviceAccountKey.json')
    credential = admin.credential.cert(serviceAccount)
  }

  admin.initializeApp({ credential })
}

module.exports = admin
