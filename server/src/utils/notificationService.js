const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // or your provider
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

module.exports = { sendMeetingNotification };