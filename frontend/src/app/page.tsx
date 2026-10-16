export default async function Home() {
  const res = await fetch("http://localhost:8000/projects", { cache: "no-store" });
  const projects = await res.json();

  return (
    <main className="p-10">
      <h1 className="text-2xl font-semibold mb-4">Projects</h1>
      <ul className="space-y-2">
        {projects.map((p: { id: number; name: string}) =>(
          <li key={p.id} className="text-sm">
            {p.id}. {p.name}
          </li>
        ))}
      </ul>
    </main>
  )
}