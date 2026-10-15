from app.health.health_monitor import ProbeResult
from app.health.health_scorer import HealthScorer

def test_healthy_probe_scores_successful():
    probe = ProbeResult(total=10, successes=10, failures=0, latencies_ms=[80.0] * 10)
    result = HealthScorer().score(probe, pod_readiness=100)
    assert result["status"] == "SUCCESSFUL"
    assert result["score"] > 80

def test_all_probes_failing_scores_zero():
    probe = ProbeResult(total=10, successes=0, failures=10)
    result = HealthScorer().score(probe, pod_readiness=0)
    assert result ["status"] == "FAILED"

def test_no_successful_probes_is_not_a_perfect_latency():
    scorer = HealthScorer()
    assert scorer.response_time_score(0) == 0.0

def test_weights_are_configurable():
    scorer = HealthScorer(weights={"availability": 1.0,
                                   "response_time": 0.0,
                                   "error_rate": 0.0,
                                   "pod_readiness": 0.0})
    probe = ProbeResult(total=10, successes=5, failures=5, latencies_ms=[100.0] * 5)
    assert scorer.score(probe, pod_readiness=0)["score"] == 50.0