from abc import ABC, abstractmethod

class PipelineStage(ABC):
    def __init__(self, name: str):
        self.name = name

        @abstractmethod
        def execute(self, context: dict) -> bool:
            """
            Runs this stage. Returns True if successful, False if failed.
            `context` carries shared data between stages (e.g. project info, image tag).
            """
            pass
