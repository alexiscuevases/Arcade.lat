import type { PagesFunction } from "@cloudflare/workers-types"
import Stripe from "stripe"
import type { Env } from "../../lib/env"
import { json, error } from "../../lib/response"
import {
  getUserById,
  updateUserPlan,
  upsertSubscription,
} from "../../lib/db"

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) return error("Missing stripe-signature", 400)

  const stripe = new Stripe(env.STRIPE_SECRET_KEY)

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    )
  } catch {
    return error("Invalid webhook signature", 400)
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan as "BASIC" | "PRO"

      if (!userId || !plan) break

      const user = await getUserById(env.DB, userId)
      if (!user) break

      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string
        )
        await upsertSubscription(env.DB, {
          id: crypto.randomUUID(),
          user_id: userId,
          stripe_subscription_id: sub.id,
          plan,
          status: sub.status,
          current_period_end: sub.current_period_end,
        })
      }

      await updateUserPlan(env.DB, userId, plan)
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const plan =
        (sub.metadata?.plan as "BASIC" | "PRO") ??
        (sub.items.data[0]?.price?.nickname as "BASIC" | "PRO" | undefined) ??
        "BASIC"

      // Find user by customer id
      const customer = await stripe.customers.retrieve(sub.customer as string)
      if (customer.deleted) break

      await upsertSubscription(env.DB, {
        id: crypto.randomUUID(),
        user_id: sub.metadata?.userId ?? "",
        stripe_subscription_id: sub.id,
        plan,
        status: sub.status,
        current_period_end: sub.current_period_end,
      })
      break
    }

    case "invoice.paid": {
      // Ensure subscription stays active after renewal
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        )
        await upsertSubscription(env.DB, {
          id: crypto.randomUUID(),
          user_id: sub.metadata?.userId ?? "",
          stripe_subscription_id: sub.id,
          plan:
            (sub.metadata?.plan as "BASIC" | "PRO") ?? "BASIC",
          status: sub.status,
          current_period_end: sub.current_period_end,
        })
      }
      break
    }
  }

  return json({ received: true })
}
