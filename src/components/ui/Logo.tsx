interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className, size = 32 }: LogoProps) {
  const scale = size / 32
  const width = 78 * scale
  const height = 74 * scale

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 78 74"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g filter="url(#filter0_f_logo)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M22.6667 22.5H25.3333V25.1667H28V27.8333H36V25.1667H38.6667V22.5H41.3333V27.1667H38.6667V27.8333H42.6667V30.5H45.3333V24.5H48V35.1667H45.3333V40.5H42.6667V41.1667H45.3333V45.8333H42.6667V43.1667H40V40.5H24V43.1667H21.3333V45.8333H18.6667V41.1667H21.3333V40.5H18.6667V35.1667H16V24.5H18.6667V30.5H21.3333V27.8333H25.3333V27.1667H22.6667V22.5ZM36 32.5V33.1667H38.6667V32.5H36ZM25.3333 32.5V33.1667H28V32.5H25.3333Z"
          fill="#215F36"
        />
      </g>
      <g filter="url(#filter1_ddif_logo)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M25.3333 21.8333H22.6667V24.5H25.3333V27.1667H21.3333V29.8333H18.6667V23.8333H16V32.5H18.6667V37.8333H21.3333V40.5H18.6667V43.1667H21.3333V40.5H24V37.8333H40V40.5H42.6667V43.1667H45.3333V40.5H42.6667V37.8333H45.3333V32.5H48V23.8333H45.3333V29.8333H42.6667V27.1667H38.6667V24.5H41.3333V21.8333H38.6667V24.5H36V27.1667H28V24.5H25.3333V21.8333ZM34.6667 29.8333H38.6667V32.5H34.6667V29.8333ZM25.3333 29.8333H29.3333V32.5H25.3333V29.8333Z"
          fill="#D2FFE2"
        />
      </g>
      <defs>
        <filter
          id="filter0_f_logo"
          x="15.3333"
          y="21.8333"
          width="33.3333"
          height="24.6667"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="0.333333" result="effect1_foregroundBlur_logo" />
        </filter>
        <filter
          id="filter1_ddif_logo"
          x="-13.3333"
          y="-6.16667"
          width="90.6667"
          height="80"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1.33333" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.56 0 0 0 0 1 0 0 0 0 0 0 0 0 1 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_logo" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1.33333" />
          <feGaussianBlur stdDeviation="14.6667" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.74 0 0 0 0 1 0 0 0 0 0 0 0 0 1 0" />
          <feBlend mode="normal" in2="effect1_dropShadow_logo" result="effect2_dropShadow_logo" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_logo" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="8" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.68 0 0 0 0 1 0 0 0 0 0 0 0 0 1 0" />
          <feBlend mode="normal" in2="shape" result="effect3_innerShadow_logo" />
          <feGaussianBlur stdDeviation="0.333333" result="effect4_foregroundBlur_logo" />
        </filter>
      </defs>
    </svg>
  )
}
