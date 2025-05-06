const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "mohamed2512imran@gmail.com", // Replace with your Gmail
        pass: "sdidyylyjnxmgdul", // Replace with your Gmail app password
    },
});

const sendEmailToDonor = (to, donorName, receiverInfo) => {
    const subject = "Your Donation Has Been Requested!";
    const text = `
Hi ${donorName},

Your donation has been requested by:

👤 Name: ${receiverInfo.name}
📧 Email: ${receiverInfo.email}
📞 Phone: ${receiverInfo.phone || "Not provided"}

Please get in touch with the receiver to coordinate pickup or delivery.

Thanks for supporting the Pasikkodu community! 🙏
`;

    const mailOptions = {
        from: "Pasikkodu <mohamed2512imran@gmail.com>",
        to,
        subject,
        text,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendEmailToDonor,
};
