const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailUser,
        pass: emailPass,
    },
});

async function run() {
    try {
        console.log("Testing auth...", emailUser, emailPass);
        await transporter.verify();
        console.log("Auth works!");

        const info = await transporter.sendMail({
            from: emailUser,
            to: emailUser,
            subject: "Test",
            text: "Hello world"
        });
        console.log("Sent:", info.messageId);
    } catch (e) {
        console.error("Failed:", e);
    }
}
run();
