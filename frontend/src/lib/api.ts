const BASE = "http://localhost:8000";

export async function getProjects() {
    return (await fetch( `${BASE}/projects`)).json();
}