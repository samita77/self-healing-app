from app.health.failure_classifier import FailureClassifier

FULL = {"S_availability": 100, "E_error_rate": 100}


def test_missing_replicas_wins_over_everything():
    c = FailureClassifier()
    result = c.classify(
        {"S_availability": 10, "E_error_rate": 10}, ready=1, desired=3
    )
    assert result == "INSUFFICIENT_READY_PODS"


def test_unreachable_application():
    c = FailureClassifier()
    assert c.classify({"S_availability": 0}, 2, 2) == "HEALTH_CHECK_FAILURE"


def test_reachable_but_erroring():
    c = FailureClassifier()
    result = c.classify({"S_availability": 90, "E_error_rate": 40}, 2, 2)
    assert result == "HIGH_ERROR_RATE"


def test_slow_but_correct_is_high_latency():
    c = FailureClassifier()
    assert c.classify(FULL, 2, 2, p95_ms=2400.0) == "HIGH_LATENCY"


def test_fast_app_is_not_high_latency():
    """Regression guard - this passed with a broken inverted comparison."""
    c = FailureClassifier()
    assert c.classify(FULL, 2, 2, p95_ms=90.0) == "UNKNOWN"


def test_cpu_exhaustion():
    c = FailureClassifier()
    assert c.classify(FULL, 2, 2, p95_ms=90.0, cpu=0.95) == "CPU_EXHAUSTION"


def test_idle_cpu_is_not_exhaustion():
    """Regression guard - same inverted-comparison class of bug."""
    c = FailureClassifier()
    assert c.classify(FULL, 2, 2, p95_ms=90.0, cpu=0.02) == "UNKNOWN"


def test_memory_exhaustion():
    c = FailureClassifier()
    assert c.classify(FULL, 2, 2, p95_ms=90.0, memory=0.95) == "MEMORY_EXHAUSTION"


def test_missing_components_do_not_crash():
    c = FailureClassifier()
    assert c.classify({}, 2, 2) == "UNKNOWN"
