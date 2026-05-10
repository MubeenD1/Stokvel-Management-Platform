const crypto = require('crypto');
const axios = require('axios');
const { saveContribution } = require('./contributionService');

const {
  PAYFAST_MERCHANT_ID,
  PAYFAST_MERCHANT_KEY,
  PAYFAST_PASS_KEY,
  PAYFAST_TEST_MODE,
  NOTIFY_URL
} = process.env;

const PAYFAST_PROCESS_URL = 'https://sandbox.payfast.co.za/onsite/process'

const dataToString = (data) => {
  let pfParamString = '';
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      pfParamString += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`;
    }
  }
  return pfParamString.slice(0, -1);
};

const generateSignature = (data, passPhrase) => {
  let sigString = dataToString(data);
  if (passPhrase) {
    sigString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, '+')}`;
  }
  return crypto.createHash('md5').update(sigString).digest('hex');
};

const initiatePayment = async (req, res) => {
  const { name_first, name_last, email_address, amount, item_name, groupId, role, groupMemberId } = req.body;

  const mydata = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: `http://localhost:5173/groups/${groupId}/contributions?role=${role}&payment=success`,
cancel_url: `http://localhost:5173/groups/${groupId}/contributions?role=${role}&payment=cancelled`, // will change to modals
    notify_url: process.env.NOTIFY_URL,
    name_first, // get from user
    name_last, //  // get from user
    email_address, //  // get from user
    amount: parseFloat(amount).toFixed(2), // get from group settings
    item_name, // Stokvel Contribution
  };

  mydata['signature'] = generateSignature(mydata, PAYFAST_PASS_KEY);
  const pfParamString = dataToString(mydata);

  try {
    const response = await axios.post(PAYFAST_PROCESS_URL, pfParamString);
    const uuid = response.data.uuid || null;

    if (!uuid) {
      return res.status(500).json({ error: 'No UUID returned from PayFast' });
    }

    res.json({ uuid, return_url: mydata.return_url, cancel_url: mydata.cancel_url });
  } catch (error) {
    console.error('PayFast error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get PayFast UUID' });
  }
};

// const handleNotify = (req, res) => {
//   console.log('ITN received:', req.body);
//   // TODO: verify and update your DB here
//   // create notification and add to DB
//   // notify all treasurers
//   // create contribution
//   res.sendStatus(200);
// };

const handleNotify = async (req, res) => {
  const {
    payment_status,
    amount_gross,
    custom_str1: groupId,
    custom_str2: groupMemberId,
  } = req.body;

  if (payment_status !== 'COMPLETE') {
    return res.sendStatus(200);
  }

  await saveContribution({
    amount: amount_gross,
    groupId,
    groupMemberId,
  });

  res.sendStatus(200);
};

module.exports = { initiatePayment, handleNotify };