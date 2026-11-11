# Runbook: PodCrashLooping

**Severity:** critical (posted to #all-alerts-critical)
**Fires when:** a container in the shop namespace restarts more than 3 times in 1 hour.

## What it means
A container keeps dying and Kubernetes keeps restarting it, waiting longer each time (CrashLoopBackOff). CrashLoopBackOff is the symptom, not the cause.

## Check
1. Find the pod: `kubectl get pods -n shop`
2. See why it last stopped: `kubectl describe pod <pod> -n shop`, under **Last State**, read the **Reason** (for example `OOMKilled` or `Error`) and the **Exit Code**.
3. Read the logs from the crash before the restart: `kubectl logs <pod> -n shop --previous`

## Common causes and fixes
- **OOMKilled** (needed more memory than its limit). Real incident on November 11, 2026: Grafana crash looped with a 256 MiB limit. Fix: raise the memory limit (Grafana was raised to 512 MiB with `helm upgrade`).
- **Missing setting.** The services exit on purpose if a setting is missing; the log says `Missing environment variables`. Fix the `env` section of the Deployment and apply it again.
- **A dependency is down at startup.** The log says `Startup failed`. Fix postgres or redis first; the service then recovers on its own.
- **A bad image.** Roll back: `kubectl rollout undo deployment/<name> -n shop`

Note: these services use readiness probes only. A failing readiness probe never restarts a container, so the cause is the app itself, not a probe.

## Confirm it is fixed
The pod shows `1/1 Running` and its restart count stops rising. Slack posts **[RESOLVED] PodCrashLooping**.

## Escalate
If the cause is unclear after reading the previous logs, escalate to the application owner with the `describe` and `logs --previous` output.
