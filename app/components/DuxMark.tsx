export default function DuxMark({ className = 'mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 341 134" role="img" aria-label="Dux Bowling">
      <defs>
        <g id="duxmark">
          <path d="M15 15 V105" /><path d="M15 15 H45 A45 45 0 0 1 45 105 H15" />
          <path d="M145 15 V75 A30 32 0 0 0 205 75 V15" />
          <path d="M254 15 L314 105" /><path d="M314 15 L254 105" />
        </g>
        <mask id="duxcut">
          <g transform="translate(6 6)" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <use href="#duxmark" stroke="#fff" strokeWidth="30" />
            <use href="#duxmark" stroke="#000" strokeWidth="9" />
          </g>
        </mask>
      </defs>
      <rect width="341" height="134" fill="#e8834a" mask="url(#duxcut)" />
    </svg>
  );
}
