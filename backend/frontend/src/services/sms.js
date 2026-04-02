import twilio from "twilio";

/* =========================
   TWILIO CONFIG
========================= */
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/* =========================
   SEND SMS
========================= */
export const sendSMS = async ({ to, message }) => {
  try {
    if (!to || !message) {
      throw new Error("Phone number or message missing");
    }

    const response = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to,
    });

    console.log("📩 SMS sent:", response.sid);
    return response;
  } catch (error) {
    console.error("❌ SMS failed:", error.message);
    throw error;
  }
};

/* =========================
   ORDER CONFIRMATION SMS
========================= */
export const sendOrderConfirmationSMS = async ({
  phone,
  orderId,
  amount,
  pickupTime,
}) => {
  const message = `
🍽️ E-Canteen Order Confirmed!

🧾 Order ID: ${orderId}
💰 Amount: ₹${amount}
⏰ Pickup Time: ${pickupTime}

Thank you for ordering with us!
`;

  return sendSMS({
    to: phone,
    message,
  });
};
