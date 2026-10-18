import time

from app.pipeline.pipeline_stage import PipelineStage
from app.pipeline.states import STAGE_TO_STATE, PipelineState, assert_transition

class PipelineRunner:
    def __init__(self, stages: list[PipelineStage]):
        self.stages = stages

    def run(self, context: dict, on_stage_start=None) -> dict:
        state = PipelineState.RUNNING
        results = []
        run_started = time.perf_counter()

        for stage in self.stages:
            # Each stage maps to the state it moves the pipeline into.
            stage_state = STAGE_TO_STATE.get(stage.name, PipelineState.RUNNING)
            assert_transition(state, stage_state)
            state = stage_state

            if on_stage_start:
                on_stage_start(stage_state)

            started = time.perf_counter()
            try:
                success = stage.execute(context)
            except Exception as exc:
                results.append({
                    "stage": stage.name,
                    "state": stage_state.value,
                    "success": False,
                    "duration_s": round(time.perf_counter() - started, 2),
                    "error": str(exc)[:200],
                })
                state = PipelineState.FAILED
                break

            results.append({
                "stage": stage.name,
                "state": stage_state.value,
                "success": success,
                "duration_s": round(time.perf_counter() - started, 2),
                "error": None,
            })

            if not success:
                state = PipelineState.FAILED
                break
        else:
            # Only runs if no stage broke out of the loop.
            assert_transition(state, PipelineState.SUCCESS)
            state = PipelineState.SUCCESS

        return {
            "status": state.value,
            "results": results,
            "duration_s": round(time.perf_counter() - run_started, 2)
        }
    
        