# Runbook: HighLatencyP99

**Severity:** warning (posted to #alerts-warning)
**Fires when:** the slowest 1% of a service's requests take over 1 second, for 5 minutes.

## What it means
Most customers are fine, but a noticeable share wait too long. Left alone, slowness often turns into errors.

## Check
1. Open **Service Overview (RED)**. Which service has the high p99? Is the error rate also rising?
2. Find slow traces in Explore with Tempo: `{resource.service.name="gateway" && duration > 1s}`. The longest bar in the waterfall is the slow step.
3. Open **Infrastructure (Node)**. Is CPU or memory near its limit?

## Common causes and fixes
- **A slow or missing service further down the chain.** The gateway waits up to 5 seconds for a reply, the order service up to 3 seconds. Seen on November 11, 2026, when product was down: gateway p99 rose to about 2.3 seconds. Fix the service the trace points to.
- **The node is overloaded.** Seen on November 11, 2026, as p99 spikes above 1 second while the laptop was busy. Fix: reduce load, or raise CPU limits if pods are throttled (check the built-in CPUThrottlingHigh alert).
- **Cache unavailable**, so every request goes to postgres. Check `kubectl logs deploy/product -n shop | grep -i redis`.

## Confirm it is fixed
The p99 line falls back under the 1 second line, and Slack posts **[RESOLVED] HighLatencyP99**.

## Escalate
If latency keeps rising or errors appear, treat it as HighErrorRate.
