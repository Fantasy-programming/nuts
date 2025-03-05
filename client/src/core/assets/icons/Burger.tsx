import { SVGProps } from "react";
const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 12" preserveAspectRatio="xMidYMid meet" fill="none" {...props}>
    <path stroke="#000" d="M0 1h2M3 1h2M6 1h2M9 1h2M0 6h2M3 6h2M6 6h2M9 6h2M0 11h2M3 11h2M6 11h2M9 11h2" />
  </svg>
);
export default SvgComponent;
