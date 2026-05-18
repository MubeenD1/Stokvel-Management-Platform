const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendMeetingNotification = async (emails, groupName, meetingDetails, type = "update") => {
    const subject = type === "update" 
        ? `Meeting Update: ${groupName}` 
        : `New Meeting Scheduled: ${groupName}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emails, // Can be an array
        subject: subject,
        text: `Hello! The meeting for ${groupName} has been ${type}d.\n\nNew Date: ${meetingDetails.date}\nFrequency: ${meetingDetails.frequency}\n\nPlease check your dashboard for details.`,
    };

    return transporter.sendMail(mailOptions);
};

const sendMinutesNotification = async (emails, groupName, meetingDetails) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emails,
        subject: `Meeting Minutes Available: ${groupName}`,
        text: `Hello!\n\nThe minutes for the ${groupName} meeting held on ${meetingDetails.date} have been published.\n\n${meetingDetails.minutes}\n\nPlease check your dashboard for full details.`,
    };
    return transporter.sendMail(mailOptions);
};

const sendContributionEmail = async ({ toEmail, name, amount, groupName }) => {
  await transporter.sendMail({
    from: `"Stokvel Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '✅ Contribution Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        
        <img 
          src="https://www.payfast.co.za/assets/images/payfast-logo.svg" 
          alt="PayFast" 
          style="width: 120px; margin-bottom: 20px;"
        />

        <h2 style="color: #2e7d32;">Payment Confirmed ✅</h2>
        <p>Hi ${name},</p>
        <p>Your contribution of <strong>R${amount}</strong> to <strong>${groupName}</strong> has been received.</p>
        <p>A treasurer will confirm it shortly.</p>

        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e0e0e0;" />
        <p style="font-size: 12px; color: #999;">Secured by PayFast</p>
      </div>
    `,
  });
};

module.exports = {
  sendMeetingNotification,
  sendMinutesNotification,
  sendContributionEmail
};