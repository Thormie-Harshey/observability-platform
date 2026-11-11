# Runbook: HighErrorRate

**Severity:** critical (posted to #all-alerts-critical)
**Fires when:** more than 5% of a service's requests return a 5xx error for 5 minutes.

## What it means
Customers are getting failures. 5xx means the server failed, not the customer (4xx errors such as 404 are not counted).

## Check
1. Open the **Service Overview (RED)** dashboard. Note which services are erroring. If gateway and order fail but product does not appear, suspect product (the service the others depend on).
2. Check the pods: `kubectl get pods -n shop`
3. Read the errors in **Application Logs**, or in Explore with Loki: `{namespace="shop"} | json | level >= 50`
4. Open a failing trace in Explore with Tempo: `{status=error}`. The red span shows which service broke.

## Common causes and fixes
- **A service the others depend on is down.** The gateway returns 502 and the order service returns 503. Seen in testing on November 11, 2026, when product was scaled to zero. Fix: `kubectl scale deployment product -n shop --replicas=1`, then find out why it stopped with `kubectl describe deployment product -n shop`.
- **Database or cache unreachable.** Check `kubectl get pods -n shop -l app=postgres` and `kubectl logs deploy/product -n shop --tail=50`.
- **A bad release.** Roll back: `kubectl rollout undo deployment/<name> -n shop`

## Confirm it is fixed
The error rate panel drops below the 5% line, and Slack posts **[RESOLVED] HighErrorRate**.

## Escalate
If not resolved within 15 minutes, escalate to the application owner.
