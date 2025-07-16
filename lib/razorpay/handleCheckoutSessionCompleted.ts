import "server-only";
import { getCreditsPack, PackId } from "../billing";
import prisma from "../prisma";

/**
 * Updated interface for the Razorpay 'payment.captured' entity.
 * It now includes the optional 'invoice_id' field.
 */
interface RazorpayPaymentEntity {
  id: string;
  amount: number;
  currency: string;
  invoice_id?: string | null; // The invoice ID from Razorpay
  notes: {
    userId?: string;
    packId?: string;
    [key: string]: any;
  };
}

/**
 * Handles the 'payment.captured' event from a Razorpay webhook.
 *
 * This function now saves the Razorpay Payment ID and the associated Invoice ID
 * to the database, in addition to updating the user's credit balance.
 *
 * @param payment The payment entity from the Razorpay webhook payload.
 */
export async function handleRazorpayPaymentCaptured(
  payment: RazorpayPaymentEntity
) {
  const { userId, packId } = payment.notes;

  // 1. Validate incoming data
  if (!userId) {
    throw new Error("Missing 'userId' in Razorpay payment notes");
  }
  if (!packId) {
    throw new Error("Missing 'packId' in Razorpay payment notes");
  }

  // 2. Retrieve package details
  const purchasedPack = getCreditsPack(packId as PackId);
  if (!purchasedPack) {
    console.error(`Purchase pack not found for packId: ${packId}`);
    throw new Error(`Purchase pack not found for packId: ${packId}`);
  }

  try {
    // 3. Use a Prisma transaction for atomic database operations.
    await prisma.$transaction(async (tx) => {
      // 3a. Update user's credit balance.
      await tx.userBalance.upsert({
        where: {
          userId,
        },
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

      await tx.userPurchase.create({
        data: {
          userId,
          stripeId: payment.id, 
          invoiceId: payment.invoice_id, 
          description: `${purchasedPack.name} - ${purchasedPack.credits} credits`,
          amount: payment.amount,
          currency: payment.currency,
        },
        
      });
      console.log("Inserted purchase for", userId, "with Razorpay ID", payment.id);
    });

    console.log(
      `Successfully processed Razorpay purchase ${payment.id} for userId: ${userId}`
    );
  } catch (error) {
    console.error(
      `Failed to process Razorpay payment ${payment.id} for user ${userId}:`,
      error
    );
    throw error;
  }
}
