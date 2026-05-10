const crypto = require('crypto');
const { saveContribution } = require('./contributionService');

const {
  PAYFAST_MERCHANT_ID,
  PAYFAST_MERCHANT_KEY,
  PAYFAST_PASS_KEY,
  NOTIFY_URL
} = process.env;

// Using the standard redirect engine
const PAYFAST_URL = 'https://sandbox.payfast.co.za/eng/process';


const initiatePayment = async (req, res) => {
  try {
    const { name_first, name_last, email_address, amount, item_name, groupId, role, groupMemberId } = req.body;

    // 1. Define the data in the EXACT order PayFast expects
    const myData = {
      merchant_id: PAYFAST_MERCHANT_ID.trim(),
      merchant_key: PAYFAST_MERCHANT_KEY.trim(),
      return_url: `http://localhost:5173/groups/${groupId}/contributions?role=${role}&payment=success`,
      cancel_url: `http://localhost:5173/groups/${groupId}/contributions?role=${role}&payment=cancelled`,
      notify_url: NOTIFY_URL.trim(),
      name_first: (name_first || '').trim(),
      name_last: (name_last || '').trim(),
      email_address: email_address.trim(),
      m_payment_id: groupMemberId.trim(),
      amount: parseFloat(amount).toFixed(2),
      item_name: item_name.trim(),
      custom_str1: groupId.trim(),
      custom_str2: groupMemberId.trim(),
    };

    // 2. Create the signature string
    // IMPORTANT: Only include fields that are NOT empty
    let pfOutput = '';
    for (let key in myData) {
      if (myData[key] !== '') {
        pfOutput += `${key}=${encodeURIComponent(myData[key]).replace(/%20/g, '+')}&`;
      }
    }

    // 3. Append the Passphrase (if it exists in your PayFast dashboard)
    let getString = pfOutput.slice(0, -1);
    if (PAYFAST_PASS_KEY && PAYFAST_PASS_KEY.trim() !== '') {
      getString += `&passphrase=${encodeURIComponent(PAYFAST_PASS_KEY.trim()).replace(/%20/g, '+')}`;
    }

    // 4. Hash it
    const signature = crypto.createHash('md5').update(getString).digest('hex');

    // 5. Build the Final URL
    // We reuse the same logic to ensure the URL parameters match the signature string exactly
    const redirectUrl = `${PAYFAST_URL}?${pfOutput}signature=${signature}`;

    console.log('Final Redirect URL:', redirectUrl); // Check this in your terminal
    res.json({ redirectUrl });

  } catch (error) {
    console.error('PayFast Error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
};

const handleNotify = async (req, res) => {
  const {
    payment_status,
    amount_gross,
    custom_str1: groupId,
    custom_str2: groupMemberId,
  } = req.body;

  // PayFast sends many types of notifications; only act on COMPLETE
  if (payment_status !== 'COMPLETE') {
    return res.sendStatus(200);
  }

  try {
    await saveContribution({
      amount: amount_gross,
      groupId,
      groupMemberId,
    });
    res.sendStatus(200);
  } catch (err) {
    console.error('Notify Error:', err);
    res.sendStatus(500);
  }
};

module.exports = { initiatePayment, handleNotify };