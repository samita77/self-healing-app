import pytest

from app.pipeline.pipeline_runner import PipelineRunner
from app.pipeline.pipeline_stage import PipelineStage
from app.pipeline.states import (
    LEGAL_TRANSITIONS,
    IllegalTransition,
    PipelineState,
    assert_transition,
    can_transition,
)


# ---------- state machine ----------


def test_created_can_move_to_running():
    assert can_transition(PipelineState.CREATED, PipelineState.RUNNING)


def test_illegal_jump_is_rejected():
    assert not can_transition(PipelineState.BUILDING, PipelineState.SUCCESS)


def test_assert_transition_raises_on_illegal_move():
    with pytest.raises(IllegalTransition):
        assert_transition(PipelineState.BUILDING, PipelineState.SUCCESS)


def test_every_state_has_a_transition_entry():
    # Guards against a KeyError when a state is added to the enum but
    # forgotten in the map.
    for state in PipelineState:
        assert state in LEGAL_TRANSITIONS


def test_success_is_terminal():
    assert LEGAL_TRANSITIONS[PipelineState.SUCCESS] == set()


# ---------- runner ----------


class _Ok(PipelineStage):
    def __init__(self, name):
        super().__init__(name=name)

    def execute(self, context):
        return True


class _Fails(PipelineStage):
    def __init__(self, name):
        super().__init__(name=name)

    def execute(self, context):
        return False


class _Raises(PipelineStage):
    def __init__(self, name):
        super().__init__(name=name)

    def execute(self, context):
        raise RuntimeError("boom")


def test_all_stages_pass_reaches_success():
    result = PipelineRunner([_Ok("Build"), _Ok("Test"), _Ok("Push")]).run({})
    assert result["status"] == "success"
    assert len(result["results"]) == 3


def test_failing_stage_halts_the_pipeline():
    result = PipelineRunner(
        [_Ok("Build"), _Fails("Test"), _Ok("Push")]
    ).run({})
    assert result["status"] == "failed"
    # Push must never run.
    assert [r["stage"] for r in result["results"]] == ["Build", "Test"]


def test_raising_stage_is_captured_not_propagated():
    result = PipelineRunner([_Ok("Build"), _Raises("Test")]).run({})
    assert result["status"] == "failed"
    failed = [r for r in result["results"] if not r["success"]][0]
    assert failed["stage"] == "Test"
    assert "boom" in failed["error"]


def test_every_stage_records_a_duration():
    # All three stages are required: only PUSHING (or DEPLOYING) may reach
    # SUCCESS, so a truncated pipeline is correctly rejected by the machine.
    result = PipelineRunner([_Ok("Build"), _Ok("Test"), _Ok("Push")]).run({})
    for stage in result["results"]:
        assert "duration_s" in stage
        assert stage["duration_s"] >= 0


def test_pipeline_that_cannot_reach_success_is_rejected():
    """A truncated pipeline has no legal path to SUCCESS."""
    with pytest.raises(IllegalTransition):
        PipelineRunner([_Ok("Build"), _Ok("Test")]).run({})


def test_stage_states_advance_through_the_machine():
    result = PipelineRunner([_Ok("Build"), _Ok("Test"), _Ok("Push")]).run({})
    assert [r["state"] for r in result["results"]] == [
        "building",
        "testing",
        "pushing",
    ]
