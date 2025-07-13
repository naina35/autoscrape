// import { handleCheckoutSessionCompleted } from "@/lib/stripe/handleCheckoutSessionCompleted";
// import { stripe } from "@/lib/stripe/stripe";
// import { headers } from "next/headers";
// import { NextResponse } from "next/server";

// export async function POST(request: Request) {
//   const body = await request.text();

//   const signatureHeaders = headers().get("stripe-signature") as string;

//   try {
//     const event = stripe.webhooks.constructEvent(
//       body,
//       signatureHeaders,
//       process.env.STRIPE_WEBHOOK_SECRET!
//     );

//     switch (event.type) {
//       case "checkout.session.completed":
//         handleCheckoutSessionCompleted(event.data.object);
//         break;

//       default:
//         break;
//     }

//     return new NextResponse(null, { status: 200 });
//   } catch (error) {
//     console.error("Stripe webhook error", error);
//     return new NextResponse("webhook error", { status: 400 });
//   }
// }
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Simulate reading the raw body and headers (just for structure)
  const body = await request.text();
  const signature = "dummy-signature"; // placeholder

  // Log dummy request info for debugging
  console.log("Received dummy webhook:");
  console.log("Body:", body);
  console.log("Signature:", signature);

  // Simulate event parsing
  const dummyEvent = {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "dummy_session_id",
        amount_total: 1000,
        customer_email: "test@example.com",
      },
    },
  };

  // Simulate handling the event
  switch (dummyEvent.type) {
    case "checkout.session.completed":
      console.log("Handled dummy checkout session:", dummyEvent.data.object);
      break;
    default:
      console.log("Unhandled event type:", dummyEvent.type);
      break;
  }

  return new NextResponse("Dummy webhook handled", { status: 200 });
}
