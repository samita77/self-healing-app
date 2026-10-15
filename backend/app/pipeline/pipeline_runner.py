from app.pipeline.pipeline_stage import PipelineStage

class PipelineRunner:
    def __init__(self, stages: list[PipelineStage]):
        self.stages = stages

    def run(self, context: dict) -> dict:
        results = []

        for stage in self.stages:
            success = stage.execute(context)
            results.append({"stage": stage.name, "success": success})

            if not success:
                return {
                    "status": "failed",
                    "failed_at": stage.name,
                    "results": results,
                }

        return {"status": "success", "results": results}