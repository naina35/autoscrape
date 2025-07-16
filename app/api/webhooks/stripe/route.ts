import { handleRazorpayPaymentCaptured } from "@/lib/razorpay/handleCheckoutSessionCompleted";
import  razorpay from "@/lib/razorpay/razorpay";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

// This is the main function that handles incoming POST requests to this API route.
export async function POST(request: Request) {
  // 1. Get the raw request body and the Razorpay signature from the headers.
  // We need the raw body text to properly verify the signature.
  const body = await request.text();
  const signatureHeader = headers().get("x-razorpay-signature") as string;

  // 2. Get your webhook secret from environment variables.
  // This must be set in your Razorpay dashboard and in your .env file.
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set in environment variables.");
    // Return a 500 error because this is a server configuration issue.
    return new NextResponse("Internal Server Error: Webhook secret not configured", { status: 500 });
  }

  try {
    // 3. Verify the webhook signature to ensure the request is authentic.
    // This is a critical security step.
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signatureHeader) {
      console.warn("Invalid Razorpay webhook signature received.");
      return new NextResponse("Invalid signature", { status: 400 });
    }

    // 4. If the signature is valid, parse the body as JSON.
    const event = JSON.parse(body);

    // 5. Handle the specific event type.
    // For successful payments, Razorpay sends the 'payment.captured' event.
    switch (event.event) {
      case "payment.captured":
        // The actual payment data is in `event.payload.payment.entity`.
        const payment = event.payload.payment.entity;
        
        // Call the handler function you created earlier to process the payment.
        await handleRazorpayPaymentCaptured(payment);
        break;
      
      // You can add more cases here to handle other Razorpay events if needed.
      // For example: 'order.paid', 'refund.processed', etc.
      default:
        console.log(`Received unhandled Razorpay event type: ${event.event}`);
        break;
    }

    // 6. Acknowledge receipt of the webhook with a 200 OK response.
    return new NextResponse(null, { status: 200 });

  } catch (error) {
    // 7. Handle any errors during processing.
    // Using `instanceof Error` provides better type safety.
    const errorMessage = error instanceof Error ? error.message : "Unknown webhook error";
    console.error("Razorpay webhook processing error:", errorMessage);
    
    // It's good practice to let the client know an error occurred.
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
}
