import time
from dataclasses import dataclass, field

import httpx

@dataclass
class ProbeResult:
    total: int
    successes: int
    failures: int
    latencies_ms: list[float] = field(default_factory=list)
    status_codes: list[int] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    @property
    def availability(self) -> float:
        return (self.successes / self.total * 100) if self.total else 0.0

    @property
    def error_rate(self) -> float:
        return (self.failures / self.total * 100) if self.total else 100.0

    @property
    def p95_latency_ms(self) -> float:
        # 0.0 means no probe ever succeeded - the caller must treat that as bad,
        # not as "instantly fast".
        if not self.latencies_ms:
            return 0.0
        ordered = sorted(self.latencies_ms)
        return ordered[min(int(len(ordered) * 0.95), len(ordered) - 1)]

class HealthMonitor:
    def __init__(self, timeout: float = 5.0):
        self.timeout = timeout

    def probe_once(self, url: str) -> tuple[bool, float | None, int | None, str | None]:
        start = time.perf_counter()
        try:
            response = httpx.get(url, timeout=self.timeout)
            elapsed_ms = (time.perf_counter() - start) * 1000
            ok = 200 <= response.status_code < 300
            return ok, elapsed_ms, response.status_code, None if ok else f"HTTP {response.status_code}"
        except httpx.RequestError as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000
            return False, elapsed_ms, None, str(exc)

    def run_window(self, url: str, duration_s: int = 30, interval_s: int = 3) -> ProbeResult:
        result = ProbeResult(total=0, successes=0, failures=0)
        deadline = time.monotonic() + duration_s

        while time.monotonic() < deadline:
            ok, elapsed_ms, code, error = self.probe_once(url)
            result.total +=1
            if code is not None:
                result.status_codes.append(code)

            if ok:
                result.successes +=1
                if elapsed_ms is not None:
                    result.latencies_ms.append(elapsed_ms)

            else:
                result.failures += 1
                if error:
                    result.errors.append(error)

            time.sleep(interval_s)

        return result