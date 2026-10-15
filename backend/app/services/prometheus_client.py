import httpx

class PrometheusClient:
    def __init__(self, base_url: str = "http://localhost:9090"):
        self.base_url = base_url

    def query(self, promql: str) -> dict:
        try:
            response = httpx.get(
                f"{self.base_url}/api/v1/query",
                params={"query": promql},
                timeout=5.0,
            )
            return response.json()
        except httpx.RequestError as e:
            return {"status": "error", "error": str (e)}

    def get_pod_cpu_usage(self, pod_name_prefix: str) -> float:
        promql = f'sum(rate(container_cpu_usage_seconds_total{{pod=~"{pod_name_prefix}.*"}}[5m]))'
        result = self.query(promql)
        try:
            return float(result["data"]["result"][0]["value"][1])
        except (KeyError, IndexError):
            return 0.0
