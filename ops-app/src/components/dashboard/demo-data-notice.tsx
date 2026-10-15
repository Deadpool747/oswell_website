export function LiveDataUnavailableNotice({ title }: { title: string }) {
  return (
    <section className="rounded-xl border border-[#162131] bg-[#09111C] p-6 shadow-lg shadow-black/20">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">Not available</div>
      <h2 className="mt-2 text-xl font-semibold text-white">No live {title.toLowerCase()} data available.</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#CBD5E1]">
        Oswell displays this area only when a connected production source can provide real records.
      </p>
    </section>
  );
}
