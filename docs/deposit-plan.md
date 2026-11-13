# Deposit or pay in full (preview plan)

**Dropped: no deposit option (Christy, Nov 12).** Checkout charges the full session plus enhancements. This note is not in effect and is not built.

Draft for the CFO. Not in effect. This preview does not call Square production and does not create catalog items.

## What parents choose

At checkout a parent chooses one of two amounts to pay now:

- **Deposit:** the $100 nonrefundable deposit (`DEPOSIT_CENTS`), plus any enhancements in full.
- **Pay in full:** the $285 session (`SESSION_PRICE_CENTS`), plus any enhancements in full.

Enhancements are the crème upgrade, the Floral Milk Bath Bag ($18), and the second adult ($25). They are charged in full at booking in both choices. The $100 deposit is the hold on the session, not a partial payment of an add-on.

The $185 balance (`SESSION_PRICE_CENTS` minus `DEPOSIT_CENTS`) remains only when the parent chooses the deposit. Paying in full leaves a balance of $0.

## Square approach for this preview

The amount due now goes through the existing hosted checkout (Square Payment Link / Checkout API). The worker builds the order. The parent pays on Square's page. Card numbers never reach this site.

Two catalog items cover the session portion:

- **Lys Rose Session**, $285, not taxable, for "Pay in full".
- **Session deposit**, $100, not taxable, for "Pay the deposit".

Enhancement items stay as they are (crème upgrades, Floral Milk Bath Bag, second adult). The embroidered robe add-on is not in the catalog.

A custom amount line would also work for the deposit, because the due-now total changes with enhancements. A separate $100 item is clearer on the receipt: the deposit line is always $100, and each enhancement is its own line. The dry-run catalog script lists the deposit item. Running that script does not write to Square.

## What the booking record stores

- `paymentMode`: `deposit` or `full`.
- `balance_due`: $185 or $0.
- `balance_collection`: `{ method: null, dueDaysBeforeSession: null }` until the CFO decides.
- The Square order metadata includes `payment_mode` and `balance_due`.

The client cannot set the dollar amount. The worker computes it from the price table.

## Refund tiers

The refund tiers apply to the $185 balance. The $100 deposit is nonrefundable, whether the parent paid only the deposit or paid in full. Add-ons follow the same timing as the balance. This preview does not add a card fee or a discretionary refund.

If the parent paid only the deposit and then cancels, there is no balance payment to refund. The deposit stays, under the existing deposit rule.

## Collecting the balance (not built)

`BALANCE_COLLECTION` in `assets/booking.js` is the placeholder. `method` is null. `dueDaysBeforeSession` is null. Nothing in the checkout flow charges or invoices the balance.

| Option | How it would work | For | Against |
| --- | --- | --- | --- |
| Square Invoice | Email an invoice for $185 a set number of days before the session. | No card stored. The parent sees a clear amount. | They must pay a second time. A missed invoice needs a follow-up. |
| Second payment link | Email the same style of checkout link for $185. | Matches the booking payment. | Another email to miss. No automatic charge. |
| Card on file | Store a card with Square and charge $185 later. | The balance can be collected without a second checkout. | Needs a Square customer, card-on-file consent, and a rule for a failed charge. |

## Copy

The checkout choice reads "Pay the $100 deposit now" and "Pay $285 now", filled from the price constants. If the deposit is chosen, one line says the $185 balance is still due and that when and how it is collected is not decided yet. No card-fee wording. No discretionary-refund wording.

## Still open for the CFO

- When the balance is due.
- Which of the three collection methods to use.
- What happens if the balance is not paid by that date.
- Whether a deposit booking that is later paid in full should be marked `full` on the same record.
