const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");
require("dotenv").config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
});

app.use(cors());
app.use(express.json());

// Route to create PaymentIntent
app.post("/create-payment-intent", async (req, res) => {
    const { amount } = req.body;

    try {
        const customer = await stripe.customers.create();
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customer.id },
            { apiVersion: "2023-10-16" }
        );

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "inr",
            customer: customer.id,
            payment_method_types: ["card"],
        });

        res.status(200).json({
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id,
        });
    } catch (error) {
        console.error("Stripe error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Server listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
