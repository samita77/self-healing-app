"""Exponential Moving Average trend detector for health metrics.

Z_t = lambda * X_t + (1 - lambda) * Z_{t-1}

Flags "degrading" when EWMA crosses a soft threshold relative to the
baseline (first observed value).
"""


class TrendDetector:
    def __init__(self, lambda_factor: float = 0.3,
                 degrading_multiplier: float = 1.5):
        self.lambda_factor = lambda_factor
        self.degrading_multiplier = degrading_multiplier
        # deployment_id -> {
        #   "ewma_p95": float|None,
        #   "ewma_error_rate": float|None,
        #   "baseline_p95": float|None,
        #   "baseline_error_rate": float|None,
        # }
        self._state: dict[int, dict] = {}

    def update(self, deployment_id: int, p95_ms: float | None,
               error_rate: float | None) -> dict:
        """Update EWMA for a deployment and return trend status."""
        state = self._state.setdefault(deployment_id, {
            "ewma_p95": None,
            "ewma_error_rate": None,
            "baseline_p95": None,
            "baseline_error_rate": None,
        })

        lam = self.lambda_factor

        if p95_ms is not None:
            if state["ewma_p95"] is None:
                state["ewma_p95"] = p95_ms
                state["baseline_p95"] = p95_ms
            else:
                state["ewma_p95"] = (
                    lam * p95_ms + (1 - lam) * state["ewma_p95"]
                )

        if error_rate is not None:
            if state["ewma_error_rate"] is None:
                state["ewma_error_rate"] = error_rate
                state["baseline_error_rate"] = error_rate
            else:
                state["ewma_error_rate"] = (
                    lam * error_rate + (1 - lam) * state["ewma_error_rate"]
                )

        trend = "stable"
        if (state["ewma_p95"] is not None
                and state["baseline_p95"] is not None):
            if state["ewma_p95"] > state["baseline_p95"] * self.degrading_multiplier:
                trend = "degrading"
            elif state["ewma_p95"] < state["baseline_p95"] / self.degrading_multiplier:
                trend = "improving"
        state["trend"] = trend

        return {
            "trend": trend,
            "ewma_p95": state["ewma_p95"],
            "ewma_error_rate": state["ewma_error_rate"],
        }

    def is_degrading(self, deployment_id: int) -> bool:
        state = self._state.get(deployment_id)
        if state is None:
            return False
        return state.get("trend") == "degrading"
