class FailureClassifier:
    """Explains *why* a deployment failed, not just that it did.

    A low health score tells an operator nothing actionable. These rules map the degraded component back to a probable cause. Rules are evaluated in order of severity, so the first match is returned"""

    ERROR_RATE_CRITICAL = 80.0  # E_error_rate below this means >20% of probes failed
    LATENCY_CRITICAL_MS = 1500.0
    CPU_CRITICAL = 0.90
    MEMORY_CRITICAL = 0.90

    def classify(
        self,
        components: dict,
        ready: int,
        desired: int,
        p95_ms: float | None = None,
        cpu: float | None = None,
        memory: float | None = None,
    ) -> str:
        if desired > 0 and ready < desired:
            return "INSUFFICIENT_READY_PODS"

        availability = components.get("S_availability")
        if availability is not None and availability < 50:
            return "HEALTH_CHECK_FAILURE"
        
        error_score = components.get("E_error_rate")
        if error_score is not None and error_score < self.ERROR_RATE_CRITICAL:
            return "HIGH_ERROR_RATE"
        
        if p95_ms is not None and p95_ms > self.LATENCY_CRITICAL_MS:
            return "HIGH_LATENCY"
        if cpu is not None and cpu > self.CPU_CRITICAL:
            return "CPU_EXHAUSTION"
        if memory is not None and memory > self.MEMORY_CRITICAL:
            return "MEMORY_EXHAUSTION"

        return "UNKNOWN"

        
