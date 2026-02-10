import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../lib/prisma.js";

export const paystackWebhook = async (
  req: Request & { rawBody?: Buffer },
  res: Response
) => {
  try {
    const signature = req.headers["x-paystack-signature"] as string;

    if (!signature || !req.rawBody) {
      return res.sendStatus(400);
    }

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY as string)
      .update(req.rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.log("❌ Invalid Paystack webhook signature");
      return res.sendStatus(401);
    }

    const event = req.body;

    if (event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const {
      reference,
      amount,
      currency,
      metadata,
      status,
    } = event.data;

    const { transactionId, appId } = metadata || {};

    if (appId !== "ai-site-builder" || !transactionId) {
      return res.sendStatus(200);
    }

    if (status !== "success" || currency !== "NGN") {
      return res.sendStatus(200);
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return res.sendStatus(200);
    }

    // 🔒 Idempotency guard
    if (transaction.isPaid) {
      return res.sendStatus(200);
    }

    // 🔍 Amount verification (Paystack sends kobo)
    if (amount !== transaction.amount * 100) {
      console.log("❌ Amount mismatch");
      return res.sendStatus(400);
    }

    // ✅ Mark transaction as paid
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        isPaid: true,
        reference,
      },
    });

    // ✅ Credit user
    await prisma.user.update({
      where: { id: transaction.userId },
      data: {
        credits: { increment: transaction.credits },
      },
    });

    return res.sendStatus(200);
  } catch (error) {
    console.error("🔥 Paystack webhook error:", error);
    return res.sendStatus(500);
  }
};
