import type { RevisionNote } from "@/lib/learning/types";
export function ConceptSketch({ diagram }: { diagram: RevisionNote["diagram"] }) {
  return <figure className="rounded-xl bg-[#fffdf5] p-4">
    <svg viewBox="0 0 560 100" role="img" aria-label={`${diagram.title}: ${diagram.steps.join(" → ")}`} className="w-full">
      {diagram.steps.map((step,i) => <g key={step} transform={`translate(${i*192+3}, 8)`}><path d="M 3 4 Q 76 -2 170 3 L 168 75 Q 83 80 3 76 Z" fill={i===1 ? "#cff3f7" : "#ffe4ef"} stroke={i===1 ? "#007d87" : "#bf175b"} strokeWidth="1.5" /><path d="M 1 6 L 169 1 L 171 73" fill="none" stroke="#292824" strokeOpacity=".25" strokeWidth=".7" /><text x="85" y="44" textAnchor="middle" fill="#292824" fontSize="13" fontFamily="var(--font-fraunces), serif">{step}</text>{i<2 && <path d="M 174 38 Q 183 34 188 38 L 184 32 M 188 38 L 183 43" fill="none" stroke="#292824" strokeWidth="1.5" strokeLinecap="round" />}</g>)}
    </svg><figcaption className="mt-2 text-center text-xs leading-relaxed text-black/65">{diagram.caption}</figcaption>
  </figure>;
}
