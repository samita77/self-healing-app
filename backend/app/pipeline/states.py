from enum import Enum


class PipelineState(str, Enum):
    CREATED = "created"
    RUNNING = "running"
    BUILDING = "building"
    TESTING = "testing"
    SCANNING = "scanning"
    PUSHING = "pushing"
    DEPLOYING = "deploying"
    VERIFYING = "verifying"
    SUCCESS = "success"
    FAILED = "failed"
    ROLLING_BACK = "rolling_back"
    ROLLBACK_COMPLETE = "rollback_complete"

# Which states may follow which. Enforcing this is what makes it a
# state machine rather than a string field - an illegal transition is
# a programming error, not a runtime surprise.

LEGAL_TRANSITIONS: dict[PipelineState, set[PipelineState]] = {
    PipelineState.CREATED:       {PipelineState.RUNNING, PipelineState.FAILED},
    PipelineState.RUNNING:       {PipelineState.BUILDING, PipelineState.TESTING,
                                  PipelineState.PUSHING, PipelineState.FAILED},
    PipelineState.BUILDING:      {PipelineState.TESTING, PipelineState.FAILED},
    PipelineState.TESTING:       {PipelineState.SCANNING, PipelineState.PUSHING,
                                  PipelineState.FAILED},
    PipelineState.SCANNING:      {PipelineState.PUSHING, PipelineState.FAILED},
    # Deploy/Verify stages are not wired into the runner yet, so PUSHING is
    # the current terminal state and must be able to reach SUCCESS. Remove
    # SUCCESS from here once a DeployStage exists and the real path is
    # PUSHING -> DEPLOYING -> VERIFYING -> SUCCESS.
    PipelineState.PUSHING:       {PipelineState.DEPLOYING, PipelineState.SUCCESS,
                                  PipelineState.FAILED},
    PipelineState.DEPLOYING:     {PipelineState.VERIFYING, PipelineState.FAILED},
    PipelineState.VERIFYING:     {PipelineState.SUCCESS, PipelineState.FAILED},
    PipelineState.SUCCESS:       set(),
    PipelineState.FAILED:        {PipelineState.ROLLING_BACK, PipelineState.ROLLBACK_COMPLETE},
    PipelineState.ROLLING_BACK:  {PipelineState.ROLLBACK_COMPLETE, PipelineState.FAILED},
    PipelineState.ROLLBACK_COMPLETE: set(),
}

class IllegalTransition(RuntimeError):
    pass


# A stage is an action ("Build"); a state is a condition ("BUILDING").
# They are deliberately not derived from one another - mapping them by
# string manipulation breaks the moment a name drifts, so it is explicit.
STAGE_TO_STATE: dict[str, PipelineState] = {
    "Build": PipelineState.BUILDING,
    "Test": PipelineState.TESTING,
    "Scan": PipelineState.SCANNING,
    "Push": PipelineState.PUSHING,
    "Deploy": PipelineState.DEPLOYING,
    "Verify": PipelineState.VERIFYING,
}


def can_transition(current: PipelineState, nxt: PipelineState) -> bool:
    return nxt in LEGAL_TRANSITIONS[current]

def assert_transition(current: PipelineState, nxt: PipelineState) -> None:
    if not can_transition(current, nxt):
        raise IllegalTransition(f"{current.value} -> {nxt.value} is not permitted")