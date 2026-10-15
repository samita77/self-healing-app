import math

from app.health.health_monitor import ProbeResult

DEFAULT_WEIGHTS = {
    "availability": 0.40,
    "response_time": 0.30,
    "error_rate": 0.20,
    "pod_readiness": 0.10,
}

class HealthScorer:
    def __init__(self, weights: dict = None, latency_tau_ms: float = 400.0):
        self.weights = {**DEFAULT_WEIGHTS, **(weights or {})}
        self.latency_tau_ms = latency_tau_ms

    def response_time_score(self, p95_ms: float) -> float:
        # Exponential decay. tau is the latency at which the score fails to ~37%
        # p95=0 means every probe failed, so this is a zero, not a perfect score.
        if p95_ms <= 0:
            return 0.0
        return 100.0 * math.exp(-p95_ms / self.latency_tau_ms)

    def score(self, probe: ProbeResult, pod_readiness: float) -> dict:
        s = probe.availability
        r = self.response_time_score(probe.p95_latency_ms)
        e = 100.0 * (1.0 - probe.error_rate /100.0)
        p = pod_readiness

        h = (
            self.weights["availability"] * s
            + self.weights["response_time"] * r
            + self.weights["error_rate"] * e
            + self.weights["pod_readiness"] * p
        )

        if h >= 80:
            status = "SUCCESSFUL"
        elif h >= 50:
            status = "WARNING"
        else:
            status = "FAILED"

        return {
            "score": round(h, 2),
            "status": status,
            "components": {
                "S_availability": round(s, 2),
                "R_response_time": round(r, 2),
                "E_error_rate": round(e, 2),
                "P_pod_readiness": round(p, 2),
            },
            "probes": {
                "total": probe.total,
                "successes": probe.successes,
                "failures": probe.failures,
                "p95_latency_ms": round(probe.p95_latency_ms, 2)
            }
        }
