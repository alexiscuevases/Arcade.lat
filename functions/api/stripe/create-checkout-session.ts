import type { PagesFunction } from "@cloudflare/workers-types"
import Stripe from "stripe"
import type { Env } from "../../lib/env"
import { json, error } from "../../lib/response"
import { requireAuth } from "../../lib/auth"
import { getUserById, updateUserStripeCustomer } from "../../lib/db"

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env.JWT_SECRET)
  if (auth instanceof Response) return auth

  const body = await request.json<{ plan: "BASIC" | "PRO" }>()
  if (!body.plan || !["BASIC", "PRO"].includes(body.plan)) {
    return error("Invalid plan")
  }

  const user = await getUserById(env.DB, auth.userId)
  if (!user) return error("User not found", 404)

  const stripe = new Stripe(env.STRIPE_SECRET_KEY)

  let customerId = user.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email })
    customerId = customer.id
    await updateUserStripeCustomer(env.DB, auth.userId, customerId)
  }

  const priceId =
    body.plan === "BASIC" ? env.STRIPE_PRICE_BASIC : env.STRIPE_PRICE_PRO

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.APP_URL}/dashboard?success=true`,
    cancel_url: `${env.APP_URL}/pricing`,
    metadata: { userId: auth.userId, plan: body.plan },
  })

  return json({ url: session.url })
}
