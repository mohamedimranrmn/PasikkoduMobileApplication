const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "mohamed2512imran@gmail.com", // Replace with your Gmail
        pass: "sdidyylyjnxmgdul", // Gmail app password
    },
});

/**
 * Sends an email to the donor when their donation expires and is deleted.
 * @param {string} to - Donor's email address.
 * @param {string} donorName - Donor's name.
 * @param {string} foodName - Name of the donated food.
 * @param {string} locationName - Location of the donation.
 */
const sendExpiryEmailToDonor = async (to, donorName, foodName, locationName) => {
    const subject = "Your Donation Has Expired";
    const text = `
Hi ${donorName},

Your donation "${foodName}" listed at ${locationName || "an unspecified location"} has expired and has been removed from Pasikkodu.

We appreciate your kindness and hope to see you contribute again soon. 💚

– The Pasikkodu Team
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
    sendExpiryEmailToDonor,
};
