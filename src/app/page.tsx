export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">QFC Explorer</p>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">
          Fast, transparent, and auditable.
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          The QFC block explorer will surface every block, transaction, and address with
          real-time indexing and analytics.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-400">Status</p>
          <p className="mt-2 text-xl text-white">Indexing not started</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-400">API</p>
          <p className="mt-2 text-xl text-white">/api/health</p>
        </div>
      </section>
    </main>
  );
}
