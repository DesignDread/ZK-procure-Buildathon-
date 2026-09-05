export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const openCheckout = async (
  orderId: string,
  amount: number,
  keyId: string,
  onSuccess: (res: any) => void,
  onFailure: (err: any) => void
) => {
  const res = await loadRazorpayScript();

  if (!res) {
    alert("Razorpay SDK failed to load. Are you online?");
    return;
  }

  const options = {
    key: keyId,
    amount: amount.toString(),
    currency: "INR",
    name: "ZK-Procure",
    description: "Secure Procurement Payment",
    order_id: orderId,
    handler: onSuccess,
    prefill: {
      name: "Buyer Admin",
      email: "buyer@zkprocure.com",
    },
    theme: {
      color: "#3b82f6",
    },
  };

  const paymentObject = new (window as any).Razorpay(options);
  paymentObject.on("payment.failed", onFailure);
  paymentObject.open();
};
