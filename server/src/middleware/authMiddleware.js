const admin = require('firebase-admin');
const ServiceAccount = require('../../serviceAccountKey.json');

//this will initialise the firebase admin 
if(!admin.apps.length){
    admin.initializeApp({
        credential: admin.credential.cert(ServiceAccount),

    });
}

//this middleware will check that the user is logged in before allowing them to access protected routes
async function verifyTokens(req,res,next) {
    const authHeader = req.headers.authorization;

    //this will check that the header for the authorisation exists,i.e,'Bearer'
    if(!authHeader || !authHeader.startsWith('Bearer')){
        return res.status(401).json({error:'Unauthorized:No token provided'});

    }

    //this will extract the token from the header 
    const token = authHeader.split(' ')[1];

    //this will verify that there is indeed a token with a firebase
    try{
        const decodedToken = await admin.auth().verifyTokens(token);
        req.user = decodedToken;
        next();

    }catch(error){
        return res.status(401).json({error:'Unauthorized:Invalid Token'});
    }
}

module.exports = {verifyTokens};
