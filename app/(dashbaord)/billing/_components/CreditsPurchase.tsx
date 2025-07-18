"use client";

import { purchaseCredits, verifyRazorpayPayment } from "@/actions/billings";
import { CreditsPack, PackId } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CoinsIcon, CreditCardIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// Define the type for the Razorpay order returned from our server action
interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

// Define the type for the successful payment response from Razorpay
interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const CreditsPurchase = () => {
  const [selectedPack, setSelectedPack] = useState<PackId>(PackId.MEDIUM);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Effect to load the Razorpay script when the component mounts
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePurchase = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Preparing your order...");

    try {
      // Step 1: Call the server action to create a Razorpay order
      const order: RazorpayOrder = await purchaseCredits(selectedPack);

      if (!order || !order.id) {
        throw new Error("Failed to create Razorpay order.");
      }

      toast.loading("Redirecting to payment...", { id: toastId });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Your Razorpay Key ID from .env.local
        amount: order.amount,
        currency: order.currency,
        name: "Your App Name", // Replace with your app's name
        description: "Credits Purchase",
        order_id: order.id,

        // Step 3: Define the handler function for payment success
        handler: async (response: RazorpayPaymentResponse) => {
          toast.loading("Verifying your payment...", { id: toastId });
          try {
            // Step 4: Call the NEW server action to verify the payment
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success("Payment successful! Credits have been added.", { id: toastId });
            router.refresh(); // Refresh the page to show the new balance
          } catch (verifyError) {
             const errorMessage = verifyError instanceof Error ? verifyError.message : "Unknown verification error";
             toast.error(`Payment verification failed: ${errorMessage}`, { id: toastId });
          }
        },
        modal: {
            ondismiss: function() {
                toast.info("Payment was not completed.", { id: toastId });
            }
        },
        prefill: {
          // You can prefill user details here if you have them
          name: "Test User",
          email: "test.user@example.com",
        },
        theme: {
          color: "#000000", // Theme color
        },
      };

      // Step 5: Open the Razorpay payment modal
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Purchase failed: ${errorMessage}`, { id: toastId });
    } finally {
      // Don't set isLoading to false here, as the user is now in the Razorpay modal
      // It will be effectively 'unloaded' when the modal closes or payment succeeds.
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <CoinsIcon className="h-6 w-6 text-primary" />
          Purchase Credits
        </CardTitle>
        <CardDescription>
          Select the number of credits you want to purchase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          onValueChange={(value) => setSelectedPack(value as PackId)}
          value={selectedPack}
        >
          {CreditsPack.map((pack) => (
            <div
              key={pack.id}
              className="flex items-center space-x-3 bg-secondary/50 rounded-lg p-3 hover:bg-secondary cursor-pointer"
              onClick={() => setSelectedPack(pack.id)}
            >
              <RadioGroupItem value={pack.id} id={pack.id} />
              <Label
                htmlFor={pack.id}
                className="flex justify-between cursor-pointer w-full"
              >
                <span className="font-medium">
                  {pack.name} - {pack.credits} credits
                </span>
                <span className="font-bold text-primary">
                  INR {(pack.price / 100).toFixed(2)}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={isLoading}
          onClick={handlePurchase}
        >
          {isLoading ? "Processing..." : <><CreditCardIcon className="h-5 w-5 mr-2" /> Purchase Credits</>}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreditsPurchase;
