"use server";
import crypto from "crypto";
import { getCreditsPack, PackId } from "@/lib/billing";
import { getAppUrl } from "@/lib/helper";
import prisma from "@/lib/prisma";
import razorpay from "@/lib/razorpay/razorpay"; 
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function getAvailableCredits() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const balance = await prisma.userBalance.findUnique({
    where: {
      userId,
    },
  });

  if (!balance) return -1;

  return balance.credits;
}


export async function setupUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const userBalance = await prisma.userBalance.findUnique({
    where: {
      userId,
    },
  });
  
  if (!userBalance) {
    await prisma.userBalance.create({
      data: {
        userId,
        credits: 200, // Initial free credits
      },
    });
  }

  redirect("/home");
}


export async function purchaseCredits(packId: PackId) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const selectedPack = getCreditsPack(packId);

  if (!selectedPack) {
    throw new Error("Invalid package");
  }

  const options = {
    amount: selectedPack.price, 
    currency: "INR", 
    receipt: `receipt_order_${new Date().getTime()}`,
    notes: {
      userId,      
      packId,      
    },
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    throw new Error("Cannot create Razorpay order");
  }
}


export async function getUserPurchases() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  return await prisma.userPurchase.findMany({
    where: {
      userId,
    },
    orderBy: {
      date: "desc", 
    },
  });
}


export async function downloadInvoice(id: string) {
  //console.log("Invoice download is not implemented. ");

  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const purchase = await prisma.userPurchase.findUnique({
    where: {
      userId,
      id,
    },
  });

  if (!purchase) {
    throw new Error("Purchase not found");
  }

  const razorpayInvoiceId = (purchase as any).invoiceId;

  if (!razorpayInvoiceId) {
    throw new Error("Invoice not associated with this purchase. This may be an older transaction or a webhook issue.");
  }

  try {
    const invoice = await razorpay.invoices.fetch(razorpayInvoiceId);
    if (!invoice.short_url) {
      throw new Error("Invoice URL not available.");
    }
    return invoice.short_url;
  } catch (error) {
    console.error("Failed to fetch Razorpay invoice:", error);
    throw new Error("Could not retrieve invoice from Razorpay.");
  }
  
}



interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function verifyRazorpayPayment(params: VerifyPaymentParams) {
  "use server";

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (!isAuthentic) {
    throw new Error("Payment verification failed. Signature mismatch.");
  }

  // to get the notes and prevent tampering.
  const payment = await razorpay.payments.fetch(razorpay_payment_id);
  if (!payment) {
      throw new Error("Payment not found on Razorpay.");
  }

  const { userId, packId } = payment.notes;

  if (!userId || !packId) {
    throw new Error("User ID or Pack ID missing from payment notes.");
  }

  const purchasedPack = getCreditsPack(packId as PackId);
  if (!purchasedPack) {
    throw new Error("Purchased pack not found.");
  }

  try {
    await prisma.userBalance.upsert({
      where: { userId },
      create: {
        userId,
        credits: purchasedPack.credits,
      },
      update: {
        credits: {
          increment: purchasedPack.credits,
        },
      },
    });
  } catch (dbError) {
    console.error("Database update failed after payment verification:", dbError);
    throw new Error("Failed to update credits after successful payment.");
  }
}
