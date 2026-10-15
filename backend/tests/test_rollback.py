from app.rollback.rollback_engine import RollbackEngine

def test_healthy_status_does_not_roll_back():
    engine = RollbackEngine()
    decision = engine.decide(95.0, "SUCCESSFUL", 1, True)
    assert decision["should_rollback"] is False

def test_warning_status_does_not_roll_back():
    engine = RollbackEngine()
    decision = engine.decide(70.0, "WARNING", 1, True)
    assert decision["should_rollback"] is False

def test_single_failure_waits_for_confirmation():
    engine = RollbackEngine()
    decision = engine.decide(20.0, "FAILED", 1, True)
    assert decision["should_rollback"] is False
    assert "1/2" in decision["reason"]

def test_repeated_failure_triggers_roll_back():
    engine = RollbackEngine()
    decision = engine.decide(20.0, "FAILED", 2, True)
    assert decision["should_rollback"] is True

def test_first_deployment_failure_does_not_roll_back():
    engine = RollbackEngine()
    decision = engine.decide(20.0, "FAILED", 2, False)
    assert decision["should_rollback"] is False
    assert "first version" in decision["reason"]

def test_failure_counter_resets_on_success():
    assert RollbackEngine.next_failure_count(2, "SUCCESSFUL") == 0
    assert RollbackEngine.next_failure_count(0, "FAILED") == 1