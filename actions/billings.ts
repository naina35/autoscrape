"use server";

import { getCreditsPack, PackId } from "@/lib/billing";
import { getAppUrl } from "@/lib/helper";
import prisma from "@/lib/prisma";
import razorpay from "@/lib/razorpay/razorpay"; // Make sure this path is correct
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
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

/**
 * Sets up an initial credit balance for a newly authenticated user.
 * This function is already compatible with your schema.
 */
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

/**
 * Creates a Razorpay order for a credit purchase.
 * This returns the order details to the client to open the Razorpay Checkout modal.
 *
 * @param packId The ID of the credit pack being purchased.
 * @returns The created Razorpay order object.
 */
export async function purchaseCredits(packId: PackId) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const selectedPack = getCreditsPack(packId);

  if (!selectedPack) {
    throw new Error("Invalid package");
  }

  // Razorpay expects the amount in the smallest currency unit (e.g., paise for INR).
  // Your `getCreditsPack` function should provide this value.
  const options = {
    amount: selectedPack.price, // e.g., for ₹500, this should be 50000
    currency: "INR", // Or get this from your config/pack details
    receipt: `receipt_order_${new Date().getTime()}`,
    notes: {
      userId,      // Pass userId to track the purchase
      packId,      // Pass packId to identify the item
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

/**
 * Retrieves the purchase history for the authenticated user.
 * Updated to sort by the 'date' field from your schema.
 */
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
      date: "desc", // Corrected to use the 'date' field from your schema
    },
  });
}

/**
 * Retrieves the hosted invoice URL from Razorpay for a given purchase.
 *
 * @param id The internal ID of the purchase record from your database.
 * @returns The public URL of the hosted invoice.
 */
export async function downloadInvoice(id: string) {
  // ========================================================================
  // IMPORTANT: This function cannot be fully implemented with your current
  // database schema. The original Stripe logic does not translate directly.
  //
  // To enable this functionality with Razorpay, you need to:
  //
  // 1. UPDATE YOUR SCHEMA:
  //    Add a field to your `UserPurchase` model in `schema.prisma` to store
  //    the Razorpay invoice ID:
  //
  //    model UserPurchase {
  //      // ... existing fields
  //      invoiceId   String?  // Add this line
  //    }
  //
  //    Then, run `npx prisma db push` or `npx prisma migrate dev`.
  //
  // 2. UPDATE YOUR WEBHOOK HANDLER:
  //    In your `handleRazorpayPaymentCaptured` function, you must extract
  //    the `invoice_id` from the Razorpay payment payload and save it to
  //    your new `invoiceId` field in the database.
  //
  // Once those changes are made, you can uncomment and use the code below.
  // ========================================================================

  //throw new Error("Invoice download is not implemented. See code comments for instructions.");

  
  // UNCOMMENT THIS CODE AFTER UPDATING YOUR SCHEMA AND WEBHOOK

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

  // Assumes you have added 'invoiceId' to your UserPurchase model
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
